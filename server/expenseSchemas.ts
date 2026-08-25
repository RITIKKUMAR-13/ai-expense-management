import { z } from "zod";

export const expenseCategorySchema = z.enum(["food", "transport", "shopping", "bills", "health", "entertainment", "other"]);

export const periodKeySchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use a YYYY-MM period");

export const createExpenseInput = z.object({
  merchant: z.string().trim().min(2, "Enter a merchant or expense title").max(100),
  category: expenseCategorySchema,
  amountPaise: z.number().int().positive("Amount must be greater than zero").max(50_000_000),
  spentAt: z.date(),
  paymentMethod: z.string().trim().max(36).optional(),
  note: z.string().trim().max(240).optional(),
});

export const deleteExpenseInput = z.object({ id: z.number().int().positive() });

export const setBudgetInput = z.object({
  category: expenseCategorySchema,
  periodKey: periodKeySchema,
  limitPaise: z.number().int().positive("Budget must be greater than zero").max(100_000_000),
});

export const dashboardInput = z.object({ periodKey: periodKeySchema });
