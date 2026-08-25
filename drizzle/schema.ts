import { index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Administrative patient directory only. Do not store clinical notes or diagnoses here. */
export const patients = mysqlTable("patients", {
  id: int("id").autoincrement().primaryKey(),
  /** User-owned data scope for this prototype workspace. */
  ownerId: int("ownerId").notNull(),
  displayName: varchar("displayName", { length: 96 }).notNull(),
  patientCode: varchar("patientCode", { length: 32 }).notNull(),
  age: int("age").notNull(),
  phone: varchar("phone", { length: 24 }),
  status: mysqlEnum("status", ["waiting", "checkedIn", "withDoctor", "completed"]).default("waiting").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("patients_owner_idx").on(table.ownerId),
  index("patients_owner_status_idx").on(table.ownerId, table.status),
]);

/** Appointment schedule linked to the authenticated user’s administrative directory. */
export const appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  patientId: int("patientId").notNull().references(() => patients.id, { onDelete: "cascade" }),
  department: varchar("department", { length: 72 }).notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(),
  status: mysqlEnum("status", ["scheduled", "checkedIn", "completed", "cancelled"]).default("scheduled").notNull(),
  note: varchar("note", { length: 240 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("appointments_owner_idx").on(table.ownerId),
  index("appointments_owner_schedule_idx").on(table.ownerId, table.scheduledAt),
]);

export type Patient = typeof patients.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;

/** User-scoped financial transactions. Amounts are stored in paise to avoid decimal drift. */
export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  merchant: varchar("merchant", { length: 100 }).notNull(),
  category: mysqlEnum("category", ["food", "transport", "shopping", "bills", "health", "entertainment", "other"]).notNull(),
  amountPaise: int("amountPaise").notNull(),
  spentAt: timestamp("spentAt").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 36 }),
  note: varchar("note", { length: 240 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("expenses_owner_spent_idx").on(table.ownerId, table.spentAt),
  index("expenses_owner_category_idx").on(table.ownerId, table.category),
]);

/** One category budget per month for each authenticated user. */
export const budgets = mysqlTable("budgets", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  category: mysqlEnum("category", ["food", "transport", "shopping", "bills", "health", "entertainment", "other"]).notNull(),
  periodKey: varchar("periodKey", { length: 7 }).notNull(),
  limitPaise: int("limitPaise").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("budgets_owner_period_category_unique").on(table.ownerId, table.periodKey, table.category),
  index("budgets_owner_period_idx").on(table.ownerId, table.periodKey),
]);

export type Expense = typeof expenses.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
