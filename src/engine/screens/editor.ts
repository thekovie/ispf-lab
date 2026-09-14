/**
 * EDIT / BROWSE / VIEW screen: renders the record-oriented editor and wires
 * text edits → line commands → primary command (ISPF order) on every Enter/PF.
 * Reference: docs/04-editor-commands.md; z/OS ISPF Edit and Edit Macros.
 */
import { MSG, getMember, readRecords, saveRecords } from "@/catalog/catalog";
import { applyLineCommands } from "@/editor/lineCommands";
import { makeLines } from "@/editor/lineOps";
import { applyPrimaryCommand } from "@/editor/primaryCommands";
import { applyTextEdits, bufferRecords, commitSaved } from "@/editor/session";
import { recordInteraction } from "@/editor/history";
import { withProfile } from "@/editor/profile";
import { parseBoundsLine, specialRows } from "@/editor/special";
import type { EditorEvent, EditorMessage, EditorResult, EditorSession } from "@/editor/types";
import { parseEditorPrimaryCommand } from "@/parsers/editorPrimaryCommand";
import { dim, f, label, t } from "../rows";
import { pop, withMessage } from "../navigation";
import type { Fields, Message, Row, ScreenHandler, SimEvent, SimulatorState, StepResult } from "../types";

type Frame = { id: "EDIT" } | { id: "BROWSE" } | { id: "VIEW" };

const NUM = (n: number) => String(n).padStart(6, "0");
const TOP_MARK = "****** " + "*".repeat(30) + " Top of Data " + "*".repeat(30);
const BOTTOM_MARK = "****** " + "*".repeat(28) + " Bottom of Data " + "*".repeat(29);

function shortMessage(state: SimulatorState, s: EditorSession): [string, "yellow" | "red" | "white"] {
  if (state.message) return [state.message.short, state.message.severity === "error" ? "red" : "yellow"];
  const right = Math.min(s.lrecl, s.leftCol + s.pageCols);
  return [`Columns ${String(s.leftCol + 1).padStart(5, "0")} ${String(right).padStart(5, "0")}`, "white"];
}

