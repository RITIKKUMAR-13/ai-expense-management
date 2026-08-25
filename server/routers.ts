import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import {
  createAppointment,
  createExpense,
  createPatient,
  deleteExpense,
  getExpenseDashboard,
  getHospitalDashboard,
  getOperationsOverview,
  listAppointments,
  listPatients,
  updateAppointmentStatus,
  updatePatientStatus,
  setBudget,
  addSavingsContribution,
  createSavingsGoal,
  listSavingsGoals,
} from "./db";
import {
  createAppointmentInput,
  createPatientInput,
  updateAppointmentStatusInput,
  updatePatientStatusInput,
} from "./hospitalSchemas";
import { createExpenseInput, dashboardInput, deleteExpenseInput, expenseInsightOutput, setBudgetInput } from "./expenseSchemas";
import { addSavingsContributionInput, createSavingsGoalInput } from "./savingsSchemas";
import { invokeLLM } from "./_core/llm";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  hospital: router({
    dashboard: protectedProcedure.query(({ ctx }) => getHospitalDashboard(ctx.user.id)),
    patients: router({
      list: protectedProcedure.query(({ ctx }) => listPatients(ctx.user.id)),
      create: protectedProcedure.input(createPatientInput).mutation(async ({ ctx, input }) => {
        await createPatient(ctx.user.id, input);
        return { success: true } as const;
      }),
      updateStatus: protectedProcedure.input(updatePatientStatusInput).mutation(async ({ ctx, input }) => {
        await updatePatientStatus(ctx.user.id, input);
        return { success: true } as const;
      }),
    }),
    appointments: router({
      list: protectedProcedure.query(({ ctx }) => listAppointments(ctx.user.id)),
      create: protectedProcedure.input(createAppointmentInput).mutation(async ({ ctx, input }) => {
        await createAppointment(ctx.user.id, input);
        return { success: true } as const;
      }),
      updateStatus: protectedProcedure.input(updateAppointmentStatusInput).mutation(async ({ ctx, input }) => {
        await updateAppointmentStatus(ctx.user.id, input);
        return { success: true } as const;
      }),
    }),
    operations: adminProcedure.query(({ ctx }) => getOperationsOverview(ctx.user.id)),
  }),
  finance: router({
    dashboard: protectedProcedure.input(dashboardInput).query(({ ctx, input }) => getExpenseDashboard(ctx.user.id, input.periodKey)),
    expenses: router({
      create: protectedProcedure.input(createExpenseInput).mutation(async ({ ctx, input }) => {
        await createExpense(ctx.user.id, input);
        return { success: true } as const;
      }),
      delete: protectedProcedure.input(deleteExpenseInput).mutation(async ({ ctx, input }) => {
        await deleteExpense(ctx.user.id, input.id);
        return { success: true } as const;
      }),
    }),
    budgets: router({
      set: protectedProcedure.input(setBudgetInput).mutation(async ({ ctx, input }) => {
        await setBudget(ctx.user.id, input);
        return { success: true } as const;
      }),
    }),
    savings: router({
      list: protectedProcedure.query(({ ctx }) => listSavingsGoals(ctx.user.id)),
      create: protectedProcedure.input(createSavingsGoalInput).mutation(async ({ ctx, input }) => {
        await createSavingsGoal(ctx.user.id, input);
        return { success: true } as const;
      }),
      contribute: protectedProcedure.input(addSavingsContributionInput).mutation(async ({ ctx, input }) => {
        await addSavingsContribution(ctx.user.id, input);
        return { success: true } as const;
      }),
    }),
    insight: protectedProcedure.input(dashboardInput).mutation(async ({ ctx, input }) => {
      const dashboard = await getExpenseDashboard(ctx.user.id, input.periodKey);
      const safeAggregate = {
        period: input.periodKey,
        totalSpentPaise: dashboard.stats.totalSpentPaise,
        totalBudgetPaise: dashboard.stats.totalBudgetPaise,
        transactionCount: dashboard.stats.transactionCount,
        categoryTotals: dashboard.categoryTotals,
        budgets: dashboard.budgets.map(({ category, limitPaise, spentPaise }) => ({ category, limitPaise, spentPaise })),
      };
      const response = await invokeLLM({
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: "You write concise expense-tracking observations. Use only provided aggregate data. Do not provide investment, lending, tax, legal, or insurance advice. Avoid predictions. Return practical descriptive budget observations only." },
          { role: "user", content: `Analyze this authorized aggregate expense data and return JSON matching the schema: ${JSON.stringify(safeAggregate)}` },
        ],
        responseFormat: {
          type: "json_schema",
          json_schema: {
            name: "expense_insight",
            strict: true,
            schema: {
              type: "object",
              properties: {
                headline: { type: "string" },
                observation: { type: "string" },
                nextStep: { type: "string" },
                focusCategory: { type: "string" },
              },
              required: ["headline", "observation", "nextStep", "focusCategory"],
              additionalProperties: false,
            },
          },
        },
      });
      const raw = response.choices[0]?.message.content;
      if (typeof raw !== "string") throw new Error("AI insight response was unavailable.");
      return expenseInsightOutput.parse(JSON.parse(raw));
    }),
  }),
});

export type AppRouter = typeof appRouter;
