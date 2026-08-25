import { describe, expect, it } from "vitest";
import { addSavingsContributionInput, createSavingsGoalInput } from "./savingsSchemas";

describe("savings goal contracts", () => {
  it("accepts a laptop or mobile savings target", () => {
    expect(createSavingsGoalInput.parse({ title: "New laptop", icon: "laptop", targetPaise: 8500000 }).icon).toBe("laptop");
    expect(createSavingsGoalInput.parse({ title: "New mobile", icon: "mobile", targetPaise: 4500000 }).targetPaise).toBe(4500000);
  });

  it("rejects invalid targets and contribution values", () => {
    expect(() => createSavingsGoalInput.parse({ title: "X", icon: "laptop", targetPaise: 0 })).toThrow();
    expect(() => addSavingsContributionInput.parse({ goalId: 0, amountPaise: 0 })).toThrow();
  });
});
