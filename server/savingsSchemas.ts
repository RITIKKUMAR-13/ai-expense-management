import { z } from "zod";

export const savingsIconSchema = z.enum(["laptop", "mobile", "travel", "home", "other"]);

export const createSavingsGoalInput = z.object({
  title: z.string().trim().min(2, "Enter a goal name").max(100),
  icon: savingsIconSchema,
  targetPaise: z.number().int().positive("Target must be greater than zero").max(100_000_000),
  targetDate: z.date().optional(),
});

export const addSavingsContributionInput = z.object({
  goalId: z.number().int().positive(),
  amountPaise: z.number().int().positive("Saving amount must be greater than zero").max(100_000_000),
  note: z.string().trim().max(160).optional(),
});
