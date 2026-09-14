/**
 * The utility programs the virtual JES can run: IEFBR14, IEBGENER, SORT (DFSORT subset), IDCAMS (subset).
 * Each program reads/writes through DD statements against the virtual catalog and returns a condition code,
 * SYSOUT-class output and system messages. Reference: docs/10-jes-sdsf.md; IBM z/OS DFSMSdfp Utilities,
 * DFSORT Application Programming Guide, DFSMS Access Method Services.
 */
import { deleteDataset, parseDsnRef, readRecords, saveRecords, searchLevel } from "@/catalog/catalog";
import type { Catalog, DsnRef } from "@/catalog/types";
import type { DdStatement, StepStatement } from "./jcl";

export interface ProgramContext {
  catalog: Catalog;
  userid: string;
  today: string;
  jobName: string;
  step: StepStatement;
}

export interface ProgramResult {
  catalog: Catalog;
  rc?: number;
  abend?: string;
  /** SYSOUT-class output produced by DD, in DD order */
  sysout: { ddname: string; records: string[] }[];
  /** extra lines for JESYSMSG (e.g. CSV003I for a missing module) */
  messages: string[];
}

export const KNOWN_PROGRAMS = ["IEFBR14", "IEBGENER", "SORT", "ICEMAN", "IDCAMS"] as const;

const dd = (step: StepStatement, name: string): DdStatement | undefined => step.dds.find((d) => d.ddname === name);
const ref = (d: DdStatement): DsnRef | null => (d.params.DSN ? parseDsnRef(d.params.DSN) : null);

/** Records behind a DD: in-stream data, a data set (member), DUMMY (nothing). */
function readDd(catalog: Catalog, d: DdStatement): { records?: string[]; error?: string } {
  if (d.instream) return { records: d.instream };
  if (d.dummy) return { records: [] };
  const r = ref(d);
  if (!r) return { error: `${d.ddname}: NO DATA SET NAME` };
  const read = readRecords(catalog, r);
  return read.error ? { error: `${d.ddname}: ${read.error}` } : { records: read.records ?? [] };
}

/** Write records to a DD: SYSOUT goes to the spool, a data set is written through the catalog, DUMMY discards. */
function writeDd(ctx: ProgramContext, catalog: Catalog, d: DdStatement, records: string[], out: ProgramResult["sysout"]): { catalog: Catalog; error?: string } {
  if (d.sysout !== undefined) {
    out.push({ ddname: d.ddname, records });
    return { catalog };
  }
  if (d.dummy) return { catalog };
  const r = ref(d);
  if (!r) return { catalog, error: `${d.ddname}: NO DATA SET NAME` };
  const saved = saveRecords(catalog, r, records, { today: ctx.today, userid: ctx.userid });
  return saved.error ? { catalog, error: `${d.ddname}: ${saved.error}` } : { catalog: saved.catalog };
}

function iefbr14(ctx: ProgramContext): ProgramResult {
  // Allocation and disposition processing did everything; the program itself just returns.
  return { catalog: ctx.catalog, rc: 0, sysout: [], messages: [] };
}

function iebgener(ctx: ProgramContext): ProgramResult {
  const print: string[] = ["1DATA SET UTILITY - GENERATE                                                   PAGE 0001"];
  const out: ProgramResult["sysout"] = [];
  const sysut1 = dd(ctx.step, "SYSUT1");
  const sysut2 = dd(ctx.step, "SYSUT2");
  const finish = (catalog: Catalog, rc: number): ProgramResult => {
    const sysprint = dd(ctx.step, "SYSPRINT");
    if (sysprint) writeDd(ctx, catalog, sysprint, print, out);
    return { catalog, rc, sysout: out, messages: [] };
  };
  if (!sysut1 || !sysut2) {
    print.push(` IEC130I ${!sysut1 ? "SYSUT1" : "SYSUT2"} DD STATEMENT MISSING`);
    return finish(ctx.catalog, 12);
  }
  const input = readDd(ctx.catalog, sysut1);
  if (input.error) {
    print.push(` IEB351I ${input.error}`);
    return finish(ctx.catalog, 12);
  }
  const w = writeDd(ctx, ctx.catalog, sysut2, input.records ?? [], out);
  if (w.error) {
    print.push(` IEB351I ${w.error}`);
    return finish(ctx.catalog, 12);
  }
  print.push(` ${String(input.records?.length ?? 0).padStart(8)} RECORDS COPIED FROM SYSUT1 TO SYSUT2`, " PROCESSING ENDED AT EOD");
  return finish(w.catalog, 0);
}

