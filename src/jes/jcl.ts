/**
 * A small JCL recogniser: enough to run the training jobs and to produce the classic converter errors.
 * Reference: IBM z/OS MVS JCL Reference (statement fields, continuation, in-stream data);
 * z/OS MVS System Messages IEFC6xxI. Simplifications are listed in docs/10-jes-sdsf.md.
 */

export interface JclError {
  line: number;
  /** IBM message id, e.g. IEFC605I */
  id: string;
  text: string;
}

export interface DdStatement {
  line: number;
  ddname: string;
  params: Record<string, string>;
  /** records of `DD *` / `DD DATA` in-stream data */
  instream?: string[];
  /** true for `DD DUMMY` */
  dummy: boolean;
  sysout?: string;
}

export interface StepStatement {
  line: number;
  name: string;
  program?: string;
  proc?: string;
  params: Record<string, string>;
  dds: DdStatement[];
}

export interface ParsedJcl {
  jobName?: string;
  jobLine?: number;
  jobParams: Record<string, string>;
  steps: StepStatement[];
  errors: JclError[];
  /** numbered listing lines for JESJCL */
  listing: string[];
}

const NAME_RE = /^[A-Z#$@][A-Z0-9#$@]{0,7}$/;
const EXEC_KEYWORDS = new Set(["PGM", "PROC", "PARM", "COND", "REGION", "TIME"]);
const DD_KEYWORDS = new Set(["DSN", "DSNAME", "DISP", "SPACE", "UNIT", "DCB", "SYSOUT", "VOL", "DUMMY", "RECFM", "LRECL", "BLKSIZE", "DSORG"]);

/**
 * Split a parameter string on commas, respecting parentheses and quotes:
 * `DSN=A.B,DISP=(NEW,CATLG,DELETE),SPACE=(TRK,(5,2))` → 3 items.
 */
export function splitParams(text: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let quoted = false;
  let cur = "";
  for (const ch of text) {
    if (ch === "'") quoted = !quoted;
    if (!quoted) {
      if (ch === "(") depth++;
      else if (ch === ")") depth--;
      else if (ch === "," && depth === 0) {
        out.push(cur);
        cur = "";
        continue;
      }
    }
    cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}

/** KEY=VALUE pairs; positional items get numeric keys "0", "1"… (JOB accounting/programmer). */
export function parseParams(text: string): Record<string, string> {
  const params: Record<string, string> = {};
  let pos = 0;
  for (const item of splitParams(text)) {
    const eq = item.indexOf("=");
    if (eq > 0 && !item.startsWith("'")) params[item.slice(0, eq).toUpperCase()] = item.slice(eq + 1);
    else params[String(pos++)] = item;
  }
  return params;
}

/** The first positional of DISP=(NEW,CATLG,DELETE) or the bare value of DISP=SHR. */
export function dispStatus(params: Record<string, string>): string {
  const d = params.DISP ?? "";
  const inner = d.startsWith("(") ? d.slice(1, -1) : d;
  return (splitParams(inner)[0] ?? "").toUpperCase();
}

/** The operand field ends at the first blank outside quotes and parentheses; what follows is a comment. */
function operandField(text: string): string {
  let depth = 0;
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "'") quoted = !quoted;
    else if (!quoted && ch === "(") depth++;
    else if (!quoted && ch === ")") depth--;
    else if (!quoted && depth === 0 && ch === " ") return text.slice(0, i);
  }
  return text;
}

interface RawStatement {
  line: number;
  name: string;
  operation: string;
  operands: string;
  text: string;
}

