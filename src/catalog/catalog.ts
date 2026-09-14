/**
 * Pure, immutable operations on the virtual catalog.
 * Every mutating function returns { catalog, error? } — never throws for ISPF-level errors.
 * Reference: docs/03-ispf-behaviour-reference.md §Catalog rules.
 */
import type { AllocateRequest, Catalog, CatalogResult, Dataset, DsnRef, Member } from "./types";

export const MSG = {
  NOT_CATALOGED: "DATA SET NOT CATALOGED",
  ALREADY_EXISTS: "DATA SET ALREADY EXISTS",
  READ_ONLY: "DATA SET IS READ ONLY",
  NOT_PARTITIONED: "DATA SET IS NOT PARTITIONED",
  MEMBER_NOT_FOUND: "MEMBER NOT FOUND",
  MEMBER_EXISTS: "MEMBER ALREADY EXISTS",
  INVALID_DSNAME: "INVALID DATA SET NAME",
  INVALID_MEMBER: "INVALID MEMBER NAME",
  INVALID_LRECL: "INVALID RECORD LENGTH",
  INVALID_SPACE: "INVALID SPACE QUANTITY",
  NO_MATCH: "NO DATA SETS MATCH LEVEL",
} as const;

const QUALIFIER_RE = /^[A-Z#$@][A-Z0-9#$@-]{0,7}$/;
const MEMBER_RE = /^[A-Z#$@][A-Z0-9#$@]{0,7}$/;

export function isValidDsname(name: string): boolean {
  const n = name.toUpperCase();
  if (n.length === 0 || n.length > 44) return false;
  return n.split(".").every((q) => QUALIFIER_RE.test(q));
}

export function isValidMemberName(name: string): boolean {
  return MEMBER_RE.test(name.toUpperCase());
}

/** Parse "DSN", "DSN(MEMBER)", or quoted 'DSN' forms. */
export function parseDsnRef(input: string): DsnRef | null {
  let s = input.trim().toUpperCase();
  if (s.startsWith("'") && s.endsWith("'")) s = s.slice(1, -1);
  const m = s.match(/^([A-Z0-9#$@.\-]+)(?:\(([A-Z0-9#$@]+)\))?$/);
  if (!m) return null;
  if (!isValidDsname(m[1])) return null;
  if (m[2] && !isValidMemberName(m[2])) return null;
  return { dsn: m[1], member: m[2] };
}

export function getDataset(catalog: Catalog, dsn: string): Dataset | undefined {
  return catalog.datasets[dsn.toUpperCase()];
}

export function getMember(catalog: Catalog, dsn: string, member: string): Member | undefined {
  return getDataset(catalog, dsn)?.members?.[member.toUpperCase()];
}

export function listMembers(ds: Dataset): Member[] {
  return Object.values(ds.members ?? {}).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * DSLIST "Dsname Level" search.
 * - "USER01"      → every data set whose first qualifier is USER01
 * - "USER01.*"    → same
 * - "USER01.JCL"  → USER01.JCL and USER01.JCL.*
 * - "*" inside a qualifier is a wildcard for that qualifier; "%" matches one character.
 */
export function searchLevel(catalog: Catalog, levelRaw: string): Dataset[] {
  const level = levelRaw.trim().toUpperCase().replace(/^'|'$/g, "");
  if (!level) return [];
  const parts = level.split(".").filter((p) => p.length > 0);
  const matches = Object.values(catalog.datasets).filter((ds) => {
    const q = ds.name.split(".");
    if (parts.length > q.length) return false;
    return parts.every((p, i) => qualifierMatches(p, q[i]));
  });
  return matches.sort((a, b) => a.name.localeCompare(b.name));
}

function qualifierMatches(pattern: string, qualifier: string): boolean {
  if (pattern === "*") return true;
  if (!pattern.includes("*") && !pattern.includes("%")) return pattern === qualifier;
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/%/g, ".");
  return new RegExp("^" + escaped + "$").test(qualifier);
}

function withDataset(catalog: Catalog, ds: Dataset): Catalog {
  return { ...catalog, datasets: { ...catalog.datasets, [ds.name]: ds } };
}

function withoutDataset(catalog: Catalog, dsn: string): Catalog {
  const rest = { ...catalog.datasets };
  delete rest[dsn];
  return { ...catalog, datasets: rest };
}

export function padRecords(records: string[], lrecl: number): string[] {
  if (lrecl <= 0) return records;
  return records.map((r) => r.padEnd(lrecl).slice(0, lrecl));
}

export function allocate(catalog: Catalog, req: AllocateRequest, today: string): CatalogResult {
  const name = req.name.trim().toUpperCase();
  if (!isValidDsname(name)) return { catalog, error: MSG.INVALID_DSNAME };
  if (catalog.datasets[name]) return { catalog, error: MSG.ALREADY_EXISTS };
  if (req.recfm !== "U" && (req.lrecl < 1 || req.lrecl > 32760)) return { catalog, error: MSG.INVALID_LRECL };
  if (req.primary < 1 || req.secondary < 0 || req.dirBlocks < 0) return { catalog, error: MSG.INVALID_SPACE };
  const isPds = req.dirBlocks > 0;
  const ds: Dataset = {
    id: name,
    name,
    datasetType: isPds ? "PDS" : "PS",
    dsorg: isPds ? "PO" : "PS",
    recfm: req.recfm,
    lrecl: req.lrecl,
    blksize: req.blksize ?? defaultBlksize(req.recfm, req.lrecl),
    volume: req.volume?.toUpperCase() || "USR001",
    readOnly: false,
    spaceUnits: req.spaceUnits,
    primary: req.primary,
    secondary: req.secondary,
    dirBlocks: req.dirBlocks,
    createdAt: today,
    owner: req.owner.toUpperCase(),
    ...(isPds ? { members: {} } : { records: [] }),
  };
  return { catalog: withDataset(catalog, ds) };
}

function defaultBlksize(recfm: string, lrecl: number): number {
  if (recfm === "U") return 32760;
  if (recfm.startsWith("V")) return Math.min(32760, lrecl + 4);
  const per = Math.floor(27998 / lrecl) || 1;
  return per * lrecl;
}

export function deleteDataset(catalog: Catalog, dsn: string): CatalogResult {
  const name = dsn.toUpperCase();
  const ds = catalog.datasets[name];
  if (!ds) return { catalog, error: MSG.NOT_CATALOGED };
  if (ds.readOnly) return { catalog, error: MSG.READ_ONLY };
  return { catalog: withoutDataset(catalog, name) };
}

export function renameDataset(catalog: Catalog, dsn: string, newName: string): CatalogResult {
  const from = dsn.toUpperCase();
  const to = newName.trim().toUpperCase();
  const ds = catalog.datasets[from];
  if (!ds) return { catalog, error: MSG.NOT_CATALOGED };
  if (ds.readOnly) return { catalog, error: MSG.READ_ONLY };
  if (!isValidDsname(to)) return { catalog, error: MSG.INVALID_DSNAME };
  if (catalog.datasets[to]) return { catalog, error: MSG.ALREADY_EXISTS };
  const renamed: Dataset = { ...ds, id: to, name: to };
  return { catalog: withDataset(withoutDataset(catalog, from), renamed) };
}

export interface WriteOpts {
  today: string;
  userid: string;
  /** STATS OFF in the edit profile: keep the member statistics unchanged */
  stats?: boolean;
}

/** Save records to a member (creating it if needed) or to a sequential data set. */
export function saveRecords(
  catalog: Catalog,
  ref: DsnRef,
  records: string[],
  opts: WriteOpts,
): CatalogResult & { created?: boolean } {
  const ds = getDataset(catalog, ref.dsn);
  if (!ds) return { catalog, error: MSG.NOT_CATALOGED };
  if (ds.readOnly) return { catalog, error: MSG.READ_ONLY };
  const padded = padRecords(records, ds.lrecl);
  if (ds.datasetType === "PS") {
    if (ref.member) return { catalog, error: MSG.NOT_PARTITIONED };
    return { catalog: withDataset(catalog, { ...ds, records: padded }) };
  }
  if (!ref.member) return { catalog, error: MSG.MEMBER_NOT_FOUND };
  const mname = ref.member.toUpperCase();
  if (!isValidMemberName(mname)) return { catalog, error: MSG.INVALID_MEMBER };
  const existing = ds.members?.[mname];
  const userid = opts.userid.toUpperCase();
  const keepStats = opts.stats === false && existing;
  const member: Member = keepStats
    ? { ...existing, records: padded }
    : existing
      ? { ...existing, records: padded, modifiedAt: opts.today, modifiedBy: userid, mod: (existing.mod ?? 0) + 1 }
      : { name: mname, records: padded, createdAt: opts.today, modifiedAt: opts.today, modifiedBy: userid, version: 1, mod: 0 };
  return {
    catalog: withDataset(catalog, { ...ds, members: { ...(ds.members ?? {}), [mname]: member } }),
    created: !existing,
  };
}

export function deleteMember(catalog: Catalog, dsn: string, member: string): CatalogResult {
  const ds = getDataset(catalog, dsn);
  if (!ds) return { catalog, error: MSG.NOT_CATALOGED };
  if (ds.readOnly) return { catalog, error: MSG.READ_ONLY };
  if (ds.datasetType !== "PDS") return { catalog, error: MSG.NOT_PARTITIONED };
  const mname = member.toUpperCase();
  if (!ds.members?.[mname]) return { catalog, error: MSG.MEMBER_NOT_FOUND };
  const members = { ...ds.members };
  delete members[mname];
  return { catalog: withDataset(catalog, { ...ds, members }) };
}

export function renameMember(catalog: Catalog, dsn: string, member: string, newName: string): CatalogResult {
  const ds = getDataset(catalog, dsn);
  if (!ds) return { catalog, error: MSG.NOT_CATALOGED };
  if (ds.readOnly) return { catalog, error: MSG.READ_ONLY };
  if (ds.datasetType !== "PDS") return { catalog, error: MSG.NOT_PARTITIONED };
  const from = member.toUpperCase();
  const to = newName.trim().toUpperCase();
  const m = ds.members?.[from];
  if (!m) return { catalog, error: MSG.MEMBER_NOT_FOUND };
  if (!isValidMemberName(to)) return { catalog, error: MSG.INVALID_MEMBER };
  if (ds.members?.[to]) return { catalog, error: MSG.MEMBER_EXISTS };
  const members = { ...ds.members };
  delete members[from];
  members[to] = { ...m, name: to };
  return { catalog: withDataset(catalog, { ...ds, members }) };
}

/** Copy a member (or a whole PS data set) to another data set. `move` deletes the source afterwards. */
export function copyMember(
  catalog: Catalog,
  from: DsnRef,
  to: DsnRef,
  opts: WriteOpts & { move?: boolean; replace?: boolean },
): CatalogResult {
  const src = getDataset(catalog, from.dsn);
  if (!src) return { catalog, error: MSG.NOT_CATALOGED };
  const dst = getDataset(catalog, to.dsn);
  if (!dst) return { catalog, error: MSG.NOT_CATALOGED };
  if (dst.readOnly) return { catalog, error: MSG.READ_ONLY };
  if (opts.move && src.readOnly) return { catalog, error: MSG.READ_ONLY };

  let records: string[];
  if (src.datasetType === "PDS") {
    if (!from.member) return { catalog, error: MSG.MEMBER_NOT_FOUND };
    const m = src.members?.[from.member.toUpperCase()];
    if (!m) return { catalog, error: MSG.MEMBER_NOT_FOUND };
    records = m.records;
  } else {
    records = src.records ?? [];
  }

  const targetMember = dst.datasetType === "PDS" ? (to.member ?? from.member) : undefined;
  if (dst.datasetType === "PDS" && !targetMember) return { catalog, error: MSG.INVALID_MEMBER };
  if (dst.datasetType === "PDS" && targetMember && dst.members?.[targetMember.toUpperCase()] && !opts.replace) {
    return { catalog, error: MSG.MEMBER_EXISTS };
  }
  const saved = saveRecords(catalog, { dsn: dst.name, member: targetMember }, records, opts);
  if (saved.error) return saved;
  if (!opts.move) return { catalog: saved.catalog };
  if (src.datasetType === "PDS" && from.member) return deleteMember(saved.catalog, src.name, from.member);
  return deleteDataset(saved.catalog, src.name);
}

export function readRecords(catalog: Catalog, ref: DsnRef): { records?: string[]; error?: string; lrecl: number } {
  const ds = getDataset(catalog, ref.dsn);
  if (!ds) return { error: MSG.NOT_CATALOGED, lrecl: 80 };
  if (ds.datasetType === "PS") return { records: ds.records ?? [], lrecl: ds.lrecl };
  if (!ref.member) return { error: MSG.MEMBER_NOT_FOUND, lrecl: ds.lrecl };
  const m = ds.members?.[ref.member.toUpperCase()];
  if (!m) return { error: MSG.MEMBER_NOT_FOUND, lrecl: ds.lrecl };
  return { records: m.records, lrecl: ds.lrecl };
}

/**
 * Copy (or move) a whole data set, DSLIST CO / MO style. A PDS is deep-copied member by member; a PS copies its
 * records. The target must not exist unless it is a compatible existing data set (same organisation), in which case
 * members are added (existing names replaced) — ISPF 3.3 "copy all members" semantics.
 */
export function copyDataset(catalog: Catalog, fromDsn: string, toDsn: string, opts: WriteOpts & { move?: boolean }): CatalogResult {
  const src = getDataset(catalog, fromDsn);
  if (!src) return { catalog, error: MSG.NOT_CATALOGED };
  const to = toDsn.trim().toUpperCase();
  if (!isValidDsname(to)) return { catalog, error: MSG.INVALID_DSNAME };
  if (to === src.name) return { catalog, error: MSG.ALREADY_EXISTS };
  if (opts.move && src.readOnly) return { catalog, error: MSG.READ_ONLY };
  const existing = getDataset(catalog, to);
  let next: Catalog;
  if (!existing) {
    const copy: Dataset = { ...src, id: to, name: to, readOnly: false, volume: "USR001", owner: opts.userid.toUpperCase(), createdAt: opts.today };
    next = withDataset(catalog, copy);
  } else {
    if (existing.readOnly) return { catalog, error: MSG.READ_ONLY };
    if (existing.datasetType !== src.datasetType) return { catalog, error: MSG.NOT_PARTITIONED };
    next =
      src.datasetType === "PDS"
        ? withDataset(catalog, { ...existing, members: { ...(existing.members ?? {}), ...(src.members ?? {}) } })
        : withDataset(catalog, { ...existing, records: padRecords(src.records ?? [], existing.lrecl) });
  }
  return opts.move ? deleteDataset(next, src.name) : { catalog: next };
}

/** Member list `G`: reset ISPF statistics to version 1.0, created/changed today by this user. */
export function resetMemberStats(catalog: Catalog, dsn: string, member: string, opts: WriteOpts): CatalogResult {
  const ds = getDataset(catalog, dsn);
  if (!ds) return { catalog, error: MSG.NOT_CATALOGED };
  if (ds.readOnly) return { catalog, error: MSG.READ_ONLY };
  if (ds.datasetType !== "PDS") return { catalog, error: MSG.NOT_PARTITIONED };
  const mname = member.toUpperCase();
  const m = ds.members?.[mname];
  if (!m) return { catalog, error: MSG.MEMBER_NOT_FOUND };
  const reset: Member = { ...m, version: 1, mod: 0, createdAt: opts.today, modifiedAt: opts.today, modifiedBy: opts.userid.toUpperCase() };
  return { catalog: withDataset(catalog, { ...ds, members: { ...ds.members, [mname]: reset } }) };
}
