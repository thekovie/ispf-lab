/**
 * Export / Import Lab: one versioned JSON bundle holding everything the browser keeps for a userid —
 * catalog, edit profiles, lesson progress and settings. ADR 0013.
 *
 * Validation is structural and defensive: every field is rebuilt from known keys with type checks, so a hand-edited
 * or foreign file can never inject unknown properties, and nothing in the file is ever executed. The catalog-only
 * export of v0.1 (`{app:"ispf-lab", catalog}`) is accepted as version 1 and migrated.
 */
import { isValidDsname, isValidMemberName } from "@/catalog/catalog";
import type { Catalog, Dataset, Member, Recfm, SpaceUnits } from "@/catalog/types";
import type { EditProfiles } from "@/editor/profile";
import { EMPTY_JES, type JesState } from "@/jes/types";
import { loadJes, sanitizeJes, saveJes } from "./jesStore";
import { loadCatalog, saveCatalog } from "./catalogStore";
import { loadProfiles, sanitizeProfiles, saveProfiles } from "./profileStore";
import { EMPTY_PROGRESS, loadProgress, saveProgress, type LessonProgress, type Progress } from "./progressStore";
import { DEFAULT_SETTINGS, loadSettings, saveSettings, type Settings } from "./settingsStore";
import type { StorageAdapter } from "./storage";

export const BUNDLE_FORMAT = "ispf-lab";
export const BUNDLE_VERSION = 2;
export const MAX_BUNDLE_BYTES = 5 * 1024 * 1024;

export interface LabBundle {
  format: typeof BUNDLE_FORMAT;
  version: typeof BUNDLE_VERSION;
  exportedAt: string;
  userid: string;
  catalog: Catalog;
  editProfiles: EditProfiles;
  progress: Progress;
  settings: Settings;
  jobs: JesState;
}

export interface ImportSummary {
  userid: string;
  datasets: number;
  members: number;
  profiles: number;
  lessons: number;
  jobs: number;
  migratedFrom?: number;
}

export class BundleError extends Error {}

const RECFMS = new Set<Recfm>(["FB", "VB", "F", "V", "U"]);
const SPACE_UNITS = new Set<SpaceUnits>(["TRKS", "CYLS", "BLKS"]);
const STATUSES = new Set<LessonProgress["status"]>(["not-started", "in-progress", "completed"]);

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);
const num = (v: unknown, fallback: number): number => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
const optNum = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
const optStr = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);
const strings = (v: unknown, where: string): string[] => {
  if (!Array.isArray(v) || v.some((r) => typeof r !== "string")) throw new BundleError(`${where}: records must be an array of strings`);
  return v as string[];
};

function validateMember(raw: unknown, where: string): Member {
  if (!isObj(raw)) throw new BundleError(`${where}: member is not an object`);
  const name = str(raw.name).toUpperCase();
  if (!isValidMemberName(name)) throw new BundleError(`${where}: invalid member name "${name}"`);
  return {
    name,
    records: strings(raw.records, `${where}(${name})`),
    createdAt: optStr(raw.createdAt),
    modifiedAt: optStr(raw.modifiedAt),
    modifiedBy: optStr(raw.modifiedBy),
    version: optNum(raw.version),
    mod: optNum(raw.mod),
  };
}

function validateDataset(raw: unknown, key: string): Dataset {
  if (!isObj(raw)) throw new BundleError(`data set ${key} is not an object`);
  const name = str(raw.name, key).toUpperCase();
  if (!isValidDsname(name) || name !== key.toUpperCase()) throw new BundleError(`invalid data set name "${key}"`);
  const datasetType = raw.datasetType === "PS" ? "PS" : raw.datasetType === "PDS" ? "PDS" : null;
  if (!datasetType) throw new BundleError(`${name}: datasetType must be PDS or PS`);
  const recfm = RECFMS.has(raw.recfm as Recfm) ? (raw.recfm as Recfm) : null;
  if (!recfm) throw new BundleError(`${name}: unknown record format`);
  const lrecl = num(raw.lrecl, -1);
  if (lrecl < 0 || lrecl > 32760) throw new BundleError(`${name}: invalid record length`);
  const ds: Dataset = {
    id: name,
    name,
    datasetType,
    dsorg: datasetType === "PDS" ? "PO" : "PS",
    recfm,
    lrecl,
    blksize: num(raw.blksize, lrecl || 32760),
    volume: str(raw.volume, "USR001").toUpperCase().slice(0, 6),
    readOnly: raw.readOnly === true,
    spaceUnits: SPACE_UNITS.has(raw.spaceUnits as SpaceUnits) ? (raw.spaceUnits as SpaceUnits) : "TRKS",
    primary: num(raw.primary, 1),
    secondary: num(raw.secondary, 0),
    dirBlocks: num(raw.dirBlocks, datasetType === "PDS" ? 10 : 0),
    createdAt: str(raw.createdAt, ""),
    owner: str(raw.owner, name.split(".")[0]).toUpperCase(),
  };
  if (datasetType === "PDS") {
    if (!isObj(raw.members)) throw new BundleError(`${name}: a PDS needs a members object`);
    const members: Record<string, Member> = {};
    for (const [mk, mv] of Object.entries(raw.members)) {
      const m = validateMember(mv, name);
      if (m.name !== mk.toUpperCase()) throw new BundleError(`${name}: member key "${mk}" does not match its name`);
      members[m.name] = m;
    }
    return { ...ds, members };
  }
  return { ...ds, records: strings(raw.records ?? [], name) };
}

