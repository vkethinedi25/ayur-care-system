import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPatientSchema, insertAppointmentSchema, insertPrescriptionSchema, insertPaymentSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { getSession, requireAuth, requireRole } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Login schema for validation
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  app.use(getSession());

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      // Capture login attempt details
      const ipAddress = req.ip || req.connection.remoteAddress || null;
      const userAgent = req.get('User-Agent') || null;
      const sessionId = req.sessionID || null;
      
      // Basic location info (could be enhanced with IP geolocation service)
      const location = {
        ip: ipAddress,
        timestamp: new Date().toISOString()
      };

      const user = await storage.validateLogin(username, password);
      
      if (!user) {
        // Log failed login attempt if we can identify the user
        const attemptedUser = await storage.getUserByUsername(username);
        if (attemptedUser) {
          await storage.createUserLoginLog({
            userId: attemptedUser.id,
            loginTime: new Date(),
            ipAddress,
            userAgent,
            location,
            sessionId,
            loginStatus: "failed"
          });
        }
        return res.status(401).json({ message: "Invalid username or password" });
      }

      if (!user.isActive) {
        // Log account locked attempt
        await storage.createUserLoginLog({
          userId: user.id,
          loginTime: new Date(),
          ipAddress,
          userAgent,
          location,
          sessionId,
          loginStatus: "locked"
        });
        return res.status(401).json({ message: "Account is deactivated" });
      }

      // Log successful login
      await storage.createUserLoginLog({
        userId: user.id,
        loginTime: new Date(),
        ipAddress,
        userAgent,
        location,
        sessionId,
        loginStatus: "success"
      });
      
      // Set session data
      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.userName = user.fullName;
      
      // Return user data (without password)
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/user", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        console.log('No userId in session for auth check');
        return res.status(401).json({ message: "No user session" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        console.log(`User not found in database: ${userId}`);
        // Clear invalid session
        req.session.destroy((err: any) => {
          if (err) console.error('Session destroy error:', err);
        });
        return res.status(401).json({ message: "User not found" });
      }
      
      // Update session activity
      req.session.touch();
      
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  app.post("/api/auth/register", requireRole(["admin"]), async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // User management routes (admin only)
  app.get("/api/users", requireRole(["admin"]), async (req, res) => {
    try {
      const users = await storage.getUsers();
      const usersWithoutPasswords = users.map(({ password: _, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", requireRole(["admin"]), async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check for doctor name conflicts that could affect patient ID generation
      if (userData.role === 'doctor') {
        const isUnique = await storage.validateDoctorNameUniqueness(userData.fullName);
        if (!isUnique) {
          return res.status(400).json({ 
            message: "Doctor name conflicts with existing doctor. Patient ID generation requires unique name combinations." 
          });
        }
      }
      
      const user = await storage.createUser(userData);
      
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", requireRole(["admin"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updateData = insertUserSchema.partial().parse(req.body);
      
      // Check for doctor name conflicts when updating role to doctor or changing name
      if (updateData.role === 'doctor' || updateData.fullName) {
        const currentUser = await storage.getUser(userId);
        if (!currentUser) {
          return res.status(404).json({ message: "User not found" });
        }
        
        const finalName = updateData.fullName || currentUser.fullName;
        const finalRole = updateData.role || currentUser.role;
        
        if (finalRole === 'doctor') {
          const isUnique = await storage.validateDoctorNameUniqueness(finalName, userId);
          if (!isUnique) {
            return res.status(400).json({ 
              message: "Doctor name conflicts with existing doctor. Patient ID generation requires unique name combinations." 
            });
          }
        }
      }
      
      const user = await storage.updateUser(userId, updateData);
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", requireRole(["admin"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.patch("/api/users/:id/toggle-status", requireRole(["admin"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { isActive } = req.body;
      
      const user = await storage.toggleUserStatus(userId, isActive);
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error toggling user status:", error);
      res.status(500).json({ message: "Failed to toggle user status" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/metrics", requireAuth, async (req, res) => {
    try {
      const doctorId = req.session.userId!;
      const metrics = await storage.getDashboardMetrics(doctorId);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  app.get("/api/dashboard/today-appointments", requireAuth, async (req, res) => {
    try {
      const doctorId = req.session.userId!;
      const appointments = await storage.getTodayAppointments(doctorId);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching today's appointments:", error);
      res.status(500).json({ message: "Failed to fetch today's appointments" });
    }
  });

  app.get("/api/dashboard/recent-patients", requireAuth, async (req, res) => {
    try {
      const doctorId = req.session.userId!;
      const limit = parseInt(req.query.limit as string) || 5;
      const patients = await storage.getRecentPatients(limit, doctorId);
      res.json(patients);
    } catch (error) {
      console.error("Error fetching recent patients:", error);
      res.status(500).json({ message: "Failed to fetch recent patients" });
    }
  });

  // Patient routes
  app.get("/api/patients", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const search = req.query.search as string;
      const doctorId = req.session.userId!;
      
      // Filter patients by the doctor who added them
      const patients = await storage.getPatients(limit, offset, search, doctorId);
      res.json(patients);
    } catch (error) {
      console.error("Error fetching patients:", error);
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  app.get("/api/patients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const patient = await storage.getPatient(id);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      res.json(patient);
    } catch (error) {
      console.error("Error fetching patient:", error);
      res.status(500).json({ message: "Failed to fetch patient" });
    }
  });

  app.post("/api/patients", requireAuth, async (req, res) => {
    try {
      const patientData = insertPatientSchema.parse(req.body);
      const doctorId = req.session.userId!;
      const patient = await storage.createPatient(patientData, doctorId);
      res.status(201).json(patient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid patient data", errors: error.errors });
      }
      console.error("Error creating patient:", error);
      res.status(500).json({ message: "Failed to create patient" });
    }
  });

  app.put("/api/patients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const patientData = insertPatientSchema.partial().parse(req.body);
      const patient = await storage.updatePatient(id, patientData);
      res.json(patient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid patient data", errors: error.errors });
      }
      console.error("Error updating patient:", error);
      res.status(500).json({ message: "Failed to update patient" });
    }
  });

  // Appointment routes
  app.get("/api/appointments", requireAuth, async (req, res) => {
    try {
      const doctorId = req.session.userId!; // Use logged-in doctor's ID
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      
      const appointments = await storage.getAppointments(doctorId, date);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.get("/api/appointments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const appointment = await storage.getAppointment(id);
      
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      res.json(appointment);
    } catch (error) {
      console.error("Error fetching appointment:", error);
      res.status(500).json({ message: "Failed to fetch appointment" });
    }
  });

  app.post("/api/appointments", requireAuth, async (req, res) => {
    try {
      const appointmentData = {
        ...req.body,
        appointmentDate: new Date(req.body.appointmentDate), // Convert string to Date
        doctorId: req.session.userId! // Use logged-in doctor's ID
      };
      
      // Create a custom validation schema that accepts the converted Date object
      const appointmentSchema = insertAppointmentSchema.extend({
        appointmentDate: z.date(),
      });
      
      const validatedData = appointmentSchema.parse(appointmentData);
      const appointment = await storage.createAppointment(validatedData);
      res.status(201).json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid appointment data", errors: error.errors });
      }
      console.error("Error creating appointment:", error);
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  app.put("/api/appointments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const appointmentData = insertAppointmentSchema.partial().parse(req.body);
      const appointment = await storage.updateAppointment(id, appointmentData);
      res.json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid appointment data", errors: error.errors });
      }
      console.error("Error updating appointment:", error);
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  // Prescription routes
  app.get("/api/prescriptions", requireAuth, async (req, res) => {
    try {
      const doctorId = req.session.userId!; // Filter by logged-in doctor
      const patientId = req.query.patientId ? parseInt(req.query.patientId as string) : undefined;
      
      // Only get prescriptions for patients that belong to this doctor
      const prescriptions = await storage.getPrescriptions(patientId, doctorId);
      res.json(prescriptions);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      res.status(500).json({ message: "Failed to fetch prescriptions" });
    }
  });

  app.get("/api/prescriptions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const prescription = await storage.getPrescription(id);
      
      if (!prescription) {
        return res.status(404).json({ message: "Prescription not found" });
      }
      
      res.json(prescription);
    } catch (error) {
      console.error("Error fetching prescription:", error);
      res.status(500).json({ message: "Failed to fetch prescription" });
    }
  });

  app.post("/api/prescriptions", async (req, res) => {
    try {
      const prescriptionData = insertPrescriptionSchema.parse(req.body);
      const prescription = await storage.createPrescription(prescriptionData);
      res.status(201).json(prescription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid prescription data", errors: error.errors });
      }
      console.error("Error creating prescription:", error);
      res.status(500).json({ message: "Failed to create prescription" });
    }
  });

  // File upload for prescriptions
  app.post("/api/prescriptions/upload", upload.single('prescription'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileExtension = path.extname(req.file.originalname);
      const newFileName = `prescription_${Date.now()}${fileExtension}`;
      const newFilePath = path.join(uploadDir, newFileName);
      
      fs.renameSync(req.file.path, newFilePath);
      
      const fileUrl = `/uploads/${newFileName}`;
      res.json({ url: fileUrl, filename: newFileName });
    } catch (error) {
      console.error("Error uploading prescription:", error);
      res.status(500).json({ message: "Failed to upload prescription" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', (req, res, next) => {
    const filePath = path.join(uploadDir, req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: "File not found" });
    }
  });

  // Payment routes
  app.get("/api/payments", requireAuth, async (req, res) => {
    try {
      const doctorId = req.session.userId!; // Filter by logged-in doctor
      const patientId = req.query.patientId ? parseInt(req.query.patientId as string) : undefined;
      
      // Only get payments for patients that belong to this doctor
      const payments = await storage.getPayments(patientId, doctorId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.post("/api/payments", async (req, res) => {
    try {
      const paymentData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(paymentData);
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payment data", errors: error.errors });
      }
      console.error("Error creating payment:", error);
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  app.put("/api/payments/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, transactionId } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const payment = await storage.updatePaymentStatus(id, status, transactionId);
      res.json(payment);
    } catch (error) {
      console.error("Error updating payment status:", error);
      res.status(500).json({ message: "Failed to update payment status" });
    }
  });

  // Admin-only user login logs
  app.get("/api/admin/login-logs", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const loginLogs = await storage.getUserLoginLogs(limit, offset);
      res.json(loginLogs);
    } catch (error) {
      console.error("Error fetching login logs:", error);
      res.status(500).json({ message: "Failed to fetch login logs" });
    }
  });

  app.get("/api/admin/login-logs/:userId", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const limit = parseInt(req.query.limit as string) || 20;
      
      const userLoginLogs = await storage.getLoginLogsByUserId(userId, limit);
      res.json(userLoginLogs);
    } catch (error) {
      console.error("Error fetching user login logs:", error);
      res.status(500).json({ message: "Failed to fetch user login logs" });
    }
  });

  // Admin dashboard routes (admin only)
  app.get("/api/admin/dashboard/metrics", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const metrics = await storage.getAdminDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching admin dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch admin dashboard metrics" });
    }
  });

  app.get("/api/admin/doctor-stats", requireRole(["admin"]), async (req, res) => {
    try {
      const doctorId = parseInt(req.query.doctorId as string);
      if (!doctorId) {
        return res.status(400).json({ message: "Doctor ID is required" });
      }
      const stats = await storage.getDoctorStats(doctorId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching doctor stats:", error);
      res.status(500).json({ message: "Failed to fetch doctor stats" });
    }
  });

  app.get("/api/admin/doctor-patients", requireRole(["admin"]), async (req, res) => {
    try {
      const doctorId = parseInt(req.query.doctorId as string);
      if (!doctorId) {
        return res.status(400).json({ message: "Doctor ID is required" });
      }
      const patients = await storage.getDoctorPatients(doctorId);
      res.json(patients);
    } catch (error) {
      console.error("Error fetching doctor patients:", error);
      res.status(500).json({ message: "Failed to fetch doctor patients" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
