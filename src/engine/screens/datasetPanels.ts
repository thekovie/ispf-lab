/**
 * 3.1 Library Utility, 3.2 Data Set Utility, and the Data Set Information panel.
 * Reference: docs/03-ispf-behaviour-reference.md §3.1, §3.2, §Data set information.
 */
import { getDataset, listMembers, parseDsnRef } from "@/catalog/catalog";
import { blank, f, label, padRow, t, titleRow } from "../rows";
import { fail, pop, push } from "../navigation";
import { openRef } from "../open";
import type { Fields, ScreenHandler, SimulatorState, StepResult } from "../types";

function dsnFromFields(state: SimulatorState, fields: Fields): { raw: string } | { error: StepResult } {
  const other = (fields.other ?? "").trim();
  const project = (fields.project ?? "").trim();
  const group = (fields.group ?? "").trim();
  const type = (fields.type ?? "").trim();
  if (other) return { raw: other };
  if (project && group && type) return { raw: `${project}.${group}.${type}` };
  return { error: fail({ ...state, fieldValues: fields, focusField: "other" }, "ENTER DATA SET NAME") };
}

function libraryRows(state: SimulatorState, title: string, options: string[], extraField?: [string, string]) {
  const msg = state.message;
  const v = (id: string, def = "") => state.fieldValues[id] ?? def;
  const rows = [
    titleRow(title, msg?.short, msg?.severity === "error" ? "red" : "yellow"),
    [label("Option ===> "), f("option", 2, v("option"))],
    blank,
    ...options.map((o) => padRow(o)),
    blank,
    [t("ISPF Library:", "white", true)],
    [label("   Project . . "), f("project", 8, v("project", state.userid))],
    [label("   Group . . . "), f("group", 8, v("group"))],
    [label("   Type  . . . "), f("type", 8, v("type"))],
  ];
  if (extraField) rows.push([label(`   ${extraField[0].padEnd(10)}. `), f(extraField[1], 8, v(extraField[1]))]);
  rows.push(blank, [t("Other Partitioned or Sequential Data Set:", "white", true)], [label("   Data Set Name . . . "), f("other", 46, v("other"))]);
  return rows;
}

export const libraryUtilityScreen: ScreenHandler<{ id: "LIBRARY_UTILITY" }> = {
  help: [
    "3.1 Library Utility works with the members of one PDS.",
    "Leave Option blank to display the member list; D deletes and R renames the",
    "member named in the Member field (R needs a New name); E, B, V open it.",
  ],
  render(state) {
    const rows = libraryRows(state, "Library Utility", [
      "   blank Display member list        B Browse member          D Delete member",
      "       E Edit member                V View member            R Rename member",
      "   (I Data set information, C/X compress and print are not available here)",
    ], ["Member", "member"]);
    rows.splice(10, 0, [label("   New name  . "), f("newname", 8, state.fieldValues.newname ?? ""), t("   (For rename)", "white")]);
    return {
      title: "Library Utility",
      pfKeys: [{ key: 1, label: "Help" }, { key: 3, label: "Exit" }],
      fields: ["option", "project", "group", "type", "member", "newname", "other"],
      focus: state.focusField ?? "option",
      message: state.message,
      rows,
    };
  },
  onEnter(state, _frame, fields) {
    const option = (fields.option ?? "").trim().toUpperCase();
    const dsn = dsnFromFields(state, fields);
    if ("error" in dsn) return dsn.error;
    const ref = parseDsnRef(dsn.raw);
    if (!ref) return fail({ ...state, fieldValues: fields }, "INVALID DATA SET NAME");
    const member = (fields.member ?? "").trim().toUpperCase() || ref.member;
    const ds = getDataset(state.catalog, ref.dsn);
    if (!ds) return fail({ ...state, fieldValues: fields }, "DATA SET NOT CATALOGED");
    const withFields = { ...state, fieldValues: fields };
    switch (option) {
      case "":
        return openRef(withFields, { dsn: ref.dsn }, "M");
      case "E":
      case "B":
      case "V":
        return member ? openRef(withFields, { dsn: ref.dsn, member }, option) : fail(withFields, "MEMBER NAME REQUIRED");
      case "D":
        if (!member) return fail(withFields, "MEMBER NAME REQUIRED");
        if (ds.readOnly) return fail(withFields, "DATA SET IS READ ONLY");
        return push(withFields, { id: "CONFIRM_DELETE", target: { dsn: ref.dsn, member } });
      case "R": {
        if (!member) return fail(withFields, "MEMBER NAME REQUIRED");
        if (ds.readOnly) return fail(withFields, "DATA SET IS READ ONLY");
        const r = push(withFields, { id: "RENAME", target: { dsn: ref.dsn, member } });
        const newname = (fields.newname ?? "").trim().toUpperCase();
        return newname ? { ...r, state: { ...r.state, fieldValues: { newname } } } : r;
      }
      default:
        return fail(withFields, "INVALID OPTION");
    }
  },
  onPf(state, _frame, key) {
    return key === 3 ? pop(state) : null;
  },
};