/** Tokenise records into statements, joining continuations and capturing in-stream data. */
function collect(records: string[]): { statements: RawStatement[]; instream: Map<number, string[]>; errors: JclError[]; listing: string[] } {
  const statements: RawStatement[] = [];
  const instream = new Map<number, string[]>();
  const errors: JclError[] = [];
  const listing: string[] = [];
  let i = 0;
  let stmtNo = 0;
  const numbered = (text: string) => `${String(++stmtNo).padStart(2)}       ${text}`;
  while (i < records.length) {
    const text = records[i].slice(0, 72).trimEnd();
    const lineNo = i + 1;
    if (text.startsWith("//*") || text.trim() === "") {
      listing.push(`         ${text}`);
      i++;
      continue;
    }
    if (!text.startsWith("//")) {
      // data outside an in-stream DD: the converter cannot identify the statement
      errors.push({ line: lineNo, id: "IEFC605I", text: "UNIDENTIFIED OPERATION FIELD" });
      listing.push(`         ${text}`);
      i++;
      continue;
    }
    if (text === "//") {
      listing.push(numbered("//"));
      i++;
      break; // null statement ends the job
    }
    listing.push(numbered(text));
    const body = text.slice(2);
    let name = "";
    let rest = body;
    if (!body.startsWith(" ")) {
      const sp = body.indexOf(" ");
      name = sp < 0 ? body : body.slice(0, sp);
      rest = sp < 0 ? "" : body.slice(sp);
    }
    rest = rest.trimStart();
    const opEnd = rest.indexOf(" ");
    const operation = (opEnd < 0 ? rest : rest.slice(0, opEnd)).toUpperCase();
    let operands = operandField(opEnd < 0 ? "" : rest.slice(opEnd + 1).trimStart());
    let last = lineNo;
    while (operands.endsWith(",")) {
      const next = records[i + 1]?.slice(0, 72).trimEnd();
      if (next === undefined || !next.startsWith("// ") || next.startsWith("//*")) {
        errors.push({ line: last, id: "IEFC621I", text: "EXPECTED CONTINUATION NOT RECEIVED" });
        break;
      }
      i++;
      last = i + 1;
      listing.push(`         ${next}`);
      operands += operandField(next.slice(2).trimStart());
    }
    statements.push({ line: lineNo, name, operation, operands, text });
    i++;
    if (operation === "DD" && /^(\*|DATA)(,|$)/.test(operands)) {
      const data: string[] = [];
      while (i < records.length && !records[i].startsWith("//") && records[i].trimEnd() !== "/*") {
        data.push(records[i].trimEnd());
        listing.push(`         ${records[i].trimEnd()}`);
        i++;
      }
      if (i < records.length && records[i].trimEnd() === "/*") {
        listing.push("         /*");
        i++;
      }
      instream.set(lineNo, data);
    }
  }
  return { statements, instream, errors, listing };
}

const OPERATIONS = new Set(["JOB", "EXEC", "DD"]);

export function parseJcl(records: string[]): ParsedJcl {
  const { statements, instream, errors, listing } = collect(records);
  const result: ParsedJcl = { jobParams: {}, steps: [], errors, listing };
  let step: StepStatement | undefined;
  for (const st of statements) {
    if (!OPERATIONS.has(st.operation)) {
      errors.push({ line: st.line, id: "IEFC605I", text: "UNIDENTIFIED OPERATION FIELD" });
      continue;
    }
    if (st.name && !NAME_RE.test(st.name.toUpperCase())) errors.push({ line: st.line, id: "IEFC662I", text: "INVALID LABEL" });
    const name = st.name.toUpperCase();
    const params = parseParams(st.operands);
    if (st.operation === "JOB") {
      if (result.jobName) {
        errors.push({ line: st.line, id: "IEFC606I", text: "MISPLACED JOB STATEMENT" });
        continue;
      }
      if (!name) errors.push({ line: st.line, id: "IEFC605I", text: "JOB STATEMENT NAME FIELD MISSING" });
      result.jobName = name || "NONAME";
      result.jobLine = st.line;
      result.jobParams = params;
      continue;
    }
    if (!result.jobName) {
      errors.push({ line: st.line, id: "IEFC606I", text: "MISPLACED DD OR EXEC STATEMENT - NO JOB STATEMENT" });
      result.jobName = "NONAME";
    }
    if (st.operation === "EXEC") {
      const program = params.PGM?.toUpperCase();
      const proc = params.PROC?.toUpperCase() ?? (params["0"] && !program ? params["0"].toUpperCase() : undefined);
      if (!program && !proc) errors.push({ line: st.line, id: "IEFC605I", text: "EXEC STATEMENT WITHOUT PGM OR PROC" });
      for (const key of Object.keys(params)) {
        if (!/^\d+$/.test(key) && !EXEC_KEYWORDS.has(key)) errors.push({ line: st.line, id: "IEFC630I", text: `UNIDENTIFIED KEYWORD ${key}` });
      }
      step = { line: st.line, name: name || `STEP${result.steps.length + 1}`, program, proc, params, dds: [] };
      result.steps.push(step);
      continue;
    }
    if (!step) {
      errors.push({ line: st.line, id: "IEFC606I", text: "MISPLACED DD STATEMENT" });
      continue;
    }
    for (const key of Object.keys(params)) {
      if (!/^\d+$/.test(key) && !DD_KEYWORDS.has(key)) errors.push({ line: st.line, id: "IEFC630I", text: `UNIDENTIFIED KEYWORD ${key}` });
    }
    if (params.DSNAME && !params.DSN) params.DSN = params.DSNAME;
    const positional = (params["0"] ?? "").toUpperCase();
    step.dds.push({
      line: st.line,
      ddname: name || `DD${step.dds.length + 1}`,
      params,
      instream: instream.get(st.line),
      dummy: positional === "DUMMY" || "DUMMY" in params,
      sysout: params.SYSOUT,
    });
  }
  if (!result.jobName) errors.push({ line: 1, id: "IEFC452I", text: "JOB NOT RUN - NO JOB STATEMENT" });
  errors.sort((a, b) => a.line - b.line);
  return result;
}
