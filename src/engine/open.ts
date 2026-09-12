/**
 * Shared "open this data set / member" logic used by DSLIST, member lists, Edit/View entry and 3.1.
 * Reference: docs/03-ispf-behaviour-reference.md §Opening data sets.
 */
import { MSG, getDataset, readRecords } from "@/catalog/catalog";
import type { DsnRef } from "@/catalog/types";
import { openSession } from "@/editor/session";
import type { EditorMode } from "@/editor/types";
import { fail, push } from "./navigation";
import type { ListMode, ScreenFrame, SimEvent, SimulatorState, StepResult } from "./types";

export const MODE_TO_EDITOR: Record<Exclude<ListMode, "M">, EditorMode> = { E: "EDIT", B: "BROWSE", V: "VIEW" };
const SCREEN_FOR: Record<EditorMode, ScreenFrame> = { EDIT: { id: "EDIT" }, BROWSE: { id: "BROWSE" }, VIEW: { id: "VIEW" } };

/**
 * Open a data set reference. A PDS without a member opens its member list;
 * a PDS(member) or a sequential data set opens the editor in the requested mode.
 * In EDIT mode a nonexistent member is created (empty) — it only reaches the catalog on SAVE.
 */
export function openRef(state: SimulatorState, ref: DsnRef, mode: ListMode): StepResult {
  const ds = getDataset(state.catalog, ref.dsn);
  if (!ds) return fail(state, MSG.NOT_CATALOGED, `${ref.dsn} is not in the catalog. Check the spelling of every qualifier.`);
  if (ds.datasetType === "PDS" && !ref.member) {
    const frame: ScreenFrame = { id: "MEMBER_LIST", dsn: ds.name, mode, top: 0 };
    const r = push({ ...state, activeDataset: ds.name, activeMember: undefined }, frame, [{ type: "DATASET_OPENED", dsn: ds.name, mode }]);
    return r;
  }
  if (mode === "M") return fail(state, MSG.NOT_PARTITIONED, "Member lists exist only for partitioned data sets (DSORG=PO).");
  if (ds.datasetType === "PS" && ref.member) return fail(state, MSG.NOT_PARTITIONED, `${ds.name} is sequential; it has records but no members.`);
  const editorMode = MODE_TO_EDITOR[mode];
  const read = readRecords(state.catalog, ref);
  let records = read.records;
  let isNew = false;
  if (read.error) {
    if (read.error === MSG.MEMBER_NOT_FOUND && editorMode === "EDIT" && !ds.readOnly) {
      records = [];
      isNew = true;
    } else {
      return fail(state, read.error, ds.readOnly ? "System libraries are read-only in this training environment." : undefined);
    }
  }
  const session = openSession({
    mode: editorMode,
    dsn: ds.name,
    member: ref.member?.toUpperCase(),
    lrecl: ds.lrecl,
    readOnly: ds.readOnly,
    records: records ?? [],
    isNew,
    scrollAmount: state.settings.scrollDefault,
  });
  const events: SimEvent[] = [{ type: "MEMBER_OPENED", dsn: ds.name, member: session.member, mode: editorMode }];
  const r = push({ ...state, activeDataset: ds.name, activeMember: session.member, editor: session }, SCREEN_FOR[editorMode], events);
  if (isNew) {
    r.state = { ...r.state, message: { short: "NEW MEMBER", long: `${ds.name}(${session.member}) does not exist yet. It will be created when you SAVE.`, severity: "info" } };
  }
  return r;
}