export const editorScreen: ScreenHandler<Frame> = {
  help: [
    "The ISPF editor shows one record per line. The six-character prefix area on",
    "the left takes LINE commands (type over the number): I insert, D delete,",
    "R repeat, C copy, M move, A/B after/before, X exclude, DD/CC/MM/XX blocks.",
    "The Command ===> line takes PRIMARY commands: SAVE, CANCEL, FIND str,",
    "CHANGE old new [ALL], RESET [EXCLUDED|SPECIAL], LOCATE n, TOP, BOTTOM, UNDO,",
    "FLIP, PROFILE, CAPS/NUMBER/STATS/RECOVERY/SETUNDO/AUTOSAVE ON|OFF, BOUNDS l r.",
    "Nothing happens until you press Enter. PF3 ends and, with AUTOSAVE ON, saves;",
    "PF7/PF8 scroll; PF5 repeats FIND; PF6 repeats CHANGE; PF12 cancels.",
    "Browse is read-only; View is editable but cannot SAVE.",
  ],
  render(state, frame) {
    const s = state.editor;
    if (!s) return { title: frame.id, pfKeys: [{ key: 3, label: "Exit" }], fields: [], rows: [[t("NO EDITOR SESSION", "red")]] };
    const editable = s.mode !== "BROWSE";
    const name = `${s.dsn}${s.member ? `(${s.member})` : ""}`;
    const [msgText, msgColor] = shortMessage(state, s);
    const head = `${s.mode.padEnd(10)} ${name}`;
    const rows: Row[] = [
      [t(head.padEnd(80 - msgText.length - 1), "white", true), t(" "), t(msgText, msgColor, true)],
      [label("Command ===> "), f("command", 47, state.fieldValues.command ?? ""), label("  Scroll ===> "), f("scroll", 4, state.fieldValues.scroll ?? s.scrollAmount)],
    ];
    const fields: string[] = ["command"];
    let shown = 0;
    const specialAfter = (afterId: number | null) => {
      for (const sp of s.special.filter((x) => x.afterLineId === afterId)) {
        for (const row of specialRows(sp, s)) {
          const prefixId = `prefix:${sp.id}`;
          if (sp.kind === "BNDS" && editable) {
            rows.push([f(prefixId, 6, row.tag, { editorLine: true, color: "yellow" }), t(" "), f(`bnds:${sp.id}`, s.pageCols, row.text, { editorLine: true, color: "yellow" })]);
            fields.push(prefixId, `bnds:${sp.id}`);
          } else if (editable) {
            rows.push([f(prefixId, 6, row.tag, { editorLine: true, color: "yellow" }), t(" "), t(row.text, "yellow")]);
            fields.push(prefixId);
          } else rows.push([t(row.tag, "yellow"), t(" "), t(row.text, "yellow")]);
          shown++;
        }
      }
    };
    if (s.top === 0) {
      rows.push([dim(TOP_MARK)]);
      specialAfter(null);
    }
    const pendingById = new Map(s.pending.map((p) => [p.lineId, p.raw]));
    let i = s.top;
    while (i < s.lines.length && shown < s.pageSize) {
      const line = s.lines[i];
      if (line.excluded) {
        let j = i;
        while (j < s.lines.length && s.lines[j].excluded) j++;
        const count = j - i;
        const prefixId = `prefix:${line.id}`;
        rows.push([
          editable ? f(prefixId, 6, pendingById.get(line.id) ?? "- - - ", { editorLine: true }) : dim("- - - "),
          t(" "),
          dim(`- - - - - - - - - - - - - - - - - - - - ${count} Line(s) not Displayed`),
        ]);
        if (editable) fields.push(prefixId);
        i = j;
        shown++;
        continue;
      }
      const prefixId = `prefix:${line.id}`;
      const lineId = `line:${line.id}`;
      const prefixValue = pendingById.get(line.id) ?? NUM(i + 1);
      const visibleText = line.text.slice(s.leftCol, s.leftCol + s.pageCols);
      if (editable) {
        rows.push([f(prefixId, 6, prefixValue, { editorLine: true, color: pendingById.has(line.id) ? "yellow" : "cyan" }), t(" "), f(lineId, s.pageCols, visibleText, { editorLine: true, noUpper: !s.profile.caps })]);
        fields.push(prefixId, lineId);
      } else {
        rows.push([t(NUM(i + 1), "cyan"), t(" "), t(visibleText, "green")]);
      }
      i++;
      shown++;
      specialAfter(line.id);
    }
    if (i >= s.lines.length) rows.push([dim(BOTTOM_MARK)]);
    const pfKeys = [
      { key: 1, label: "Help" },
      { key: 3, label: "Exit" },
      ...(editable ? [{ key: 5, label: "Rfind" }, { key: 6, label: "Rchange" }] : [{ key: 5, label: "Rfind" }]),
      { key: 7, label: "Up" },
      { key: 8, label: "Down" },
      { key: 10, label: "Left" },
      { key: 11, label: "Right" },
      ...(editable ? [{ key: 12, label: "Cancel" }] : []),
    ];
    const focusLine = s.cursor.lineId !== null && fields.includes(`line:${s.cursor.lineId}`) ? `line:${s.cursor.lineId}` : undefined;
    return {
      title: `${s.mode} ${name}`,
      pfKeys,
      fields,
      focus: state.focusField ?? focusLine ?? "command",
      message: state.message,
      rows,
    };
  },
  onEnter(state, _frame, fields) {
    if (!state.editor) return pop(state);
    return processEnter(state, fields, undefined);
  },
  onPf(state, _frame, key, fields) {
    if (!state.editor) return pop(state);
    switch (key) {
      case 3:
        return processEnter(state, fields, "END");
      case 5:
        return processEnter(state, fields, "RFIND");
      case 6:
        return processEnter(state, fields, "RCHANGE");
      case 7:
        return processEnter(state, fields, "UP");
      case 8:
        return processEnter(state, fields, "DOWN");
      case 10:
        return processEnter(state, fields, "LEFT");
      case 11:
        return processEnter(state, fields, "RIGHT");
      case 12:
        return state.editor.mode === "BROWSE" ? processEnter(state, fields, "END") : cancelEdit(state);
      default:
        return null;
    }
  },
};

/** Strip the untouched tail of the line number so "I50001" typed over "000001" becomes "I5". */
export function typedPrefix(value: string, original: string): string {
  let v = value;
  let o = original;
  while (v.length > 0 && o.length > 0 && v[v.length - 1] === o[o.length - 1]) {
    v = v.slice(0, -1);
    o = o.slice(0, -1);
  }
  return v.trim();
}

