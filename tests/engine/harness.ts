/**
 * Test harness: drive the pure reducer the way the UI would (Enter / PF with field values).
 */
import { createInitialState } from "@/engine/initialState";
import { reduce, render } from "@/engine/reducer";
import type { Fields, SimEvent, SimulatorState } from "@/engine/types";

export class Sim {
  state: SimulatorState;
  events: SimEvent[] = [];

  constructor(userid = "USER01") {
    this.state = createInitialState(userid, "2026/09/11");
  }

  static loggedOn(userid = "USER01"): Sim {
    const s = new Sim(userid);
    s.enter({ userid });
    s.events = [];
    return s;
  }

  enter(fields: Fields = {}): this {
    const r = reduce(this.state, { type: "ENTER", fields });
    this.state = r.state;
    this.events.push(...r.events);
    return this;
  }

  pf(key: number, fields: Fields = {}): this {
    const r = reduce(this.state, { type: "PF", key, fields });
    this.state = r.state;
    this.events.push(...r.events);
    return this;
  }

  /** Type an option/command on the current panel's main input and press Enter. */
  cmd(text: string): this {
    const screen = render(this.state);
    const id = screen.fields.includes("option") ? "option" : "command";
    return this.enter({ [id]: text });
  }

  get screenId() {
    return this.state.screen.id;
  }

  get message() {
    return this.state.message?.short;
  }

  eventTypes(): string[] {
    return this.events.map((e) => e.type);
  }

  has(type: SimEvent["type"]): boolean {
    return this.events.some((e) => e.type === type);
  }

  rendered() {
    return render(this.state);
  }

  /** Editor line ids in display order. */
  lineIds(): number[] {
    return this.state.editor?.lines.map((l) => l.id) ?? [];
  }

  texts(): string[] {
    return this.state.editor?.lines.map((l) => l.text.trimEnd()) ?? [];
  }
}
