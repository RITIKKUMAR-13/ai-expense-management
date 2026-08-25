import { describe, expect, it } from "vitest";
import { getSavingsProgress } from "../client/src/lib/savingsMath";

describe("savings progress math", () => {
  it("calculates the remaining balance for an active important-purchase goal", () => {
    expect(getSavingsProgress(7500000, 2250000, "active")).toEqual({ complete: false, percent: 30, remainingPaise: 5250000 });
  });

  it("caps progress at 100% and marks completed goals safely", () => {
    expect(getSavingsProgress(5000000, 5500000, "active")).toEqual({ complete: true, percent: 100, remainingPaise: 0 });
    expect(getSavingsProgress(5000000, 4800000, "completed").complete).toBe(true);
  });
});