function toSimEvents(events: EditorEvent[]): SimEvent[] {
  return events.map((e): SimEvent => {
    switch (e.type) {
      case "EDITOR_LINE_INSERTED":
      case "EDITOR_LINE_DELETED":
      case "EDITOR_LINE_REPEATED":
      case "EDITOR_LINES_EXCLUDED":
      case "EDITOR_TEXT_CHANGED":
        return { type: e.type, count: e.count ?? 1 };
      case "EDITOR_LINES_COPIED":
      case "EDITOR_LINES_MOVED":
        return { type: e.type, count: e.count ?? 1, dest: e.detail ?? "A" };
      case "EDITOR_FIND":
        return { type: "EDITOR_FIND", text: e.detail ?? "" };
      case "EDITOR_CHANGE":
        return { type: "EDITOR_CHANGE", detail: e.detail ?? "" };
      case "EDITOR_UNDO":
        return { type: "UNDO_EXECUTED" };
      case "EDITOR_COLS":
        return { type: "COLS_DISPLAYED" };
      case "EDITOR_BOUNDS":
        return { type: "BOUNDS_CHANGED" };
      case "EDITOR_LINES_REDISPLAYED":
        return { type: "LINES_REDISPLAYED", count: e.count ?? 0 };
      default:
        return { type: "EDITOR_SCROLLED" };
    }
  });
}

function toMessage(m: EditorMessage | undefined): Message | undefined {
  return m ? { short: m.text, severity: m.severity } : undefined;
}

function collectTextEdits(s: EditorSession, fields: Fields): Record<number, string> {
  const edits: Record<number, string> = {};
  const byId = new Map(s.lines.map((l) => [l.id, l]));
  for (const [k, v] of Object.entries(fields)) {
    if (!k.startsWith("line:")) continue;
    const id = Number(k.slice(5));
    const line = byId.get(id);
    if (!line) continue;
    const visible = line.text.slice(s.leftCol, s.leftCol + s.pageCols);
    if (v === visible) continue;
    const merged = line.text.slice(0, s.leftCol) + v.padEnd(s.pageCols).slice(0, s.pageCols) + line.text.slice(s.leftCol + s.pageCols);
    edits[id] = merged;
  }
  return edits;
}

function collectPrefixCommands(s: EditorSession, fields: Fields): Record<number, string> {
  const typed: Record<number, string> = {};
  const index = new Map(s.lines.map((l, i) => [l.id, i]));
  const pending = new Map(s.pending.map((p) => [p.lineId, p.raw]));
  for (const [k, v] of Object.entries(fields)) {
    if (!k.startsWith("prefix:")) continue;
    const id = Number(k.slice(7));
    if (id < 0) {
      // special line: the prefix field shows =COLS> / =BNDS> / =PROF>; anything else typed there is a command
      const sp = s.special.find((x) => x.id === id);
      const tag = sp ? `=${sp.kind}>` : "";
      if (v !== tag && v.trim()) typed[id] = typedPrefix(v, tag);
      continue;
    }
    const i = index.get(id);
    if (i === undefined) continue;
    const original = pending.get(id) ?? (s.lines[i].excluded ? "- - - " : NUM(i + 1));
    if (v === original) {
      if (pending.has(id)) typed[id] = v; // still pending, untouched
      continue;
    }
    typed[id] = pending.has(id) ? v.trim() : typedPrefix(v, original);
  }
  return typed;
}

/** A typed-over =BNDS> line sets the profile bounds. */
function applyBoundsEdits(s: EditorSession, fields: Fields): EditorResult {
  for (const [k, v] of Object.entries(fields)) {
    if (!k.startsWith("bnds:")) continue;
    const id = Number(k.slice(5));
    const sp = s.special.find((x) => x.id === id);
    if (!sp) continue;
    const current = specialRows(sp, s)[0]?.text ?? "";
    if (v === current) continue;
    const b = parseBoundsLine(v, s.leftCol, s.lrecl);
    if (!b) return { session: s, events: [], message: { text: "INVALID BOUNDS", severity: "error" } };
    const profile = { ...s.profile, bounds: b };
    return { session: { ...s, profile, profileDirty: true }, events: [{ type: "EDITOR_BOUNDS" }], message: { text: `BOUNDS ${b.left} ${b.right || s.lrecl}`, severity: "info" } };
  }
  return { session: s, events: [] };
}

