export interface DashboardMetrics {
  totalPatients: number;
  todayAppointments: number;
  monthlyRevenue: number;
  pendingPayments: number;
}

export interface AppointmentWithPatient {
  id: number;
  appointmentDate: string;
  type: string;
  status: string;
  patient: {
    id: number;
    fullName: string;
    phoneNumber: string;
  };
}

export interface PatientWithStatus extends Patient {
  lastVisitDate?: string;
  treatmentStatus?: string;
}

export * from "@shared/schema";
