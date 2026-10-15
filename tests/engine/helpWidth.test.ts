/**
 * Project rule: every row a screen renders fits 80 columns. PF1 Help renders each handler's `help` lines through
 * padRow, which cuts at 80, so a longer line is silently truncated (found in the M3 diff review).
 */
import { describe, expect, it } from "vitest";
import { getHandler } from "@/engine/registry";
import type { ScreenId } from "@/engine/types";

const IDS: ScreenId[] = [
  "LOGIN", "PRIMARY_OPTION_MENU", "SETTINGS", "UTILITY_SELECTION", "EDIT_ENTRY", "LIBRARY_UTILITY", "DATASET_UTILITY", "ALLOCATE_DATASET", "MOVE_COPY",
  "DSLIST_SEARCH", "DSLIST_RESULTS", "DATASET_INFO", "MEMBER_LIST", "MEMBER_INFO", "SDSF_MENU", "SDSF_STATUS", "SDSF_JOB_DS", "CONFIRM_PURGE", "EDIT",
  "BROWSE", "VIEW", "AUTOSAVE_PROMPT", "CONFIRM_DELETE", "RENAME", "COPY_MOVE", "TSO_COMMAND", "HELP", "MESSAGE",
];

describe("help text width", () => {
  it.each(IDS)("%s help lines fit 80 columns", (id) => {
    for (const line of getHandler(id)?.help ?? []) expect(line.length, line).toBeLessThanOrEqual(80);
  });
});