function processEnter(state: SimulatorState, fields: Fields, pfCommand: string | undefined): StepResult {
  let session = state.editor!;
  const before = session;
  const events: SimEvent[] = [];
  let message: Message | undefined;
  const absorb = (r: EditorResult) => {
    session = r.session;
    events.push(...toSimEvents(r.events));
    if (r.message && (!message || r.message.severity === "error" || message.severity !== "error")) message = toMessage(r.message);
    return r;
  };
  // 1. typed-over record text (and a typed-over =BNDS> line)
  absorb(applyTextEdits(session, collectTextEdits(session, fields)));
  absorb(applyBoundsEdits(session, fields));
  // 2. prefix-area line commands
  absorb(applyLineCommands(session, collectPrefixCommands(session, fields)));
  // 3. scroll amount field
  const scroll = (fields.scroll ?? "").trim().toUpperCase();
  if (scroll && scroll !== session.scrollAmount) session = { ...session, scrollAmount: scroll };
  // 4. primary command (typed, or the PF key equivalent)
  const raw = pfCommand ?? (fields.command ?? "").trim();
  if (raw) events.push({ type: "COMMAND_ENTERED", screen: state.screen.id, command: raw });
  const parsedPrimary = parseEditorPrimaryCommand(raw);
  const primary = absorb(applyPrimaryCommand(session, parsedPrimary));
  // 5. one UNDO step per interaction that changed data (UNDO itself is not recorded)
  if (parsedPrimary.kind !== "undo") session = recordInteraction(before, session);
  // 6. profile changes are written back to the per-type edit profiles
  const editProfiles = session.profileDirty ? withProfile(state.editProfiles, session.profile) : state.editProfiles;
  if (session.profileDirty) {
    events.push({ type: "PROFILE_CHANGED", profile: session.profile.name });
    session = { ...session, profileDirty: false };
  }
  const base: SimulatorState = { ...state, editor: session, editProfiles, fieldValues: {}, focusField: undefined, message };
  const withEvents = (r: StepResult): StepResult => ({ state: r.state, events: [...events, ...r.events] });
  const effect = primary.effect;
  if (!effect) return withEvents(withMessage(base, message));
  switch (effect.kind) {
    case "save":
      return withEvents(saveSession(base, false));
    case "end":
      return withEvents(endSession(base));
    case "cancel":
      return withEvents(cancelEdit(base));
    case "explain":
      return withEvents({ state: base, events: [{ type: "EXPLAIN_REQUESTED", term: effect.term }] });
    case "create":
      return withEvents(createMember(base, effect.member, effect.replace));
    case "copy":
      return withEvents(copyIntoBuffer(base, effect.member));
    case "submit":
      return withEvents(withMessage(base, { short: "SUBMIT NOT AVAILABLE IN THIS TRAINING MODULE", long: "JCL submission arrives with the simulated JES.", severity: "error" }));
    default:
      return withEvents({ state: base, events: [] });
  }
}

function saveSession(state: SimulatorState, thenExit: boolean): StepResult {
  const s = state.editor!;
  const ref = { dsn: s.dsn, member: s.member };
  const r = saveRecords(state.catalog, ref, bufferRecords(s), { today: state.today, userid: state.userid, stats: s.profile.stats });
  if (r.error) return withMessage(state, { short: r.error, severity: "error", long: r.error === MSG.READ_ONLY ? "Use CANCEL (PF12) to leave without saving." : undefined });
  const events: SimEvent[] = [];
  if (r.created) events.push({ type: "MEMBER_CREATED", dsn: s.dsn, member: s.member! });
  events.push({ type: "MEMBER_SAVED", dsn: s.dsn, member: s.member });
  const label = s.member ? `Member ${s.member} saved` : `${s.dsn} saved`;
  const saved: SimulatorState = { ...state, catalog: r.catalog, editor: commitSaved(s) };
  if (thenExit) {
    const p = pop({ ...saved, editor: undefined, activeMember: undefined }, { short: "MEMBER SAVED", long: label, severity: "info" });
    return { state: p.state, events: [...events, ...p.events] };
  }
  return { state: { ...saved, message: { short: "MEMBER SAVED", long: label, severity: "info" } }, events };
}

/**
 * END processing without popping the panel — used by the jump function and RETURN, which end the
 * current dialog before navigating. Returns `blocked` when the save fails (e.g. read-only library),
 * so the caller can leave the user in the editor with the message.
 */
export function closeEditorForNavigation(state: SimulatorState): { state: SimulatorState; events: SimEvent[]; blocked?: StepResult } {
  const s = state.editor;
  if (!s) return { state, events: [] };
  if (s.mode === "EDIT" && (s.dirty || s.isNew)) {
    if (s.profile.autosave === "OFF PROMPT") return { state, events: [], blocked: promptAutosave(state) };
    if (s.profile.autosave === "OFF NOPROMPT") return { state: { ...state, editor: undefined, activeMember: undefined }, events: [{ type: "EDIT_CANCELLED", dsn: s.dsn, member: s.member }] };
    const saved = saveSession(state, false);
    if (saved.state.message?.severity === "error") return { state, events: [], blocked: saved };
    return { state: { ...saved.state, editor: undefined, activeMember: undefined }, events: saved.events };
  }
  return { state: { ...state, editor: undefined, activeMember: undefined }, events: [] };
}