export function validateCatalog(raw: unknown): Catalog {
  if (!isObj(raw) || raw.version !== 1 || !isObj(raw.datasets)) throw new BundleError("catalog is missing or has an unknown version");
  const datasets: Record<string, Dataset> = {};
  for (const [key, value] of Object.entries(raw.datasets)) datasets[key.toUpperCase()] = validateDataset(value, key);
  return { version: 1, hlq: str(raw.hlq, "").toUpperCase(), datasets };
}

export function validateProgress(raw: unknown): Progress {
  if (!isObj(raw) || raw.version !== 1 || !isObj(raw.lessons)) return EMPTY_PROGRESS;
  const lessons: Record<string, LessonProgress> = {};
  for (const [id, value] of Object.entries(raw.lessons)) {
    if (!isObj(value) || !/^[a-z0-9-]{1,40}$/.test(id)) continue;
    lessons[id] = {
      status: STATUSES.has(value.status as LessonProgress["status"]) ? (value.status as LessonProgress["status"]) : "not-started",
      attempts: num(value.attempts, 0),
      hintsUsed: num(value.hintsUsed, 0),
      mistakes: num(value.mistakes, 0),
      bestScore: optNum(value.bestScore),
      completedAt: optStr(value.completedAt),
    };
  }
  return { version: 1, currentLessonId: optStr(raw.currentLessonId), lessons };
}

export function validateSettings(raw: unknown): Settings {
  if (!isObj(raw)) return DEFAULT_SETTINGS;
  const scroll = raw.scrollDefault;
  return {
    pfKeysShown: typeof raw.pfKeysShown === "boolean" ? raw.pfKeysShown : DEFAULT_SETTINGS.pfKeysShown,
    insertMode: typeof raw.insertMode === "boolean" ? raw.insertMode : DEFAULT_SETTINGS.insertMode,
    scrollDefault: scroll === "PAGE" || scroll === "HALF" || scroll === "CSR" || scroll === "DATA" ? scroll : DEFAULT_SETTINGS.scrollDefault,
  };
}

/** Everything stored for `userid`, ready to serialise. */
export function buildBundle(storage: StorageAdapter, userid: string, now = new Date()): LabBundle {
  const u = userid.toUpperCase();
  return {
    format: BUNDLE_FORMAT,
    version: BUNDLE_VERSION,
    exportedAt: now.toISOString(),
    userid: u,
    catalog: loadCatalog(storage, u),
    editProfiles: loadProfiles(storage, u),
    progress: loadProgress(storage),
    settings: loadSettings(storage),
    jobs: loadJes(storage, u),
  };
}

export function serializeBundle(bundle: LabBundle): string {
  return JSON.stringify(bundle, null, 2);
}

/**
 * Parse and validate an exported file. Accepts the current format and the v0.1 catalog-only export
 * (`{app:"ispf-lab", catalog}`), which becomes a bundle with empty profiles/progress and default settings.
 */
export function parseBundle(json: string): { bundle: LabBundle; migratedFrom?: number } {
  if (json.length > MAX_BUNDLE_BYTES) throw new BundleError("file is larger than 5 MB");
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new BundleError("file is not valid JSON");
  }
  if (!isObj(raw)) throw new BundleError("file is not an ISPF Lab export");
  if (raw.format === BUNDLE_FORMAT && raw.version === BUNDLE_VERSION) {
    const catalog = validateCatalog(raw.catalog);
    const userid = str(raw.userid, catalog.hlq).toUpperCase();
    if (!/^[A-Z#$@][A-Z0-9#$@]{0,6}$/.test(userid)) throw new BundleError("invalid userid in file");
    return {
      bundle: {
        format: BUNDLE_FORMAT,
        version: BUNDLE_VERSION,
        exportedAt: str(raw.exportedAt, ""),
        userid,
        catalog,
        editProfiles: sanitizeProfiles(raw.editProfiles),
        progress: validateProgress(raw.progress),
        settings: validateSettings(raw.settings),
        jobs: sanitizeJes(raw.jobs),
      },
    };
  }
  if (raw.app === BUNDLE_FORMAT && isObj(raw.catalog)) {
    const catalog = validateCatalog(raw.catalog);
    const userid = catalog.hlq || "USER01";
    return {
      bundle: { format: BUNDLE_FORMAT, version: BUNDLE_VERSION, exportedAt: str(raw.exportedAt, ""), userid, catalog, editProfiles: {}, progress: EMPTY_PROGRESS, settings: DEFAULT_SETTINGS, jobs: EMPTY_JES },
      migratedFrom: 1,
    };
  }
  if (raw.format === BUNDLE_FORMAT) throw new BundleError(`unsupported export version ${String(raw.version)}`);
  throw new BundleError("file is not an ISPF Lab export");
}

/** Write a validated bundle into storage for its userid (catalog and profiles per userid; progress and settings are global). */
export function applyBundle(storage: StorageAdapter, bundle: LabBundle, migratedFrom?: number): ImportSummary {
  saveCatalog(storage, bundle.userid, bundle.catalog);
  saveProfiles(storage, bundle.userid, bundle.editProfiles);
  saveProgress(storage, bundle.progress);
  saveSettings(storage, bundle.settings);
  saveJes(storage, bundle.userid, bundle.jobs);
  const datasets = Object.values(bundle.catalog.datasets);
  return {
    userid: bundle.userid,
    datasets: datasets.length,
    members: datasets.reduce((n, d) => n + Object.keys(d.members ?? {}).length, 0),
    profiles: Object.keys(bundle.editProfiles).length,
    lessons: Object.keys(bundle.progress.lessons).length,
    jobs: bundle.jobs.jobs.length,
    migratedFrom,
  };
}
