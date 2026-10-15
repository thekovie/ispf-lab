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

/** No Edit session is open. A Browse (for example of job output) is allowed: it is an editor session in the simulator too. */
export const noEditSession: Validator = ({ state }) => !state.editor || state.editor.mode !== "EDIT";

/** No editor session is open (the learner has left the editor). */
export const editorClosed: Validator = ({ state }) => !state.editor;

/** The check question with this id has been answered correctly in this attempt (ADR 0018). */
export const answered =
  (questionId: string): Validator =>
  (ctx) =>
    ctx.answers?.[questionId] === true;

/** An event of this type happened; `match` narrows it. */
export const eventIs =
  <T extends SimEvent["type"]>(type: T, match?: (e: EventOf<T>, ctx: LessonContext) => boolean): Validator =>
  (ctx) => {
    if (!ctx.event || ctx.event.type !== type) return false;
    return match ? match(ctx.event as EventOf<T>, ctx) : true;
  };

/** A predicate over one event, for the history helpers below (Challenge outcome checks). */
export type EventPred = (e: SimEvent, ctx: LessonContext) => boolean;

/** Event predicate: an event of this type (optionally narrowed by `match`). */
export const is =
  <T extends SimEvent["type"]>(type: T, match?: (e: EventOf<T>, ctx: LessonContext) => boolean): EventPred =>
  (e, ctx) =>
    e.type === type && (!match || match(e as EventOf<T>, ctx));

/** The events a Challenge check may look at: the history since the Challenge started, else just the current event. */
const eventsSeen = (ctx: LessonContext): SimEvent[] => ctx.history ?? (ctx.event ? [ctx.event] : []);

/** Every predicate matched by at least one event seen so far, in any order. */
export const sawAll =
  (...preds: EventPred[]): Validator =>
  (ctx) => {
    const seen = eventsSeen(ctx);
    return preds.every((p) => seen.some((e) => p(e, ctx)));
  };

/** Every predicate matched by an event after the one that matched the previous predicate. */
export const sawInOrder =
  (...preds: EventPred[]): Validator =>
  (ctx) => {
    const seen = eventsSeen(ctx);
    let next = 0;
    for (const e of seen) if (next < preds.length && preds[next](e, ctx)) next++;
    return next === preds.length;
  };

/** Every predicate matched by some event before the last event matching `final` (the closing action). */
export const sawAllThen =
  (preds: EventPred[], final: EventPred): Validator =>
  (ctx) => {
    const seen = eventsSeen(ctx);
    let last = -1;
    seen.forEach((e, i) => {
      if (final(e, ctx)) last = i;
    });
    return last >= 0 && preds.every((p) => seen.slice(0, last).some((e) => p(e, ctx)));
  };

/** At least `n` events matched the predicate. */
export const sawTimes =
  (n: number, pred: EventPred): Validator =>
  (ctx) =>
    eventsSeen(ctx).filter((e) => pred(e, ctx)).length >= n;

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

export const savedMember =
  (dsn: string, member?: string): Validator =>
  eventIs("MEMBER_SAVED", (e, ctx) => e.dsn === hlq(ctx, dsn) && (!member || e.member === member.toUpperCase()));

export const pfPressed =
  (key: number): Validator =>
  eventIs("PF_KEY_PRESSED", (e) => e.key === key);