interface SortField {
  pos: number;
  len: number;
  desc: boolean;
}

function parseSortFields(control: string[]): { fields?: SortField[]; copy?: boolean; error?: string } {
  const text = control.map((l) => l.trim()).join(" ");
  const m = text.match(/SORT\s+FIELDS=(COPY|\(([^)]*)\))/i);
  if (!m) return { error: "ICE007A SYNTAX ERROR ON CONTROL STATEMENT" };
  if (m[1].toUpperCase() === "COPY") return { copy: true };
  const items = m[2].split(",").map((s) => s.trim());
  const fields: SortField[] = [];
  for (let i = 0; i + 3 < items.length + 1; i += 4) {
    const pos = parseInt(items[i], 10);
    const len = parseInt(items[i + 1], 10);
    const order = (items[i + 3] ?? "A").toUpperCase();
    if (!pos || !len || !["A", "D"].includes(order)) return { error: "ICE007A SYNTAX ERROR ON CONTROL STATEMENT" };
    fields.push({ pos, len, desc: order === "D" });
  }
  return fields.length ? { fields } : { error: "ICE007A SYNTAX ERROR ON CONTROL STATEMENT" };
}

function sortProgram(ctx: ProgramContext): ProgramResult {
  const log: string[] = ["ICE000I 0 - CONTROL STATEMENTS FOR 5650-ZOS, Z/OS DFSORT (SIMULATED)"];
  const out: ProgramResult["sysout"] = [];
  const finish = (catalog: Catalog, rc: number): ProgramResult => {
    const sysoutDd = dd(ctx.step, "SYSOUT");
    if (sysoutDd) writeDd(ctx, catalog, sysoutDd, log, out);
    return { catalog, rc, sysout: out, messages: [] };
  };
  const sysin = dd(ctx.step, "SYSIN");
  const control = sysin ? (readDd(ctx.catalog, sysin).records ?? []) : [];
  log.push(...control.map((l) => `           ${l}`));
  const spec = parseSortFields(control);
  if (spec.error) {
    log.push(spec.error, "ICE052I 3 END OF DFSORT");
    return finish(ctx.catalog, 16);
  }
  const sortin = dd(ctx.step, "SORTIN");
  const sortout = dd(ctx.step, "SORTOUT");
  if (!sortin || !sortout) {
    log.push(`ICE026A 0 ${!sortin ? "SORTIN" : "SORTOUT"} DD STATEMENT MISSING`, "ICE052I 3 END OF DFSORT");
    return finish(ctx.catalog, 16);
  }
  const input = readDd(ctx.catalog, sortin);
  if (input.error) {
    log.push(`ICE026A 0 ${input.error}`, "ICE052I 3 END OF DFSORT");
    return finish(ctx.catalog, 16);
  }
  const records = [...(input.records ?? [])];
  if (!spec.copy && spec.fields) {
    const fields = spec.fields;
    records.sort((a, b) => {
      for (const f of fields) {
        const ka = a.slice(f.pos - 1, f.pos - 1 + f.len);
        const kb = b.slice(f.pos - 1, f.pos - 1 + f.len);
        const c = ka < kb ? -1 : ka > kb ? 1 : 0;
        if (c !== 0) return f.desc ? -c : c;
      }
      return 0;
    });
  }
  const w = writeDd(ctx, ctx.catalog, sortout, records, out);
  if (w.error) {
    log.push(`ICE026A 0 ${w.error}`, "ICE052I 3 END OF DFSORT");
    return finish(ctx.catalog, 16);
  }
  log.push("ICE201I 0 RECORD TYPE IS F - DATA STARTS IN POSITION 1", "ICE055I 0 INSERT 0, DELETE 0", `ICE054I 0 RECORDS - IN: ${records.length}, OUT: ${records.length}`, "ICE052I 0 END OF DFSORT");
  return finish(w.catalog, 0);
}

