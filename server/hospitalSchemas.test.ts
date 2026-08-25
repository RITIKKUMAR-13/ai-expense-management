import { describe, expect, it } from "vitest";
import { createAppointmentInput, createPatientInput, patientStatusSchema } from "./hospitalSchemas";

describe("hospital input contracts", () => {
  it("accepts the minimum administrative patient record", () => {
    expect(createPatientInput.parse({ displayName: "Patient Example", patientCode: "P-014", age: 34 })).toMatchObject({
      displayName: "Patient Example",
      patientCode: "P-014",
      age: 34,
    });
  });

  it("rejects clinically unsafe or malformed administrative inputs", () => {
    expect(() => createPatientInput.parse({ displayName: "A", patientCode: "", age: 180 })).toThrow();
    expect(() => patientStatusSchema.parse("unknown")).toThrow();
  });

  it("requires a real date for appointment creation", () => {
    expect(() => createAppointmentInput.parse({ patientId: 1, department: "Outpatient", scheduledAt: "tomorrow" })).toThrow();
  });
});
