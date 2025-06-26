import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import TopBar from "@/components/layout/TopBar";
import MetricsCards from "@/components/dashboard/MetricsCards";
import RecentPatients from "@/components/dashboard/RecentPatients";
import TodaySchedule from "@/components/dashboard/TodaySchedule";
import QuickActions from "@/components/dashboard/QuickActions";
import PatientForm from "@/components/forms/PatientForm";
import AppointmentForm from "@/components/forms/AppointmentForm";
import PaymentForm from "@/components/forms/PaymentForm";
import { DashboardMetrics, AppointmentWithPatient, Patient } from "@/lib/types";

export default function Dashboard() {
  const [patientFormOpen, setPatientFormOpen] = useState(false);
  const [appointmentFormOpen, setAppointmentFormOpen] = useState(false);
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);

  const { data: metrics } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: todayAppointments = [] } = useQuery<AppointmentWithPatient[]>({
    queryKey: ["/api/dashboard/today-appointments"],
  });

  const { data: recentPatients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/dashboard/recent-patients"],
  });

  return (
    <>
      <TopBar 
        title="Dashboard" 
        subtitle="Welcome back! Here's your practice overview." 
      />

      {metrics && <MetricsCards metrics={metrics} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <RecentPatients patients={recentPatients} />
        <TodaySchedule appointments={todayAppointments} />
      </div>

      <QuickActions
        onAddPatient={() => setPatientFormOpen(true)}
        onScheduleAppointment={() => setAppointmentFormOpen(true)}
        onUploadPrescription={() => {
          // TODO: Implement prescription upload
          alert("Prescription upload functionality coming soon!");
        }}
        onRecordPayment={() => setPaymentFormOpen(true)}
      />

      <PatientForm 
        open={patientFormOpen} 
        onOpenChange={setPatientFormOpen} 
      />
      
      <AppointmentForm 
        open={appointmentFormOpen} 
        onOpenChange={setAppointmentFormOpen} 
      />
      
      <PaymentForm 
        open={paymentFormOpen} 
        onOpenChange={setPaymentFormOpen} 
      />
    </>
  );
}
