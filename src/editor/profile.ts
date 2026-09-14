/**
 * Edit profile: the per-data-set-type settings ISPF keeps between sessions (PROFILE command).
 * Educational subset — see docs/04-editor-commands.md §Profile. Reference: ISPF Edit and Edit Macros,
 * "Edit profile modes", "AUTOSAVE", "Edit recovery", "SETUNDO", "NUMBER", "STATS", "BOUNDS".
 */
export type AutosaveMode = "ON" | "OFF PROMPT" | "OFF NOPROMPT";

export interface EditProfile {
  name: string;
  caps: boolean;
  number: boolean;
  stats: boolean;
  recovery: boolean;
  setundo: boolean;
  autosave: AutosaveMode;
  hex: boolean;
  /** 1-based inclusive columns; right = 0 means "up to LRECL" */
  bounds: { left: number; right: number };
}

export type EditProfiles = Record<string, EditProfile>;

/** ISPF names the profile after the data set's last qualifier (the "type"), e.g. JCL, COBOL. */
export function profileNameFor(dsn: string): string {
  const parts = dsn.toUpperCase().split(".");
  return parts[parts.length - 1] || "DEFAULT";
}

export function defaultProfile(name: string): EditProfile {
  // Real defaults vary by installation (ISPF ships RECOVERY OFF / SETUNDO OFF; many sites turn them on).
  return { name, caps: false, number: false, stats: true, recovery: false, setundo: true, autosave: "ON", hex: false, bounds: { left: 1, right: 0 } };
}

export function profileFor(profiles: EditProfiles, dsn: string): EditProfile {
  const name = profileNameFor(dsn);
  return profiles[name] ?? defaultProfile(name);
}

export function withProfile(profiles: EditProfiles, profile: EditProfile): EditProfiles {
  return { ...profiles, [profile.name]: profile };
}

const onOff = (b: boolean) => (b ? "ON" : "OFF");

/** The two `=PROF>` lines ISPF shows for PROFILE (a simplified but faithful layout). */
export function profileDisplayLines(p: EditProfile, lrecl: number, recfm = "FB"): string[] {
  const right = p.bounds.right || lrecl;
  return [
    `....${p.name} (${recfm} ${lrecl})....RECOVERY ${onOff(p.recovery)}....NUMBER ${onOff(p.number)}....CAPS ${onOff(p.caps)}....HEX ${onOff(p.hex)}`,
    `....STATS ${onOff(p.stats)}....AUTOSAVE ${p.autosave}....SETUNDO ${onOff(p.setundo)}....BOUNDS ${p.bounds.left} ${right}`,
  ];
}

/** Effective search/change window (0-based, exclusive end). */
export function boundsWindow(p: EditProfile, lrecl: number): { start: number; end: number } {
  const start = Math.max(0, p.bounds.left - 1);
  const end = p.bounds.right > 0 ? Math.min(lrecl, p.bounds.right) : lrecl;
  return { start, end: Math.max(start, end) };
}
