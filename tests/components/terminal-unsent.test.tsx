/**
 * The terminal keeps typed text as drafts until Enter / a PF key (3270 semantics). The store can ask it whether editor
 * text is typed but unsent, so a lesson start/restart/mode switch can confirm before discarding it.
 * Only editor record and prefix fields count: an unsent command or option is never worth a prompt.
 */
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Terminal } from "@/components/terminal/Terminal";
import { MemoryAdapter } from "@/persistence/storage";
import { SimulatorProvider, useSimulatorStore } from "@/state/SimulatorProvider";
import type { SimulatorStore } from "@/state/store";

function mount() {
  const holder = {} as { store: SimulatorStore };
  function Harness() {
    holder.store = useSimulatorStore();
    return <Terminal />;
  }
  render(
    <SimulatorProvider storage={new MemoryAdapter()}>
      <Harness />
    </SimulatorProvider>,
  );
  return holder.store;
}

const send = (store: SimulatorStore, fields: Record<string, string>) => act(() => void store.enter(fields));

function openHello(store: SimulatorStore) {
  send(store, { userid: "USER01" });
  send(store, { option: "2" });
  send(store, { project: "", group: "", type: "", member: "", other: "USER01.JCL(HELLO)" });
}

describe("unsent editor text is reported by the terminal", () => {
  it("reports nothing on a fresh editor", () => {
    const store = mount();
    openHello(store);
    expect(store.unsentWork()).toBeNull();
  });

  it("reports editor text that was typed but not sent, naming the member", async () => {
    const store = mount();
    openHello(store);
    const user = userEvent.setup();
    const record = screen.getByLabelText("line:3");
    await user.clear(record);
    await user.type(record, "//STEP1    EXEC PGM=IEBGENER");
    expect(store.unsentWork()).toMatch(/USER01\.JCL\(HELLO\).*not yet sent/);
  });

  it("clears once Enter sends the text", async () => {
    const store = mount();
    openHello(store);
    const user = userEvent.setup();
    const record = screen.getByLabelText("line:3");
    await user.clear(record);
    await user.type(record, "//STEP1    EXEC PGM=IEBGENER{Enter}");
    expect(store.unsentWork()).toBeNull();
  });

  it("does not count an unsent command line", async () => {
    const store = mount();
    openHello(store);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("command"), "FIND DIVISION");
    expect(store.unsentWork()).toBeNull();
  });

  it("stops reporting when the terminal goes away", () => {
    const store = mount();
    openHello(store);
    store.setUnsentProbe(null);
    expect(store.unsentWork()).toBeNull();
  });
});