export const datasetUtilityScreen: ScreenHandler<{ id: "DATASET_UTILITY" }> = {
  help: [
    "3.2 Data Set Utility acts on a whole data set: A allocates (creates) a new",
    "one, R renames, D deletes, blank shows its information. Type the name in",
    "Other Data Set Name (or the Project/Group/Type fields) and the option letter.",
  ],
  render(state) {
    const rows = libraryRows(state, "Data Set Utility", [
      "   A Allocate new data set           C Catalog data set",
      "   R Rename entire data set          U Uncatalog data set",
      "   D Delete entire data set          S Data set information (short)",
      "   blank Data set information        V VSAM Utilities",
    ]);
    return {
      title: "Data Set Utility",
      pfKeys: [{ key: 1, label: "Help" }, { key: 3, label: "Exit" }],
      fields: ["option", "project", "group", "type", "other"],
      focus: state.focusField ?? "option",
      message: state.message,
      rows,
    };
  },
  onEnter(state, _frame, fields) {
    const option = (fields.option ?? "").trim().toUpperCase();
    const dsn = dsnFromFields(state, fields);
    if ("error" in dsn) return dsn.error;
    const ref = parseDsnRef(dsn.raw);
    if (!ref || ref.member) return fail({ ...state, fieldValues: fields }, "INVALID DATA SET NAME", "3.2 works on whole data sets; do not include a member name.");
    const ds = getDataset(state.catalog, ref.dsn);
    const withFields = { ...state, fieldValues: fields };
    switch (option) {
      case "A":
        if (ds) return fail(withFields, "DATA SET ALREADY EXISTS");
        return push(withFields, { id: "ALLOCATE_DATASET", dsn: ref.dsn });
      case "":
      case "S":
        if (!ds) return fail(withFields, "DATA SET NOT CATALOGED");
        return push(withFields, { id: "DATASET_INFO", dsn: ds.name }, [{ type: "DATASET_INFO_VIEWED", dsn: ds.name }]);
      case "R":
        if (!ds) return fail(withFields, "DATA SET NOT CATALOGED");
        if (ds.readOnly) return fail(withFields, "DATA SET IS READ ONLY");
        return push(withFields, { id: "RENAME", target: { dsn: ds.name } });
      case "D":
        if (!ds) return fail(withFields, "DATA SET NOT CATALOGED");
        if (ds.readOnly) return fail(withFields, "DATA SET IS READ ONLY");
        return push(withFields, { id: "CONFIRM_DELETE", target: { dsn: ds.name } });
      case "C":
      case "U":
      case "V":
        return fail(withFields, "OPTION NOT AVAILABLE IN THIS TRAINING MODULE");
      default:
        return fail(withFields, "INVALID OPTION");
    }
  },
  onPf(state, _frame, key) {
    return key === 3 ? pop(state) : null;
  },
};

