import { and, desc, eq, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { appointments, budgets, expenses, InsertUser, patients, savingsContributions, savingsGoals, users } from "../drizzle/schema";
import type { z } from "zod";
import type {
  createAppointmentInput,
  createPatientInput,
  updateAppointmentStatusInput,
  updatePatientStatusInput,
} from "./hospitalSchemas";
import type { createExpenseInput, setBudgetInput } from "./expenseSchemas";
import type { addSavingsContributionInput, createSavingsGoalInput } from "./savingsSchemas";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

type CreatePatientInput = z.infer<typeof createPatientInput>;
type UpdatePatientStatusInput = z.infer<typeof updatePatientStatusInput>;
type CreateAppointmentInput = z.infer<typeof createAppointmentInput>;
type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusInput>;
type CreateExpenseInput = z.infer<typeof createExpenseInput>;
type SetBudgetInput = z.infer<typeof setBudgetInput>;
type CreateSavingsGoalInput = z.infer<typeof createSavingsGoalInput>;
type AddSavingsContributionInput = z.infer<typeof addSavingsContributionInput>;

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available. Please try again shortly.");
  return db;
}

export async function listPatients(ownerId: number) {
  const db = await requireDb();
  return db.select().from(patients).where(eq(patients.ownerId, ownerId)).orderBy(desc(patients.updatedAt));
}

export async function createPatient(ownerId: number, input: CreatePatientInput) {
  const db = await requireDb();
  await db.insert(patients).values({
    ownerId,
    displayName: input.displayName,
    patientCode: input.patientCode,
    age: input.age,
    phone: input.phone || null,
    status: "waiting",
  });
}

export async function updatePatientStatus(ownerId: number, input: UpdatePatientStatusInput) {
  const db = await requireDb();
  await db.update(patients)
    .set({ status: input.status, updatedAt: new Date() })
    .where(and(eq(patients.id, input.id), eq(patients.ownerId, ownerId)));
}

export async function listAppointments(ownerId: number) {
  const db = await requireDb();
  return db.select({
    id: appointments.id,
    patientId: appointments.patientId,
    department: appointments.department,
    scheduledAt: appointments.scheduledAt,
    status: appointments.status,
    note: appointments.note,
    patientName: patients.displayName,
    patientCode: patients.patientCode,
  })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .where(eq(appointments.ownerId, ownerId))
    .orderBy(appointments.scheduledAt);
}

export async function createAppointment(ownerId: number, input: CreateAppointmentInput) {
  const db = await requireDb();
  const patient = await db.select({ id: patients.id })
    .from(patients)
    .where(and(eq(patients.id, input.patientId), eq(patients.ownerId, ownerId)))
    .limit(1);

  if (!patient[0]) throw new Error("Select a patient from your private workspace.");

  await db.insert(appointments).values({
    ownerId,
    patientId: input.patientId,
    department: input.department,
    scheduledAt: input.scheduledAt,
    note: input.note || null,
    status: "scheduled",
  });
}

export async function updateAppointmentStatus(ownerId: number, input: UpdateAppointmentStatusInput) {
  const db = await requireDb();
  await db.update(appointments)
    .set({ status: input.status, updatedAt: new Date() })
    .where(and(eq(appointments.id, input.id), eq(appointments.ownerId, ownerId)));
}

export async function getHospitalDashboard(ownerId: number) {
  const [patientRows, appointmentRows] = await Promise.all([listPatients(ownerId), listAppointments(ownerId)]);
  const patientsByStatus = patientRows.reduce<Record<string, number>>((result, patient) => {
    result[patient.status] = (result[patient.status] || 0) + 1;
    return result;
  }, {});
  const appointmentsByStatus = appointmentRows.reduce<Record<string, number>>((result, appointment) => {
    result[appointment.status] = (result[appointment.status] || 0) + 1;
    return result;
  }, {});

  return {
    patients: patientRows,
    appointments: appointmentRows,
    stats: {
      totalPatients: patientRows.length,
      waiting: patientsByStatus.waiting || 0,
      checkedIn: patientsByStatus.checkedIn || 0,
      withDoctor: patientsByStatus.withDoctor || 0,
      scheduled: appointmentsByStatus.scheduled || 0,
    },
  };
}

export async function getOperationsOverview(ownerId: number) {
  const dashboard = await getHospitalDashboard(ownerId);
  return {
    activeCareLoad: dashboard.stats.checkedIn + dashboard.stats.withDoctor,
    scheduledAppointments: dashboard.stats.scheduled,
    completedVisits: dashboard.patients.filter((patient) => patient.status === "completed").length,
    totalPatients: dashboard.stats.totalPatients,
  };
}

function periodRange(periodKey: string) {
  const [year, month] = periodKey.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}