/** AUTOSAVE OFF PROMPT: END on modified data asks whether to SAVE or CANCEL (ISPF panel ISREDCP). */
function promptAutosave(state: SimulatorState): StepResult {
  const s = state.editor!;
  return {
    state: { ...state, stack: [...state.stack, state.screen], screen: { id: "AUTOSAVE_PROMPT" }, fieldValues: {}, focusField: undefined, message: undefined },
    events: [{ type: "AUTOSAVE_PROMPTED", dsn: s.dsn, member: s.member }, { type: "SCREEN_OPENED", screen: "AUTOSAVE_PROMPT", frame: { id: "AUTOSAVE_PROMPT" } }],
  };
}

/** END / PF3: AUTOSAVE ON saves; OFF PROMPT asks; OFF NOPROMPT discards (ISPF "AUTOSAVE — Save Data Automatically"). */
function endSession(state: SimulatorState): StepResult {
  const s = state.editor!;
  if (s.mode === "EDIT" && (s.dirty || s.isNew)) {
    if (s.profile.autosave === "ON") return saveSession(state, true);
    if (s.profile.autosave === "OFF PROMPT") return promptAutosave(state);
    return cancelEdit(state);
  }
  return pop({ ...state, editor: undefined, activeMember: undefined });
}

/** Called by the AUTOSAVE prompt panel with the user's choice. */
export function finishEdit(state: SimulatorState, choice: "save" | "cancel"): StepResult {
  return choice === "save" ? saveSession(state, true) : cancelEdit(state);
}

function cancelEdit(state: SimulatorState): StepResult {
  const s = state.editor!;
  const p = pop({ ...state, editor: undefined, activeMember: undefined }, { short: "EDIT CANCELLED", long: "Changes since the last SAVE were discarded.", severity: "info" });
  return { state: p.state, events: [{ type: "EDIT_CANCELLED", dsn: s.dsn, member: s.member }, ...p.events] };
}

function createMember(state: SimulatorState, member: string, replace: boolean): StepResult {
  const s = state.editor!;
  if (getMember(state.catalog, s.dsn, member) && !replace) return withMessage(state, { short: MSG.MEMBER_EXISTS, long: "Use REPLACE name to overwrite it.", severity: "error" });
  const r = saveRecords(state.catalog, { dsn: s.dsn, member }, bufferRecords(s), { today: state.today, userid: state.userid });
  if (r.error) return withMessage(state, { short: r.error, severity: "error" });
  const events: SimEvent[] = r.created ? [{ type: "MEMBER_CREATED", dsn: s.dsn, member }] : [];
  events.push({ type: "MEMBER_SAVED", dsn: s.dsn, member });
  return { state: { ...state, catalog: r.catalog, message: { short: "MEMBER CREATED", long: `${s.dsn}(${member}) written from the editor buffer.`, severity: "info" } }, events };
}

function copyIntoBuffer(state: SimulatorState, member: string): StepResult {
  const s = state.editor!;
  const read = readRecords(state.catalog, { dsn: s.dsn, member });
  if (read.error) return withMessage(state, { short: read.error, severity: "error" });
  const dest = s.pending.find((p) => p.raw === "A" || p.raw === "B");
  if (!dest && s.lines.length > 0) return withMessage(state, { short: "ENTER A OR B LINE COMMAND", long: "Mark where the copied lines go with A (after) or B (before), then COPY member.", severity: "error" });
  const { lines: fresh, nextId } = makeLines(s, (read.records ?? []).map((r) => r.padEnd(s.lrecl).slice(0, s.lrecl)));
  let lines = s.lines;
  if (!dest) lines = fresh;
  else {
    const idx = s.lines.findIndex((l) => l.id === dest.lineId);
    const at = dest.raw === "B" ? idx : idx + 1;
    lines = [...s.lines.slice(0, at), ...fresh, ...s.lines.slice(at)];
  }
  const session: EditorSession = { ...s, lines, nextId, dirty: true, pending: s.pending.filter((p) => p !== dest) };
  return {
    state: { ...state, editor: session, message: { short: `${fresh.length} LINES COPIED`, severity: "info" } },
    events: [{ type: "EDITOR_LINES_COPIED", count: fresh.length, dest: dest?.raw ?? "A" }],
  };
}
