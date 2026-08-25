import { describe, expect, it } from "vitest";
import { createExpenseInput, periodKeySchema, setBudgetInput } from "./expenseSchemas";

describe("expense data contracts", () => {
  it("accepts a safe user expense record with integer paise", () => {
    expect(createExpenseInput.parse({ merchant: "Metro transit", category: "transport", amountPaise: 6400, spentAt: new Date("2026-08-25T10:00:00Z") })).toMatchObject({ category: "transport", amountPaise: 6400 });
  });

  it("rejects invalid financial values and malformed periods", () => {
    expect(() => createExpenseInput.parse({ merchant: "X", category: "food", amountPaise: 0, spentAt: new Date() })).toThrow();
    expect(() => periodKeySchema.parse("2026-19")).toThrow();
    expect(() => setBudgetInput.parse({ category: "food", periodKey: "2026-08", limitPaise: -1 })).toThrow();
  });
});
