import { z } from "zod";

export const patientStatusSchema = z.enum(["waiting", "checkedIn", "withDoctor", "completed"]);
export const appointmentStatusSchema = z.enum(["scheduled", "checkedIn", "completed", "cancelled"]);

export const createPatientInput = z.object({
  displayName: z.string().trim().min(2, "Enter a patient name").max(96),
  patientCode: z.string().trim().min(2, "Enter a patient ID").max(32),
  age: z.number().int().min(0).max(130),
  phone: z.string().trim().max(24).optional(),
});

export const updatePatientStatusInput = z.object({
  id: z.number().int().positive(),
  status: patientStatusSchema,
});

export const createAppointmentInput = z.object({
  patientId: z.number().int().positive(),
  department: z.string().trim().min(2, "Select a department").max(72),
  scheduledAt: z.date(),
  note: z.string().trim().max(240).optional(),
});

export const updateAppointmentStatusInput = z.object({
  id: z.number().int().positive(),
  status: appointmentStatusSchema,
});
