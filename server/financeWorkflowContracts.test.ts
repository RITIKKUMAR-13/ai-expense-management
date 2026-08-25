import { describe, expect, it } from "vitest";
import {
  createExpenseInput,
  dashboardInput,
  deleteExpenseInput,
  expenseInsightOutput,
  setBudgetInput,
} from "./expenseSchemas";

describe("Spendwise finance workflow contracts", () => {
  it("accepts a complete private-ledger creation payload", () => {
    const expense = createExpenseInput.parse({
      merchant: "Metro recharge",
      category: "transport",
      amountPaise: 3200,
      spentAt: new Date("2026-08-25T08:30:00Z"),
      paymentMethod: "UPI",
      note: "Monthly pass top-up",
    });

    expect(expense.merchant).toBe("Metro recharge");
    expect(expense.amountPaise).toBe(3200);
  });

  it("accepts the ledger filter period and a valid scoped delete id", () => {
    expect(dashboardInput.parse({ periodKey: "2026-08" }).periodKey).toBe("2026-08");
    expect(deleteExpenseInput.parse({ id: 42 }).id).toBe(42);
  });

  it("accepts a monthly budget update and rejects an out-of-range amount", () => {
    expect(setBudgetInput.parse({ category: "bills", periodKey: "2026-08", limitPaise: 150000 }).limitPaise).toBe(150000);
    expect(() => setBudgetInput.parse({ category: "bills", periodKey: "2026-08", limitPaise: 0 })).toThrow();
  });

  it("enforces the aggregate-only AI insight response shape", () => {
    expect(expenseInsightOutput.parse({
      headline: "Transport was the largest category this month.",
      observation: "Transport accounts for the largest portion of your selected-month aggregate expenses.",
      nextStep: "Review the transport budget threshold before the next trip.",
      focusCategory: "transport",
    }).focusCategory).toBe("transport");

    expect(() => expenseInsightOutput.parse({ headline: "Missing fields" })).toThrow();
    expect(() => expenseInsightOutput.parse({ headline: "x", observation: "y", nextStep: "z", focusCategory: "investments" })).toThrow();
  });
});
