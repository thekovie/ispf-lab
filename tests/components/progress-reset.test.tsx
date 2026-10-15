/**
 * M1 closure (GAP-64): "Reset training environment" on the Progress page resets everything the top-bar reset does, including
 * the virtual JES, so no job is left pointing at a member that went back to the seed.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProgressView } from "@/components/shell/ProgressView";
import { KEYS } from "@/persistence/keys";

const USER = "USER01";

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(KEYS.lastUserid, JSON.stringify(USER));
  localStorage.setItem(KEYS.jes(USER), JSON.stringify({ version: 1, nextJobNumber: 2, jobs: [], log: ["a log line"] }));
  vi.spyOn(window, "confirm").mockReturnValue(true);
});
afterEach(() => vi.restoreAllMocks());

describe("Progress page resets", () => {
  it("Reset training environment also clears the virtual JES", async () => {
    render(<ProgressView />);
    expect(localStorage.getItem(KEYS.jes(USER))).not.toBeNull();
    fireEvent.click(await screen.findByRole("button", { name: /reset training environment/i }));
    expect(localStorage.getItem(KEYS.jes(USER))).toBeNull();
  });

  it("declining the confirmation resets nothing", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<ProgressView />);
    fireEvent.click(await screen.findByRole("button", { name: /reset training environment/i }));
    expect(localStorage.getItem(KEYS.jes(USER))).not.toBeNull();
  });
});
