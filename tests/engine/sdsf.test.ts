import { describe, expect, it } from "vitest";
import { Sim } from "./harness";

const rowsText = (s: Sim) => JSON.stringify(s.rendered().rows);
const editPayrpt = () => Sim.loggedOn().cmd("2").enter({ other: "USER01.JCL(PAYRPT)" });

describe("submitting jobs", () => {
  it("SUBMIT in Edit runs the buffer and reports the job id", () => {
    const s = editPayrpt().enter({ command: "SUBMIT" });
    expect(s.message).toBe("JOB USER01P(JOB00001) SUBMITTED");
    expect(s.has("JOB_SUBMITTED")).toBe(true);
    expect(s.has("JCL_ERROR_GENERATED")).toBe(true);
    expect(s.state.jes.jobs[0]).toMatchObject({ id: "JOB00001", jobName: "USER01P", status: "JCL_ERROR", source: { dsn: "USER01.JCL", member: "PAYRPT" } });
    expect(s.screenId).toBe("EDIT");
  });
  it("TSO SUBMIT submits a member and job numbers increase", () => {
    const s = Sim.loggedOn().cmd("TSO SUBMIT JCL(HELLO)");
    expect(s.screenId).toBe("TSO_COMMAND");
    expect(rowsText(s)).toContain("IKJ56250I JOB USER01H(JOB00001) SUBMITTED");
    s.enter({ command: "SUBMIT 'USER01.JCL(HELLO)'" });
    expect(s.state.jes.jobs.map((j) => j.id)).toEqual(["JOB00001", "JOB00002"]);
    s.enter({ command: "SUBMIT JCL(NOPE)" });
    expect(rowsText(s)).toContain("IKJ56228I");
  });
});

describe("SDSF", () => {
  it("option S, =S and SDSF reach the simulated menu; ST lists the user's jobs", () => {
    const s = Sim.loggedOn().cmd("S");
    expect(s.screenId).toBe("SDSF_MENU");
    expect(rowsText(s)).toContain("(SIMULATED)");
    s.pf(3).cmd("3.4").cmd("=S");
    expect(s.screenId).toBe("SDSF_MENU");
    s.cmd("ST");
    expect(s.screenId).toBe("SDSF_STATUS");
    expect(s.has("JOB_STATUS_OPENED")).toBe(true);
    expect(rowsText(s)).toContain("No jobs match");
  });
  it("shows JCL ERROR, ? lists the spool data sets, S browses JESYSMSG", () => {
    const s = editPayrpt().enter({ command: "SUBMIT" }).cmd("=S").cmd("ST");
    expect(rowsText(s)).toContain("JCL ERROR");
    expect(rowsText(s)).toContain("USER01P");
    s.enter({ "cmd:JOB00001": "?" });
    expect(s.screenId).toBe("SDSF_JOB_DS");
    expect(rowsText(s)).toContain("JESMSGLG");
    expect(rowsText(s)).toContain("JESYSMSG");
    s.enter({ "cmd:JESYSMSG": "S" });
    expect(s.screenId).toBe("BROWSE");
    expect(s.events.some((e) => e.type === "JOB_OUTPUT_OPENED" && e.ddname === "JESYSMSG")).toBe(true);
    expect(s.texts().join("\n")).toContain("IEF212I USER01P REPORT SYSUT1 - DATA SET NOT FOUND");
    s.pf(3);
    expect(s.screenId).toBe("SDSF_JOB_DS");
    s.pf(3);
    expect(s.screenId).toBe("SDSF_STATUS");
  });
  it("Day-One flow: SJ fixes the JCL, resubmit ends CC 0000, SYSUT2 shows the report", () => {
    const s = editPayrpt().enter({ command: "SUBMIT" }).cmd("=S").cmd("ST");
    s.enter({ "cmd:JOB00001": "SJ" });
    expect(s.screenId).toBe("EDIT");
    expect(s.state.editor?.member).toBe("PAYRPT");
    s.enter({ command: "C PAYROLL.DATA DATA(EMPLOYEE)" });
    s.enter({ command: "SUBMIT" });
    expect(s.message).toBe("JOB USER01P(JOB00002) SUBMITTED");
    s.pf(3); // saves the fix, back to SDSF ST
    expect(s.screenId).toBe("SDSF_STATUS");
    expect(rowsText(s)).toContain("CC 0000");
    s.enter({ "cmd:JOB00002": "?" }).enter({ "cmd:SYSUT2": "S" });
    expect(s.texts().length).toBeGreaterThan(1);
    const completed = s.events.filter((e) => e.type === "JOB_COMPLETED");
    expect(completed.at(-1)).toMatchObject({ jobId: "JOB00002", status: "OUTPUT", maxRc: 0 });
  });
  it("S on a job browses all output; P purges after confirmation; OWNER/PREFIX filter", () => {
    const s = Sim.loggedOn().cmd("TSO SUBMIT JCL(HELLO)").pf(3).cmd("S").cmd("ST");
    s.enter({ "cmd:JOB00001": "S" });
    expect(s.screenId).toBe("BROWSE");
    expect(s.texts().join("\n")).toContain("JESMSGLG");
    s.pf(3);
    s.cmd("PREFIX ZZZ*");
    expect(rowsText(s)).toContain("No jobs match");
    s.cmd("PREFIX *").cmd("OWNER OTHER");
    expect(rowsText(s)).toContain("No jobs match");
    s.cmd("OWNER");
    s.enter({ "cmd:JOB00001": "P" });
    expect(s.screenId).toBe("CONFIRM_PURGE");
    s.pf(3);
    expect(s.state.jes.jobs.length).toBe(1);
    s.enter({ "cmd:JOB00001": "P" }).enter({ confirm: "Y" });
    expect(s.state.jes.jobs.length).toBe(0);
    expect(s.has("JOB_PURGED")).toBe(true);
    expect(s.message).toBe("JOB00001 PURGED");
  });
  it("LOG browses the accumulated JES messages; unavailable panels say so", () => {
    const s = Sim.loggedOn().cmd("TSO SUBMIT JCL(HELLO)").pf(3).cmd("S").cmd("LOG");
    expect(s.screenId).toBe("BROWSE");
    expect(s.texts().join("\n")).toContain("$HASP395 USER01H  ENDED - RC=0000");
    s.pf(3).cmd("DA");
    expect(s.message).toBe("OPTION NOT AVAILABLE IN THIS TRAINING MODULE");
  });
  it("jobs persist through the store and reset with the environment", async () => {
    const { SimulatorStore } = await import("@/state/store");
    const { MemoryAdapter } = await import("@/persistence/storage");
    const { loadJes } = await import("@/persistence/jesStore");
    const storage = new MemoryAdapter();
    const store = new SimulatorStore(storage, "2026/09/15");
    store.boot();
    store.enter({ userid: "USER01" });
    store.enter({ option: "TSO SUBMIT JCL(HELLO)" });
    expect(loadJes(storage, "USER01").jobs.length).toBe(1);
    const again = new SimulatorStore(storage, "2026/09/15");
    again.boot();
    again.enter({ userid: "USER01" });
    expect(again.getState().jes.jobs[0].id).toBe("JOB00001");
    again.resetEnvironment();
    expect(loadJes(storage, "USER01").jobs).toEqual([]);
  });
});
