/**
 * Edit profiles live outside the catalog so that resetting the training data set
 * does not lose the learner's editor preferences — and vice versa on import.
 * Key: ispf-lab:editprofile:v1:<USERID>. Reference: docs/04-editor-commands.md §Edit profile.
 */
import { defaultProfile, type EditProfile, type EditProfiles } from "@/editor/profile";
import { KEYS } from "./keys";
import type { StorageAdapter } from "./storage";

const AUTOSAVE_MODES = new Set(["ON", "OFF PROMPT", "OFF NOPROMPT"]);

/** Validate a stored profile field by field; unknown or malformed entries fall back to defaults. */
export function sanitizeProfile(name: string, raw: unknown): EditProfile {
  const base = defaultProfile(name);
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Record<string, unknown>;
  const bool = (k: keyof EditProfile) => (typeof r[k] === "boolean" ? (r[k] as boolean) : (base[k] as boolean));
  const bounds = r.bounds as { left?: unknown; right?: unknown } | undefined;
  const left = typeof bounds?.left === "number" && bounds.left >= 1 ? Math.floor(bounds.left) : base.bounds.left;
  const right = typeof bounds?.right === "number" && bounds.right >= 0 ? Math.floor(bounds.right) : base.bounds.right;
  return {
    name,
    caps: bool("caps"),
    number: bool("number"),
    stats: bool("stats"),
    recovery: bool("recovery"),
    setundo: bool("setundo"),
    hex: bool("hex"),
    autosave: typeof r.autosave === "string" && AUTOSAVE_MODES.has(r.autosave) ? (r.autosave as EditProfile["autosave"]) : base.autosave,
    bounds: { left, right },
  };
}

export function sanitizeProfiles(raw: unknown): EditProfiles {
  if (!raw || typeof raw !== "object") return {};
  const out: EditProfiles = {};
  for (const [name, value] of Object.entries(raw as Record<string, unknown>)) {
    if (/^[A-Z0-9@#$]{1,8}$/.test(name)) out[name] = sanitizeProfile(name, value);
  }
  return out;
}

export function loadProfiles(storage: StorageAdapter, userid: string): EditProfiles {
  return sanitizeProfiles(storage.get<unknown>(KEYS.editProfiles(userid)));
}

export function saveProfiles(storage: StorageAdapter, userid: string, profiles: EditProfiles): void {
  storage.set(KEYS.editProfiles(userid), profiles);
}

export function resetProfiles(storage: StorageAdapter, userid: string): void {
  storage.remove(KEYS.editProfiles(userid));
}