function idcams(ctx: ProgramContext): ProgramResult {
  const print: string[] = ["1IDCAMS  SYSTEM SERVICES                                           TIME: 00:00:00        PAGE   1"];
  const out: ProgramResult["sysout"] = [];
  let catalog = ctx.catalog;
  let maxCc = 0;
  const sysin = dd(ctx.step, "SYSIN");
  const control = sysin ? (readDd(catalog, sysin).records ?? []) : [];
  const commands = control
    .join(" ")
    .split(/\s+(?=(?:LISTCAT|LISTC|DELETE|DEL)\b)/i)
    .map((c) => c.trim())
    .filter(Boolean);
  for (const cmd of commands) {
    print.push(`0${cmd}`);
    const m = cmd.match(/^(LISTCAT|LISTC|DELETE|DEL)\b\s*(.*)$/i);
    if (!m) {
      print.push("IDC3203I ITEM DOES NOT ADHERE TO RESTRICTIONS", "IDC3003I FUNCTION TERMINATED. CONDITION CODE IS 12");
      maxCc = Math.max(maxCc, 12);
      continue;
    }
    const verb = m[1].toUpperCase();
    const args = m[2];
    if (verb.startsWith("LISTC")) {
      const level = args.match(/LEVEL\s*\(\s*([^)]+)\s*\)/i)?.[1] ?? args.replace(/[' ]/g, "");
      const entries = searchLevel(catalog, level);
      for (const ds of entries) print.push(`NONVSAM ------- ${ds.name}`, "     IN-CAT --- CATALOG.USER");
      const cc = entries.length ? 0 : 4;
      print.push(`IDC0001I FUNCTION COMPLETED, HIGHEST CONDITION CODE WAS ${cc}`);
      maxCc = Math.max(maxCc, cc);
    } else {
      const name = args.replace(/'/g, "").split(/\s+/)[0]?.toUpperCase() ?? "";
      const r = deleteDataset(catalog, name);
      if (r.error) {
        print.push(`IDC3012I ENTRY ${name} NOT FOUND`, `IDC0551I ** ENTRY ${name} NOT DELETED`, "IDC0001I FUNCTION COMPLETED, HIGHEST CONDITION CODE WAS 8");
        maxCc = Math.max(maxCc, 8);
      } else {
        catalog = r.catalog;
        print.push(`IDC0550I ENTRY (A) ${name} DELETED`, "IDC0001I FUNCTION COMPLETED, HIGHEST CONDITION CODE WAS 0");
      }
    }
  }
  print.push(`0IDC0002I IDCAMS PROCESSING COMPLETE. MAXIMUM CONDITION CODE WAS ${maxCc}`);
  const sysprint = dd(ctx.step, "SYSPRINT");
  if (sysprint) writeDd(ctx, catalog, sysprint, print, out);
  return { catalog, rc: maxCc, sysout: out, messages: [] };
}

/** Run one step's program. Unknown modules abend S806 as the loader would. */
export function runProgram(ctx: ProgramContext): ProgramResult {
  const program = ctx.step.program ?? "";
  switch (program) {
    case "IEFBR14":
      return iefbr14(ctx);
    case "IEBGENER":
      return iebgener(ctx);
    case "SORT":
    case "ICEMAN":
      return sortProgram(ctx);
    case "IDCAMS":
      return idcams(ctx);
    default:
      return {
        catalog: ctx.catalog,
        abend: "S806",
        sysout: [],
        messages: [
          `CSV003I REQUESTED MODULE ${program} NOT FOUND`,
          `CSV028I ABEND806-04 JOBNAME=${ctx.jobName} STEPNAME=${ctx.step.name}`,
          "IEA995I SYMPTOM DUMP OUTPUT  SYSTEM COMPLETION CODE=806  REASON CODE=00000004",
        ],
      };
  }
}