export async function listExpenses(ownerId: number, periodKey: string) {
  const db = await requireDb();
  const { start, end } = periodRange(periodKey);
  return db.select().from(expenses)
    .where(and(eq(expenses.ownerId, ownerId), gte(expenses.spentAt, start), lte(expenses.spentAt, end)))
    .orderBy(desc(expenses.spentAt), desc(expenses.id));
}

export async function createExpense(ownerId: number, input: CreateExpenseInput) {
  const db = await requireDb();
  await db.insert(expenses).values({
    ownerId,
    merchant: input.merchant,
    category: input.category,
    amountPaise: input.amountPaise,
    spentAt: input.spentAt,
    paymentMethod: input.paymentMethod || null,
    note: input.note || null,
  });
}

export async function deleteExpense(ownerId: number, id: number) {
  const db = await requireDb();
  await db.delete(expenses).where(and(eq(expenses.id, id), eq(expenses.ownerId, ownerId)));
}

export async function listBudgets(ownerId: number, periodKey: string) {
  const db = await requireDb();
  return db.select().from(budgets).where(and(eq(budgets.ownerId, ownerId), eq(budgets.periodKey, periodKey)));
}

export async function setBudget(ownerId: number, input: SetBudgetInput) {
  const db = await requireDb();
  await db.insert(budgets).values({ ownerId, category: input.category, periodKey: input.periodKey, limitPaise: input.limitPaise })
    .onDuplicateKeyUpdate({ set: { limitPaise: input.limitPaise, updatedAt: new Date() } });
}

export async function getExpenseDashboard(ownerId: number, periodKey: string) {
  const [expenseRows, budgetRows] = await Promise.all([listExpenses(ownerId, periodKey), listBudgets(ownerId, periodKey)]);
  const categoryTotals = expenseRows.reduce<Record<string, number>>((result, expense) => {
    result[expense.category] = (result[expense.category] || 0) + expense.amountPaise;
    return result;
  }, {});
  const totalSpentPaise = expenseRows.reduce((total, expense) => total + expense.amountPaise, 0);
  const totalBudgetPaise = budgetRows.reduce((total, budget) => total + budget.limitPaise, 0);

  return {
    expenses: expenseRows,
    budgets: budgetRows.map((budget) => ({ ...budget, spentPaise: categoryTotals[budget.category] || 0 })),
    categoryTotals: Object.entries(categoryTotals).map(([category, amountPaise]) => ({ category, amountPaise })),
    stats: {
      totalSpentPaise,
      totalBudgetPaise,
      remainingBudgetPaise: totalBudgetPaise - totalSpentPaise,
      transactionCount: expenseRows.length,
    },
  };
}

export async function listSavingsGoals(ownerId: number) {
  const db = await requireDb();
  const [goals, contributions] = await Promise.all([
    db.select().from(savingsGoals).where(eq(savingsGoals.ownerId, ownerId)).orderBy(desc(savingsGoals.updatedAt)),
    db.select().from(savingsContributions).where(eq(savingsContributions.ownerId, ownerId)).orderBy(desc(savingsContributions.createdAt)),
  ]);
  const savedByGoal = contributions.reduce<Record<number, number>>((result, contribution) => {
    result[contribution.goalId] = (result[contribution.goalId] || 0) + contribution.amountPaise;
    return result;
  }, {});
  return goals.map((goal) => ({ ...goal, savedPaise: savedByGoal[goal.id] || 0 }));
}

export async function createSavingsGoal(ownerId: number, input: CreateSavingsGoalInput) {
  const db = await requireDb();
  await db.insert(savingsGoals).values({
    ownerId,
    title: input.title,
    icon: input.icon,
    targetPaise: input.targetPaise,
    targetDate: input.targetDate || null,
    status: "active",
  });
}

export async function addSavingsContribution(ownerId: number, input: AddSavingsContributionInput) {
  const db = await requireDb();
  const goalRows = await db.select().from(savingsGoals)
    .where(and(eq(savingsGoals.id, input.goalId), eq(savingsGoals.ownerId, ownerId))).limit(1);
  const goal = goalRows[0];
  if (!goal) throw new Error("Savings goal was not found in your private workspace.");
  if (goal.status === "completed") throw new Error("This savings goal is already complete.");

  await db.insert(savingsContributions).values({ ownerId, goalId: input.goalId, amountPaise: input.amountPaise, note: input.note || null });
  const totalRows = await db.select().from(savingsContributions).where(and(eq(savingsContributions.goalId, input.goalId), eq(savingsContributions.ownerId, ownerId)));
  const savedPaise = totalRows.reduce((total, contribution) => total + contribution.amountPaise, 0);
  if (savedPaise >= goal.targetPaise) {
    await db.update(savingsGoals).set({ status: "completed", updatedAt: new Date() }).where(eq(savingsGoals.id, goal.id));
  }
}