export const datasetInfoScreen: ScreenHandler<{ id: "DATASET_INFO"; dsn: string }> = {
  help: [
    "Data Set Information shows the attributes the system keeps for a data set:",
    "organization (PO = partitioned, PS = sequential), record format, record",
    "length, block size, space, and for a PDS the directory blocks and members.",
  ],
  render(state, frame) {
    const ds = getDataset(state.catalog, frame.dsn);
    const msg = state.message;
    if (!ds) return { title: "Data Set Information", pfKeys: [{ key: 3, label: "Exit" }], fields: [], message: msg, rows: [titleRow("Data Set Information", "DATA SET NOT CATALOGED", "red")] };
    const members = ds.datasetType === "PDS" ? listMembers(ds).length : 0;
    return {
      title: "Data Set Information",
      pfKeys: [{ key: 1, label: "Help" }, { key: 3, label: "Exit" }],
      fields: [],
      message: msg,
      rows: [
        titleRow("Data Set Information", msg?.short, msg?.severity === "error" ? "red" : "yellow"),
        [label("Command ===> "), t("_".repeat(60), "dim")],
        blank,
        [label("Data Set Name  . . . . : "), t(ds.name, "white")],
        blank,
        [t("General Data                          Current Allocation", "white", true)],
        [label(" Management class . . : "), t("STANDARD ", "green"), label("       Allocated "), t(ds.spaceUnits.toLowerCase() === "cyls" ? "cylinders" : "tracks", "cyan"), t(" . : ", "cyan"), t(String(ds.primary), "green")],
        [label(" Storage class  . . . : "), t("USRDATA  ", "green"), label("       Allocated extents . : "), t("1", "green")],
        [label("  Volume serial . . . : "), t(ds.volume.padEnd(9), "green"), label(ds.datasetType === "PDS" ? "       Maximum dir. blocks : " : ""), t(ds.datasetType === "PDS" ? String(ds.dirBlocks) : "", "green")],
        [label("  Device type . . . . : "), t("3390     ", "green")],
        [label(" Data class . . . . . : "), t("**None** ", "green"), label("      Current Utilization")],
        [label("  Organization  . . . : "), t(ds.dsorg.padEnd(9), "green"), label("       Used "), t(ds.spaceUnits.toLowerCase() === "cyls" ? "cylinders" : "tracks", "cyan"), t("  . . . : ", "cyan"), t(String(Math.max(1, Math.ceil(ds.primary / 3))), "green")],
        [label("  Record format . . . : "), t(ds.recfm.padEnd(9), "green"), label("       Used extents  . . . : "), t("1", "green")],
        [label("  Record length . . . : "), t(String(ds.lrecl).padEnd(9), "green"), label(ds.datasetType === "PDS" ? "       Used dir. blocks  . : " : ""), t(ds.datasetType === "PDS" ? String(Math.min(ds.dirBlocks, Math.ceil(members / 5) || 1)) : "", "green")],
        [label("  Block size  . . . . : "), t(String(ds.blksize).padEnd(9), "green"), label(ds.datasetType === "PDS" ? "       Number of members . : " : ""), t(ds.datasetType === "PDS" ? String(members) : "", "green")],
        [label("  1st extent "), t(ds.spaceUnits.toLowerCase() === "cyls" ? "cylinders" : "tracks", "cyan"), t(": ", "cyan"), t(String(ds.primary), "green")],
        [label("  Secondary "), t(ds.spaceUnits.toLowerCase() === "cyls" ? "cylinders" : "tracks", "cyan"), t("  : ", "cyan"), t(String(ds.secondary), "green")],
        [label("  Data set name type  : "), t(ds.datasetType === "PDS" ? "PDS" : "", "green")],
        blank,
        [label("  Creation date . . . : "), t(ds.createdAt, "green"), label("       Owner . . . . . . . : "), t(ds.owner, "green")],
        [label("  Read only . . . . . : "), t(ds.readOnly ? "YES (system library)" : "NO", ds.readOnly ? "yellow" : "green")],
      ],
    };
  },
  onEnter(state) {
    return pop(state);
  },
  onPf(state, _frame, key) {
    return key === 3 ? pop(state) : null;
  },
};
