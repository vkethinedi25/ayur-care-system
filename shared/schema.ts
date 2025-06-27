import { pgTable, text, serial, integer, boolean, timestamp, decimal, json, varchar, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // This will store hashed passwords
  email: text("email").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("staff"), // admin, doctor, staff
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  patientId: text("patient_id").notNull().unique(),
  fullName: text("full_name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  phoneNumber: text("phone_number").notNull(),
  email: text("email"),
  address: text("address"),
  prakriti: text("prakriti").notNull(), // Ayurvedic constitution
  vikriti: text("vikriti"), // Current imbalance
  chiefComplaints: text("chief_complaints").notNull(),
  medicalHistory: text("medical_history"),
  allergies: text("allergies"),
  emergencyContact: text("emergency_contact"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  doctorId: integer("doctor_id").notNull(),
  appointmentDate: timestamp("appointment_date").notNull(),
  duration: integer("duration").notNull().default(30), // in minutes
  type: text("type").notNull(), // consultation, follow-up, panchakarma
  status: text("status").notNull().default("scheduled"), // scheduled, confirmed, completed, cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const prescriptions = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  doctorId: integer("doctor_id").notNull(),
  appointmentId: integer("appointment_id"),
  diagnosis: text("diagnosis").notNull(),
  treatmentPlan: text("treatment_plan").notNull(),
  medications: json("medications").$type<Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>>(),
  dietaryRecommendations: text("dietary_recommendations"),
  lifestyleModifications: text("lifestyle_modifications"),
  followUpDate: timestamp("follow_up_date"),
  prescriptionUrl: text("prescription_url"), // for uploaded prescription files
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  appointmentId: integer("appointment_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(), // cash, card, online, upi
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, completed, failed, refunded
  transactionId: text("transaction_id"),
  notes: text("notes"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bedManagement = pgTable("bed_management", {
  id: serial("id").primaryKey(),
  bedNumber: text("bed_number").notNull().unique(),
  wardType: text("ward_type").notNull(), // general, private, icu
  isOccupied: boolean("is_occupied").notNull().default(false),
  patientId: integer("patient_id"),
  admissionDate: timestamp("admission_date"),
  expectedDischarge: timestamp("expected_discharge"),
});

export const inpatientRecords = pgTable("inpatient_records", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  bedId: integer("bed_id").notNull(),
  admissionDate: timestamp("admission_date").notNull(),
  dischargeDate: timestamp("discharge_date"),
  admissionReason: text("admission_reason").notNull(),
  dischargeSummary: text("discharge_summary"),
  dailyNotes: json("daily_notes").$type<Array<{
    date: string;
    notes: string;
    vitals: any;
    medications: any;
  }>>(),
  treatmentHistory: json("treatment_history").$type<Array<{
    date: string;
    treatment: string;
    response: string;
  }>>(),
});

export const patientCounters = pgTable("patient_counters", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").notNull().unique(),
  lastCount: integer("last_count").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  appointments: many(appointments),
  prescriptions: many(prescriptions),
}));

export const patientsRelations = relations(patients, ({ many, one }) => ({
  appointments: many(appointments),
  prescriptions: many(prescriptions),
  payments: many(payments),
  inpatientRecord: one(inpatientRecords),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
  doctor: one(users, {
    fields: [appointments.doctorId],
    references: [users.id],
  }),
  prescription: one(prescriptions),
  payment: one(payments),
}));

export const prescriptionsRelations = relations(prescriptions, ({ one }) => ({
  patient: one(patients, {
    fields: [prescriptions.patientId],
    references: [patients.id],
  }),
  doctor: one(users, {
    fields: [prescriptions.doctorId],
    references: [users.id],
  }),
  appointment: one(appointments, {
    fields: [prescriptions.appointmentId],
    references: [appointments.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  patient: one(patients, {
    fields: [payments.patientId],
    references: [patients.id],
  }),
  appointment: one(appointments, {
    fields: [payments.appointmentId],
    references: [appointments.id],
  }),
}));

export const bedManagementRelations = relations(bedManagement, ({ one }) => ({
  patient: one(patients, {
    fields: [bedManagement.patientId],
    references: [patients.id],
  }),
  inpatientRecord: one(inpatientRecords),
}));

export const inpatientRecordsRelations = relations(inpatientRecords, ({ one }) => ({
  patient: one(patients, {
    fields: [inpatientRecords.patientId],
    references: [patients.id],
  }),
  bed: one(bedManagement, {
    fields: [inpatientRecords.bedId],
    references: [bedManagement.id],
  }),
}));

export const patientCountersRelations = relations(patientCounters, ({ one }) => ({
  doctor: one(users, {
    fields: [patientCounters.doctorId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  patientId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
});

export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertInpatientRecordSchema = createInsertSchema(inpatientRecords).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;
export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type BedManagement = typeof bedManagement.$inferSelect;
export type InpatientRecord = typeof inpatientRecords.$inferSelect;
export type InsertInpatientRecord = z.infer<typeof insertInpatientRecordSchema>;
export type PatientCounter = typeof patientCounters.$inferSelect;
