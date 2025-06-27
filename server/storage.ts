import { 
  users, patients, appointments, prescriptions, payments, bedManagement, inpatientRecords, patientCounters, userLoginLogs,
  type User, type InsertUser, type Patient, type InsertPatient, 
  type Appointment, type InsertAppointment, type Prescription, type InsertPrescription,
  type Payment, type InsertPayment, type BedManagement, type InpatientRecord, type InsertInpatientRecord,
  type PatientCounter, type UserLoginLog, type InsertUserLoginLog
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, ilike, or, count, sum, sql, countDistinct, ne } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  toggleUserStatus(id: number, isActive: boolean): Promise<User>;
  validateLogin(username: string, password: string): Promise<User | null>;
  validateDoctorNameUniqueness(fullName: string, excludeId?: number): Promise<boolean>;
  
  // Patient methods
  getPatients(limit?: number, offset?: number, search?: string, doctorId?: number): Promise<Patient[]>;
  getPatient(id: number): Promise<Patient | undefined>;
  getPatientByPatientId(patientId: string): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient, doctorId: number): Promise<Patient>;
  updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient>;
  generatePatientId(doctorId: number): Promise<string>;
  
  // Appointment methods
  getAppointments(doctorId?: number, date?: Date): Promise<(Appointment & { patient: Patient; doctor: User })[]>;
  getAppointment(id: number): Promise<(Appointment & { patient: Patient; doctor: User }) | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment>;
  
  // Prescription methods
  getPrescriptions(patientId?: number, doctorId?: number): Promise<(Prescription & { patient: Patient; doctor: User })[]>;
  getPrescription(id: number): Promise<(Prescription & { patient: Patient; doctor: User }) | undefined>;
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  
  // Payment methods
  getPayments(patientId?: number, doctorId?: number): Promise<(Payment & { patient: Patient })[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePaymentStatus(id: number, status: string, transactionId?: string): Promise<Payment>;
  
  // Dashboard methods
  getDashboardMetrics(doctorId?: number): Promise<{
    totalPatients: number;
    todayAppointments: number;
    monthlyRevenue: number;
    pendingPayments: number;
  }>;
  
  getTodayAppointments(doctorId?: number): Promise<(Appointment & { patient: Patient })[]>;
  getRecentPatients(limit: number, doctorId?: number): Promise<Patient[]>;
  
  // User login log methods (admin only)
  createUserLoginLog(loginLog: InsertUserLoginLog): Promise<UserLoginLog>;
  getUserLoginLogs(limit?: number, offset?: number): Promise<(UserLoginLog & { user: User })[]>;
  getLoginLogsByUserId(userId: number, limit?: number): Promise<UserLoginLog[]>;
  
  // Admin dashboard methods
  getDoctorStats(doctorId: number): Promise<{
    totalPatients: number;
    activePatients: number;
    totalAppointments: number;
    monthlyAppointments: number;
    lastActive: string;
  }>;
  getDoctorPatients(doctorId: number): Promise<Patient[]>;
  getAdminDashboardMetrics(): Promise<{
    totalPatients: number;
    totalDoctors: number;
    totalStaff: number;
    monthlyRevenue: number;
    pendingPayments: number;
    scheduledAppointments: number;
    activeUsers: number;
  }>;
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

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: number, updateUser: Partial<InsertUser>): Promise<User> {
    // Hash password if provided
    const userData = updateUser.password 
      ? { ...updateUser, password: await bcrypt.hash(updateUser.password, 12) }
      : updateUser;
    
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async toggleUserStatus(id: number, isActive: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
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

  async validateDoctorNameUniqueness(fullName: string, excludeId?: number): Promise<boolean> {
    // Generate prefix for the given name
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts[nameParts.length - 1] || '';
    
    let newPrefix = firstName.substring(0, 3).toUpperCase();
    if (lastName && lastName !== firstName) {
      newPrefix += lastName.substring(0, 1).toUpperCase();
    }
    
    // Check all existing doctors for prefix conflicts
    const existingDoctors = await db.select().from(users).where(eq(users.role, 'doctor'));
    
    for (const doctor of existingDoctors) {
      if (excludeId && doctor.id === excludeId) continue;
      
      const existingNameParts = doctor.fullName.trim().split(' ');
      const existingFirstName = existingNameParts[0] || '';
      const existingLastName = existingNameParts[existingNameParts.length - 1] || '';
      
      let existingPrefix = existingFirstName.substring(0, 3).toUpperCase();
      if (existingLastName && existingLastName !== existingFirstName) {
        existingPrefix += existingLastName.substring(0, 1).toUpperCase();
      }
      
      if (newPrefix === existingPrefix) {
        return false; // Conflict found
      }
    }
    
    return true; // No conflicts
  }

  async getPatients(limit = 50, offset = 0, search?: string, doctorId?: number): Promise<Patient[]> {
    let query = db.select().from(patients);
    
    // Filter by doctor who added the patient if doctorId is provided
    if (doctorId) {
      query = query.where(eq(patients.doctorId, doctorId));
    }
    
    if (search) {
      const searchConditions = [
        ilike(patients.fullName, `%${search}%`),
        ilike(patients.patientId, `%${search}%`),
        ilike(patients.phoneNumber, `%${search}%`)
      ];

      if (doctorId) {
        // Combine doctor filter with search conditions
        query = query.where(
          and(
            eq(patients.doctorId, doctorId),
            or(...searchConditions)
          )
        );
      } else {
        query = query.where(or(...searchConditions));
      }
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

  async generatePatientId(doctorId: number): Promise<string> {
    // Get doctor's full name to create the prefix
    const doctor = await this.getUser(doctorId);
    if (!doctor) {
      throw new Error("Doctor not found");
    }
    
    // Create a unique prefix using first 3 letters of first name + first letter of last name
    const nameParts = doctor.fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts[nameParts.length - 1] || '';
    
    let prefix = firstName.substring(0, 3).toUpperCase();
    if (lastName && lastName !== firstName) {
      prefix += lastName.substring(0, 1).toUpperCase();
    }
    
    // If prefix is still too short, pad with doctor ID to ensure uniqueness
    if (prefix.length < 3) {
      prefix = prefix.padEnd(3, doctorId.toString());
    }
    
    // Check if this prefix combination already exists for other doctors
    const existingDoctors = await db.select().from(users).where(eq(users.role, 'doctor'));
    const usedPrefixes = new Set<string>();
    
    for (const existingDoc of existingDoctors) {
      if (existingDoc.id !== doctorId) {
        const existingNameParts = existingDoc.fullName.trim().split(' ');
        const existingFirstName = existingNameParts[0] || '';
        const existingLastName = existingNameParts[existingNameParts.length - 1] || '';
        
        let existingPrefix = existingFirstName.substring(0, 3).toUpperCase();
        if (existingLastName && existingLastName !== existingFirstName) {
          existingPrefix += existingLastName.substring(0, 1).toUpperCase();
        }
        if (existingPrefix.length < 3) {
          existingPrefix = existingPrefix.padEnd(3, existingDoc.id.toString());
        }
        
        usedPrefixes.add(existingPrefix);
      }
    }
    
    // If prefix conflicts, append doctor ID to make it unique
    if (usedPrefixes.has(prefix)) {
      prefix = prefix.substring(0, 2) + doctorId.toString().padStart(2, '0');
    }
    
    // Get or create counter for this doctor
    let counter = await db.select().from(patientCounters).where(eq(patientCounters.doctorId, doctorId));
    
    if (counter.length === 0) {
      // Create new counter for this doctor
      await db.insert(patientCounters).values({
        doctorId,
        lastCount: 1,
      });
      return `${prefix}1`;
    } else {
      // Increment existing counter
      const newCount = counter[0].lastCount + 1;
      await db.update(patientCounters)
        .set({ 
          lastCount: newCount,
          updatedAt: new Date()
        })
        .where(eq(patientCounters.doctorId, doctorId));
      return `${prefix}${newCount}`;
    }
  }

  async createPatient(insertPatient: InsertPatient, doctorId: number): Promise<Patient> {
    // Generate patient ID based on doctor
    const generatedPatientId = await this.generatePatientId(doctorId);
    
    const [patient] = await db
      .insert(patients)
      .values({
        ...insertPatient,
        patientId: generatedPatientId,
      })
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

  async getPrescriptions(patientId?: number, doctorId?: number): Promise<(Prescription & { patient: Patient; doctor: User })[]> {
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

    let whereConditions = [];
    
    if (patientId) {
      whereConditions.push(eq(prescriptions.patientId, patientId));
    }
    
    if (doctorId) {
      whereConditions.push(eq(prescriptions.doctorId, doctorId));
    }
    
    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
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

  async getPayments(patientId?: number, doctorId?: number): Promise<(Payment & { patient: Patient })[]> {
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

    let whereConditions = [];
    
    if (patientId) {
      whereConditions.push(eq(payments.patientId, patientId));
    }
    
    if (doctorId) {
      whereConditions.push(eq(patients.doctorId, doctorId));
    }
    
    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
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

  async getDashboardMetrics(doctorId?: number): Promise<{
    totalPatients: number;
    todayAppointments: number;
    monthlyRevenue: number;
    pendingPayments: number;
  }> {
    // Total patients - filter by doctor if provided
    let totalPatientsQuery = db.select({ count: count() }).from(patients);
    if (doctorId) {
      totalPatientsQuery = totalPatientsQuery.where(eq(patients.doctorId, doctorId));
    }
    const [totalPatientsResult] = await totalPatientsQuery;
    
    // Today's appointments - filter by doctor if provided
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let todayAppointmentsQuery = db
      .select({ count: count() })
      .from(appointments)
      .where(
        and(
          gte(appointments.appointmentDate, today),
          lte(appointments.appointmentDate, tomorrow)
        )
      );
    
    if (doctorId) {
      todayAppointmentsQuery = todayAppointmentsQuery.where(
        and(
          eq(appointments.doctorId, doctorId),
          gte(appointments.appointmentDate, today),
          lte(appointments.appointmentDate, tomorrow)
        )
      );
    }
    
    const [todayAppointmentsResult] = await todayAppointmentsQuery;

    // Monthly revenue - filter by doctor's patients if provided
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    let monthlyRevenueQuery = db
      .select({ total: sum(payments.amount) })
      .from(payments)
      .where(
        and(
          eq(payments.paymentStatus, 'completed'),
          gte(payments.paidAt, startOfMonth),
          lte(payments.paidAt, endOfMonth)
        )
      );
    
    if (doctorId) {
      monthlyRevenueQuery = monthlyRevenueQuery
        .innerJoin(patients, eq(payments.patientId, patients.id))
        .where(
          and(
            eq(patients.doctorId, doctorId),
            eq(payments.paymentStatus, 'completed'),
            gte(payments.paidAt, startOfMonth),
            lte(payments.paidAt, endOfMonth)
          )
        );
    }
    
    const [monthlyRevenueResult] = await monthlyRevenueQuery;

    // Pending payments - filter by doctor's patients if provided
    let pendingPaymentsQuery = db
      .select({ total: sum(payments.amount) })
      .from(payments)
      .where(eq(payments.paymentStatus, 'pending'));
    
    if (doctorId) {
      pendingPaymentsQuery = pendingPaymentsQuery
        .innerJoin(patients, eq(payments.patientId, patients.id))
        .where(
          and(
            eq(patients.doctorId, doctorId),
            eq(payments.paymentStatus, 'pending')
          )
        );
    }
    
    const [pendingPaymentsResult] = await pendingPaymentsQuery;

    return {
      totalPatients: totalPatientsResult.count,
      todayAppointments: todayAppointmentsResult.count,
      monthlyRevenue: Number(monthlyRevenueResult.total || 0),
      pendingPayments: Number(pendingPaymentsResult.total || 0),
    };
  }

  async getTodayAppointments(doctorId?: number): Promise<(Appointment & { patient: Patient })[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let whereConditions = and(
      gte(appointments.appointmentDate, today),
      lte(appointments.appointmentDate, tomorrow)
    );

    if (doctorId) {
      whereConditions = and(
        eq(appointments.doctorId, doctorId),
        gte(appointments.appointmentDate, today),
        lte(appointments.appointmentDate, tomorrow)
      );
    }

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
      .where(whereConditions)
      .orderBy(appointments.appointmentDate);
  }

  async getRecentPatients(limit: number, doctorId?: number): Promise<Patient[]> {
    let query = db
      .select()
      .from(patients)
      .orderBy(desc(patients.createdAt))
      .limit(limit);
    
    if (doctorId) {
      query = query.where(eq(patients.doctorId, doctorId));
    }
    
    return await query;
  }

  // User login log methods (admin only)
  async createUserLoginLog(loginLogData: InsertUserLoginLog): Promise<UserLoginLog> {
    const [loginLog] = await db
      .insert(userLoginLogs)
      .values(loginLogData)
      .returning();
    return loginLog;
  }

  async getUserLoginLogs(limit = 50, offset = 0): Promise<(UserLoginLog & { user: User })[]> {
    const loginLogs = await db
      .select({
        id: userLoginLogs.id,
        userId: userLoginLogs.userId,
        loginTime: userLoginLogs.loginTime,
        ipAddress: userLoginLogs.ipAddress,
        userAgent: userLoginLogs.userAgent,
        location: userLoginLogs.location,
        sessionId: userLoginLogs.sessionId,
        loginStatus: userLoginLogs.loginStatus,
        user: {
          id: users.id,
          username: users.username,
          email: users.email,
          fullName: users.fullName,
          role: users.role,
        }
      })
      .from(userLoginLogs)
      .leftJoin(users, eq(userLoginLogs.userId, users.id))
      .orderBy(desc(userLoginLogs.loginTime))
      .limit(limit)
      .offset(offset);

    return loginLogs.map(log => ({
      id: log.id,
      userId: log.userId,
      loginTime: log.loginTime,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      location: log.location,
      sessionId: log.sessionId,
      loginStatus: log.loginStatus,
      user: log.user!
    }));
  }

  async getLoginLogsByUserId(userId: number, limit = 20): Promise<UserLoginLog[]> {
    const loginLogs = await db
      .select()
      .from(userLoginLogs)
      .where(eq(userLoginLogs.userId, userId))
      .orderBy(desc(userLoginLogs.loginTime))
      .limit(limit);
    
    return loginLogs;
  }

  async getDoctorStats(doctorId: number): Promise<{
    totalPatients: number;
    activePatients: number;
    totalAppointments: number;
    monthlyAppointments: number;
    monthlyRevenue: number;
    lastActive: string;
  }> {
    // Get total patients count
    const totalPatientsResult = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(patients)
      .where(eq(patients.doctorId, doctorId));
    
    const totalPatients = totalPatientsResult[0]?.count || 0;

    // Get active patients (patients with appointments in last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const activePatientsResult = await db
      .selectDistinct({ patientId: appointments.patientId })
      .from(appointments)
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .where(
        and(
          eq(patients.doctorId, doctorId),
          gte(appointments.appointmentDate, sixMonthsAgo)
        )
      );
    
    const activePatients = activePatientsResult.length;

    // Get total appointments count
    const totalAppointmentsResult = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(appointments)
      .where(eq(appointments.doctorId, doctorId));
    
    const totalAppointments = totalAppointmentsResult[0]?.count || 0;

    // Get this month's appointments count
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const monthlyAppointmentsResult = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctorId),
          gte(appointments.appointmentDate, startOfMonth)
        )
      );
    
    const monthlyAppointments = monthlyAppointmentsResult[0]?.count || 0;

    // Get monthly revenue from payments
    const monthlyRevenueResult = await db
      .select({ total: sql<number>`cast(sum(${payments.amount}) as decimal)` })
      .from(payments)
      .leftJoin(appointments, eq(payments.appointmentId, appointments.id))
      .where(
        and(
          eq(appointments.doctorId, doctorId),
          gte(payments.createdAt, startOfMonth)
        )
      );
    
    const monthlyRevenue = Number(monthlyRevenueResult[0]?.total || 0);

    // Get last active date (most recent appointment)
    const lastAppointmentResult = await db
      .select({ appointmentDate: appointments.appointmentDate })
      .from(appointments)
      .where(eq(appointments.doctorId, doctorId))
      .orderBy(desc(appointments.appointmentDate))
      .limit(1);

    const lastActive = lastAppointmentResult[0]?.appointmentDate 
      ? new Date(lastAppointmentResult[0].appointmentDate).toISOString()
      : new Date().toISOString();

    return {
      totalPatients,
      activePatients,
      totalAppointments,
      monthlyAppointments,
      monthlyRevenue,
      lastActive
    };
  }

  async getDoctorPatients(doctorId: number): Promise<Patient[]> {
    const doctorPatients = await db
      .select({
        id: patients.id,
        patientId: patients.patientId,
        doctorId: patients.doctorId,
        fullName: patients.fullName,
        age: patients.age,
        gender: patients.gender,
        phoneNumber: patients.phoneNumber,
        email: patients.email,
        address: patients.address,
        prakriti: patients.prakriti,
        vikriti: patients.vikriti,
        medicalHistory: patients.medicalHistory,
        allergies: patients.allergies,
        currentMedications: patients.currentMedications,
        createdAt: patients.createdAt,
        updatedAt: patients.updatedAt,
        totalAppointments: sql<number>`cast(count(${appointments.id}) as int)`,
        lastVisitDate: sql<Date | null>`max(${appointments.appointmentDate})`
      })
      .from(patients)
      .leftJoin(appointments, eq(patients.id, appointments.patientId))
      .where(eq(patients.doctorId, doctorId))
      .groupBy(patients.id)
      .orderBy(desc(patients.createdAt));

    return doctorPatients;
  }

  async getAdminDashboardMetrics(): Promise<{
    totalPatients: number;
    totalDoctors: number;
    totalStaff: number;
    monthlyRevenue: number;
    pendingPayments: number;
    scheduledAppointments: number;
    activeUsers: number;
  }> {
    try {
      // Get total patients count
      const allPatients = await db.select().from(patients);
      const totalPatients = allPatients.length;

      // Get total doctors count
      const allDoctors = await db.select().from(users).where(eq(users.role, 'doctor'));
      const totalDoctors = allDoctors.length;

      // Get total staff count (non-admin, non-doctor users)
      const allStaff = await db.select().from(users).where(eq(users.role, 'staff'));
      const totalStaff = allStaff.length;

      // Get monthly revenue (current month)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      const allPayments = await db.select().from(payments);
      const monthlyPayments = allPayments.filter(payment => 
        payment.status === 'paid' && 
        payment.createdAt >= startOfMonth && 
        payment.createdAt <= endOfMonth
      );
      const monthlyRevenue = monthlyPayments.reduce((sum, payment) => sum + payment.amount, 0);

      // Get pending payments count
      const pendingPayments = allPayments.filter(payment => payment.status === 'pending').length;

      // Get scheduled appointments count (future appointments)
      const now = new Date();
      const allAppointments = await db.select().from(appointments);
      const scheduledAppointments = allAppointments.filter(appointment => 
        appointment.appointmentDate >= now && appointment.status !== 'cancelled'
      ).length;

      // Get active users count (users who logged in within last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const allLoginLogs = await db.select().from(userLoginLogs);
      const recentLogins = allLoginLogs.filter(log => 
        log.loginTime >= thirtyDaysAgo && log.loginStatus === 'success'
      );
      const uniqueUserIds = new Set(recentLogins.map(log => log.userId));
      const activeUsers = uniqueUserIds.size;

      return {
        totalPatients,
        totalDoctors,
        totalStaff,
        monthlyRevenue,
        pendingPayments,
        scheduledAppointments,
        activeUsers
      };
    } catch (error) {
      console.error("Error fetching admin dashboard metrics:", error);
      return {
        totalPatients: 0,
        totalDoctors: 0,
        totalStaff: 0,
        monthlyRevenue: 0,
        pendingPayments: 0,
        scheduledAppointments: 0,
        activeUsers: 0
      };
    }
  }
}

export const storage = new DatabaseStorage();
