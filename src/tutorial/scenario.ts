/**
 * Scenario setup: turn a lesson's `startingState` into catalog and profile changes.
 * Pure TypeScript (no React, no DOM). Replaying a lesson, switching mode or restarting must start from the same
 * known data whatever the learner did before (ADR 0016, M1a-5).
 * Reference: docs/05-course-design.md §Runner rules.
 */
import { allocate, deleteDataset, deleteMember, getDataset, getMember, saveRecords } from "@/catalog/catalog";
import { EMPTY_JES } from "@/jes/types";
import { buildSeed } from "@/catalog/seed";
import type { Catalog } from "@/catalog/types";
import type { EditProfiles } from "@/editor/profile";
import type { SimAction, SimulatorState } from "@/engine/types";
import { DEFAULT_SETTINGS, type Settings } from "@/persistence/settingsStore";
import { isDirty } from "@/editor/session";
import { fillHlq } from "./engine";
import type { LessonStart } from "./types";

/** Restore specific members from the seed so a lesson always starts from known data. */
export function restoreMembers(catalog: Catalog, hlq: string, refs: { dsn: string; member: string }[]): Catalog {
  const seed = buildSeed(hlq);
  let next = catalog;
  for (const ref of refs) {
    const dsn = fillHlq(ref.dsn, hlq);
    const seeded = getMember(seed, dsn, ref.member);
    const ds = next.datasets[dsn] ?? seed.datasets[dsn];
    if (!seeded || !ds) continue;
    next = { ...next, datasets: { ...next.datasets, [dsn]: { ...ds, members: { ...(ds.members ?? {}), [ref.member]: seeded } } } };
  }
  return next;
}

/**
 * The catalog a lesson starts with. Order: remove leftovers, (re)create scenario data sets and members, restore seed members.
 * Returns the same object when the lesson asks for nothing.
 */
export function applyScenario(catalog: Catalog, hlq: string, start: LessonStart, today: string): Catalog {
  let next = catalog;
  for (const dsn of start.removeDatasets ?? []) {
    const name = fillHlq(dsn, hlq).toUpperCase();
    if (getDataset(next, name)) next = deleteDataset(next, name).catalog;
  }
  for (const ref of start.removeMembers ?? []) {
    const dsn = fillHlq(ref.dsn, hlq).toUpperCase();
    if (getMember(next, dsn, ref.member)) next = deleteMember(next, dsn, ref.member).catalog;
  }
  for (const spec of start.createDatasets ?? []) {
    const name = fillHlq(spec.dsn, hlq).toUpperCase();
    if (getDataset(next, name)) next = deleteDataset(next, name).catalog;
    next = allocate(next, { name, spaceUnits: "TRKS", primary: 1, secondary: 1, dirBlocks: spec.dirBlocks, recfm: "FB", lrecl: 80, owner: hlq }, today).catalog;
  }
  for (const spec of start.createMembers ?? []) {
    const dsn = fillHlq(spec.dsn, hlq).toUpperCase();
    const records = spec.records.map((r) => fillHlq(r, hlq));
    const current = getMember(next, dsn, spec.member);
    if (current && current.records.map((r) => r.trimEnd()).join("\n") === records.join("\n")) continue;
    const saved = saveRecords(next, { dsn, member: spec.member }, records, { today, userid: hlq });
    if (!saved.error) next = saved.catalog;
  }
  if (start.resetMembers?.length) next = restoreMembers(next, hlq, start.resetMembers);
  return next;
}

/** Edit profiles a lesson starts with: the named profiles are dropped so they take their defaults again. */
export function scenarioProfiles(profiles: EditProfiles, start: LessonStart): EditProfiles {
  const names = start.resetProfiles;
  if (!names?.length) return profiles;
  const next = { ...profiles };
  for (const name of names) delete next[name];
  return next;
}

/** Option 0 settings a lesson starts with: only the named ones go back to their defaults. */
export function scenarioSettings(settings: Settings, start: LessonStart): Settings {
  const keys = start.resetSettings?.filter((k) => settings[k] !== DEFAULT_SETTINGS[k]);
  if (!keys?.length) return settings;
  return keys.reduce<Settings>((s, k) => ({ ...s, [k]: DEFAULT_SETTINGS[k] }), settings);
}

/**
 * The ordered simulator actions that put a logged-on session into a lesson's starting state: scenario data and
 * profiles, jobs, a closed session (split screens, open editor, optionally the retrieve stack), then the starting
 * screen. The provider dispatches these; tests reduce them, so both start lessons identically.
 */
export function startActions(state: SimulatorState, start: LessonStart | undefined): SimAction[] {
  const actions: SimAction[] = [];
  if (start) {
    const catalog = applyScenario(state.catalog, state.userid, start, state.today);
    if (catalog !== state.catalog) actions.push({ type: "LOAD_CATALOG", catalog });
    const profiles = scenarioProfiles(state.editProfiles, start);
    if (profiles !== state.editProfiles) actions.push({ type: "LOAD_PROFILES", profiles });
    if (start.resetJobs) actions.push({ type: "LOAD_JES", jes: EMPTY_JES });
    const settings = scenarioSettings(state.settings, start);
    if (settings !== state.settings) actions.push({ type: "LOAD_SETTINGS", settings });
  }
  actions.push({ type: "RESET_SESSION", retrieve: !!start?.clearRetrieve });
  if (start?.screen) {
    if (start.screen.id === "LOGIN") actions.push({ type: "LOGOFF" });
    else if (start.underMenu) actions.push({ type: "GOTO", screen: { id: "PRIMARY_OPTION_MENU" }, clearStack: true }, { type: "GOTO", screen: start.screen });
    else actions.push({ type: "GOTO", screen: start.screen, clearStack: true });
  }
  return actions;
}

const MAX_LISTED = 5;

/**
 * What starting (or restarting) a lesson with this `startingState` would throw away: editors with unsaved changes
 * (in this or another split screen), learner changes to seed members that the lesson restores, and leftover members or
 * data sets with content that it removes. Empty or unchanged things are not reported, so a harmless reset never
 * prompts. At most five items are listed, then a count of the rest.
 */
export function workAtRisk(state: SimulatorState, start: LessonStart | undefined): string[] {
  const items: string[] = [];
  const editors = [state.editor, ...state.screens.filter((_, i) => i !== state.activeScreen).map((s) => s.editor)];
  for (const e of editors) {
    if (e && isDirty(e)) items.push(`unsaved changes in ${e.dsn}${e.member ? `(${e.member})` : ""}`);
  }
  if (start) {
    const next = applyScenario(state.catalog, state.userid, start, state.today);
    if (next !== state.catalog) {
      for (const [name, ds] of Object.entries(state.catalog.datasets)) {
        const after = next.datasets[name];
        const members = Object.keys(ds.members ?? {});
        if (!after) {
          if (members.length || ds.records?.length) items.push(`${name} (${members.length ? `${members.length} member(s)` : "records"}) would be removed`);
          continue;
        }
        if (after === ds) continue;
        for (const m of members) {
          const kept = after.members?.[m];
          if (!kept) items.push(`${name}(${m}) would be removed`);
          else if (kept.records.join("\n") !== ds.members![m].records.join("\n")) items.push(`${name}(${m}) would be restored to its original text`);
        }
      }
    }
  }
  return items.length > MAX_LISTED ? [...items.slice(0, MAX_LISTED), `and ${items.length - MAX_LISTED} more`] : items;
}
