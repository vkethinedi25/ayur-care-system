import { 
  users, patients, appointments, prescriptions, payments, bedManagement, inpatientRecords,
  type User, type InsertUser, type Patient, type InsertPatient, 
  type Appointment, type InsertAppointment, type Prescription, type InsertPrescription,
  type Payment, type InsertPayment, type BedManagement, type InpatientRecord, type InsertInpatientRecord
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, ilike, or, count, sum } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  validateLogin(username: string, password: string): Promise<User | null>;
  
  // Patient methods
  getPatients(limit?: number, offset?: number, search?: string): Promise<Patient[]>;
  getPatient(id: number): Promise<Patient | undefined>;
  getPatientByPatientId(patientId: string): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient>;
  
  // Appointment methods
  getAppointments(doctorId?: number, date?: Date): Promise<(Appointment & { patient: Patient; doctor: User })[]>;
  getAppointment(id: number): Promise<(Appointment & { patient: Patient; doctor: User }) | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment>;
  
  // Prescription methods
  getPrescriptions(patientId?: number): Promise<(Prescription & { patient: Patient; doctor: User })[]>;
  getPrescription(id: number): Promise<(Prescription & { patient: Patient; doctor: User }) | undefined>;
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  
  // Payment methods
  getPayments(patientId?: number): Promise<(Payment & { patient: Patient })[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePaymentStatus(id: number, status: string, transactionId?: string): Promise<Payment>;
  
  // Dashboard methods
  getDashboardMetrics(): Promise<{
    totalPatients: number;
    todayAppointments: number;
    monthlyRevenue: number;
    pendingPayments: number;
  }>;
  
  getTodayAppointments(): Promise<(Appointment & { patient: Patient })[]>;
  getRecentPatients(limit: number): Promise<Patient[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(insertUser.password, 12);
    const userData = {
      ...insertUser,
      password: hashedPassword
    };
    
    const [user] = await db.insert(users).values([userData]).returning();
    return user;
  }

  async validateLogin(username: string, password: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(
      and(
        eq(users.username, username),
        eq(users.isActive, true)
      )
    );
    
    if (!user) {
      return null;
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return null;
    }
    
    return user;
  }

  async getPatients(limit = 50, offset = 0, search?: string): Promise<Patient[]> {
    let query = db.select().from(patients);
    
    if (search) {
      query = query.where(
        or(
          ilike(patients.fullName, `%${search}%`),
          ilike(patients.patientId, `%${search}%`),
          ilike(patients.phoneNumber, `%${search}%`)
        )
      );
    }
    
    return await query
      .orderBy(desc(patients.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getPatient(id: number): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    return patient || undefined;
  }

  async getPatientByPatientId(patientId: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.patientId, patientId));
    return patient || undefined;
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    // Generate patient ID
    const patientCount = await db.select({ count: count() }).from(patients);
    const patientId = `PAT-${new Date().getFullYear()}-${String(patientCount[0].count + 1).padStart(3, '0')}`;
    
    const [patient] = await db
      .insert(patients)
      .values({ ...insertPatient, patientId })
      .returning();
    return patient;
  }

  async updatePatient(id: number, updatePatient: Partial<InsertPatient>): Promise<Patient> {
    const [patient] = await db
      .update(patients)
      .set({ ...updatePatient, updatedAt: new Date() })
      .where(eq(patients.id, id))
      .returning();
    return patient;
  }

  async getAppointments(doctorId?: number, date?: Date): Promise<(Appointment & { patient: Patient; doctor: User })[]> {
    let query = db
      .select({
        id: appointments.id,
        patientId: appointments.patientId,
        doctorId: appointments.doctorId,
        appointmentDate: appointments.appointmentDate,
        duration: appointments.duration,
        type: appointments.type,
        status: appointments.status,
        notes: appointments.notes,
        createdAt: appointments.createdAt,
        patient: patients,
        doctor: users,
      })
      .from(appointments)
      .leftJoin(patients, eq(appointments.patientId, patients.id))
      .leftJoin(users, eq(appointments.doctorId, users.id));

    const conditions = [];
    if (doctorId) conditions.push(eq(appointments.doctorId, doctorId));
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      conditions.push(
        and(
          gte(appointments.appointmentDate, startOfDay),
          lte(appointments.appointmentDate, endOfDay)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(appointments.appointmentDate);
  }

  async getAppointment(id: number): Promise<(Appointment & { patient: Patient; doctor: User }) | undefined> {
    const [appointment] = await db
      .select({
        id: appointments.id,
        patientId: appointments.patientId,
        doctorId: appointments.doctorId,
        appointmentDate: appointments.appointmentDate,
        duration: appointments.duration,
        type: appointments.type,
        status: appointments.status,
        notes: appointments.notes,
        createdAt: appointments.createdAt,
        patient: patients,
        doctor: users,
      })
      .from(appointments)
      .leftJoin(patients, eq(appointments.patientId, patients.id))
      .leftJoin(users, eq(appointments.doctorId, users.id))
      .where(eq(appointments.id, id));
    
    return appointment || undefined;
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const [appointment] = await db
      .insert(appointments)
      .values(insertAppointment)
      .returning();
    return appointment;
  }

  async updateAppointment(id: number, updateAppointment: Partial<InsertAppointment>): Promise<Appointment> {
    const [appointment] = await db
      .update(appointments)
      .set(updateAppointment)
      .where(eq(appointments.id, id))
      .returning();
    return appointment;
  }

  async getPrescriptions(patientId?: number): Promise<(Prescription & { patient: Patient; doctor: User })[]> {
    let query = db
      .select({
        id: prescriptions.id,
        patientId: prescriptions.patientId,
        doctorId: prescriptions.doctorId,
        appointmentId: prescriptions.appointmentId,
        diagnosis: prescriptions.diagnosis,
        treatmentPlan: prescriptions.treatmentPlan,
        medications: prescriptions.medications,
        dietaryRecommendations: prescriptions.dietaryRecommendations,
        lifestyleModifications: prescriptions.lifestyleModifications,
        followUpDate: prescriptions.followUpDate,
        prescriptionUrl: prescriptions.prescriptionUrl,
        createdAt: prescriptions.createdAt,
        patient: patients,
        doctor: users,
      })
      .from(prescriptions)
      .leftJoin(patients, eq(prescriptions.patientId, patients.id))
      .leftJoin(users, eq(prescriptions.doctorId, users.id));

    if (patientId) {
      query = query.where(eq(prescriptions.patientId, patientId));
    }

    return await query.orderBy(desc(prescriptions.createdAt));
  }

  async getPrescription(id: number): Promise<(Prescription & { patient: Patient; doctor: User }) | undefined> {
    const [prescription] = await db
      .select({
        id: prescriptions.id,
        patientId: prescriptions.patientId,
        doctorId: prescriptions.doctorId,
        appointmentId: prescriptions.appointmentId,
        diagnosis: prescriptions.diagnosis,
        treatmentPlan: prescriptions.treatmentPlan,
        medications: prescriptions.medications,
        dietaryRecommendations: prescriptions.dietaryRecommendations,
        lifestyleModifications: prescriptions.lifestyleModifications,
        followUpDate: prescriptions.followUpDate,
        prescriptionUrl: prescriptions.prescriptionUrl,
        createdAt: prescriptions.createdAt,
        patient: patients,
        doctor: users,
      })
      .from(prescriptions)
      .leftJoin(patients, eq(prescriptions.patientId, patients.id))
      .leftJoin(users, eq(prescriptions.doctorId, users.id))
      .where(eq(prescriptions.id, id));
    
    return prescription || undefined;
  }

  async createPrescription(insertPrescription: InsertPrescription): Promise<Prescription> {
    const [prescription] = await db
      .insert(prescriptions)
      .values(insertPrescription)
      .returning();
    return prescription;
  }

  async getPayments(patientId?: number): Promise<(Payment & { patient: Patient })[]> {
    let query = db
      .select({
        id: payments.id,
        patientId: payments.patientId,
        appointmentId: payments.appointmentId,
        amount: payments.amount,
        paymentMethod: payments.paymentMethod,
        paymentStatus: payments.paymentStatus,
        transactionId: payments.transactionId,
        notes: payments.notes,
        paidAt: payments.paidAt,
        createdAt: payments.createdAt,
        patient: patients,
      })
      .from(payments)
      .leftJoin(patients, eq(payments.patientId, patients.id));

    if (patientId) {
      query = query.where(eq(payments.patientId, patientId));
    }

    return await query.orderBy(desc(payments.createdAt));
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db
      .insert(payments)
      .values(insertPayment)
      .returning();
    return payment;
  }

  async updatePaymentStatus(id: number, status: string, transactionId?: string): Promise<Payment> {
    const updateData: any = { paymentStatus: status };
    if (transactionId) updateData.transactionId = transactionId;
    if (status === 'completed') updateData.paidAt = new Date();

    const [payment] = await db
      .update(payments)
      .set(updateData)
      .where(eq(payments.id, id))
      .returning();
    return payment;
  }

  async getDashboardMetrics(): Promise<{
    totalPatients: number;
    todayAppointments: number;
    monthlyRevenue: number;
    pendingPayments: number;
  }> {
    // Total patients
    const [totalPatientsResult] = await db.select({ count: count() }).from(patients);
    
    // Today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const [todayAppointmentsResult] = await db
      .select({ count: count() })
      .from(appointments)
      .where(
        and(
          gte(appointments.appointmentDate, today),
          lte(appointments.appointmentDate, tomorrow)
        )
      );

    // Monthly revenue
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const [monthlyRevenueResult] = await db
      .select({ total: sum(payments.amount) })
      .from(payments)
      .where(
        and(
          eq(payments.paymentStatus, 'completed'),
          gte(payments.paidAt, startOfMonth),
          lte(payments.paidAt, endOfMonth)
        )
      );

    // Pending payments
    const [pendingPaymentsResult] = await db
      .select({ total: sum(payments.amount) })
      .from(payments)
      .where(eq(payments.paymentStatus, 'pending'));

    return {
      totalPatients: totalPatientsResult.count,
      todayAppointments: todayAppointmentsResult.count,
      monthlyRevenue: Number(monthlyRevenueResult.total || 0),
      pendingPayments: Number(pendingPaymentsResult.total || 0),
    };
  }

  async getTodayAppointments(): Promise<(Appointment & { patient: Patient })[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await db
      .select({
        id: appointments.id,
        patientId: appointments.patientId,
        doctorId: appointments.doctorId,
        appointmentDate: appointments.appointmentDate,
        duration: appointments.duration,
        type: appointments.type,
        status: appointments.status,
        notes: appointments.notes,
        createdAt: appointments.createdAt,
        patient: patients,
      })
      .from(appointments)
      .leftJoin(patients, eq(appointments.patientId, patients.id))
      .where(
        and(
          gte(appointments.appointmentDate, today),
          lte(appointments.appointmentDate, tomorrow)
        )
      )
      .orderBy(appointments.appointmentDate);
  }

  async getRecentPatients(limit: number): Promise<Patient[]> {
    return await db
      .select()
      .from(patients)
      .orderBy(desc(patients.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
