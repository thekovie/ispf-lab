/**
 * Small composable validators used by lesson definitions.
 * They inspect events and state — never the DOM.
 */
import { getMember, readRecords } from "@/catalog/catalog";
import type { ScreenId, SimEvent } from "@/engine/types";
import type { LessonContext, Validator } from "./types";

type EventOf<T extends SimEvent["type"]> = Extract<SimEvent, { type: T }>;

export const hlq = (ctx: LessonContext, name: string) => name.replace(/\{HLQ\}/g, ctx.hlq);

/** The current screen is one of the given ids, or it was opened during this action (so 3.4 satisfies "open Utilities" too). */
export const onScreen =
  (...ids: ScreenId[]): Validator =>
  ({ state, event }) =>
    ids.includes(state.screen.id) || (event?.type === "SCREEN_OPENED" && ids.includes(event.screen));

/** No editor session is open (the learner has left the editor). */
export const editorClosed: Validator = ({ state }) => !state.editor;

/** An event of this type happened; `match` narrows it. */
export const eventIs =
  <T extends SimEvent["type"]>(type: T, match?: (e: EventOf<T>, ctx: LessonContext) => boolean): Validator =>
  (ctx) => {
    if (!ctx.event || ctx.event.type !== type) return false;
    return match ? match(ctx.event as EventOf<T>, ctx) : true;
  };

export const anyOf =
  (...vs: Validator[]): Validator =>
  (ctx) =>
    vs.some((v) => v(ctx));

export const allOf =
  (...vs: Validator[]): Validator =>
  (ctx) =>
    vs.every((v) => v(ctx));

/** The editor is open on this data set (and member), optionally in a given mode. */
export const editorOpen =
  (dsn: string, member?: string, mode?: "EDIT" | "BROWSE" | "VIEW"): Validator =>
  (ctx) => {
    const e = ctx.state.editor;
    if (!e) return false;
    if (e.dsn !== hlq(ctx, dsn)) return false;
    if (member && e.member !== member.toUpperCase()) return false;
    if (mode && e.mode !== mode) return false;
    return true;
  };

export const memberListOpen =
  (dsn: string): Validator =>
  (ctx) =>
    ctx.state.screen.id === "MEMBER_LIST" && ctx.state.screen.dsn === hlq(ctx, dsn);

export const dslistShowing =
  (levelPredicate: (level: string, ctx: LessonContext) => boolean): Validator =>
  (ctx) =>
    ctx.state.screen.id === "DSLIST_RESULTS" && levelPredicate(ctx.state.screen.level, ctx);

/** The catalog contains a member satisfying `test` (records are trimmed). */
export const memberSatisfies =
  (dsn: string, member: string, test: (records: string[]) => boolean): Validator =>
  (ctx) => {
    const r = readRecords(ctx.state.catalog, { dsn: hlq(ctx, dsn), member });
    return !!r.records && test(r.records.map((x) => x.trimEnd()));
  };

export const memberExists =
  (dsn: string, member: string, exists = true): Validator =>
  (ctx) =>
    !!getMember(ctx.state.catalog, hlq(ctx, dsn), member) === exists;

export const datasetExists =
  (dsn: string, exists = true): Validator =>
  (ctx) =>
    !!ctx.state.catalog.datasets[hlq(ctx, dsn)] === exists;

export const editorHasLine =
  (test: (text: string) => boolean): Validator =>
  (ctx) =>
    !!ctx.state.editor && ctx.state.editor.lines.some((l) => test(l.text.trimEnd()));

export const editorLineCount =
  (test: (n: number) => boolean): Validator =>
  (ctx) =>
    !!ctx.state.editor && test(ctx.state.editor.lines.length);

export const savedMember =
  (dsn: string, member?: string): Validator =>
  eventIs("MEMBER_SAVED", (e, ctx) => e.dsn === hlq(ctx, dsn) && (!member || e.member === member.toUpperCase()));

export const pfPressed =
  (key: number): Validator =>
  eventIs("PF_KEY_PRESSED", (e) => e.key === key);
