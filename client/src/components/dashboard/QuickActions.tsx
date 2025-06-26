import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, CalendarPlus, Upload, IndianRupee } from "lucide-react";

interface QuickActionsProps {
  onAddPatient: () => void;
  onScheduleAppointment: () => void;
  onUploadPrescription: () => void;
  onRecordPayment: () => void;
}

export default function QuickActions({
  onAddPatient,
  onScheduleAppointment,
  onUploadPrescription,
  onRecordPayment,
}: QuickActionsProps) {
  const actions = [
    {
      title: "Add New Patient",
      subtitle: "Register new patient",
      icon: UserPlus,
      onClick: onAddPatient,
      colors: "border-ayur-primary-500 hover:border-ayur-primary-500 hover:bg-ayur-primary-50 group-hover:bg-ayur-primary-200",
      iconColors: "bg-ayur-primary-100 text-ayur-primary-600 group-hover:text-ayur-primary-700",
    },
    {
      title: "Schedule Appointment",
      subtitle: "Book new appointment",
      icon: CalendarPlus,
      onClick: onScheduleAppointment,
      colors: "border-blue-500 hover:border-blue-500 hover:bg-blue-50",
      iconColors: "bg-blue-100 text-blue-600 group-hover:bg-blue-200 group-hover:text-blue-700",
    },
    {
      title: "Upload Prescription",
      subtitle: "Add prescription document",
      icon: Upload,
      onClick: onUploadPrescription,
      colors: "border-green-500 hover:border-green-500 hover:bg-green-50",
      iconColors: "bg-green-100 text-green-600 group-hover:bg-green-200 group-hover:text-green-700",
    },
    {
      title: "Record Payment",
      subtitle: "Process payment",
      icon: IndianRupee,
      onClick: onRecordPayment,
      colors: "border-orange-500 hover:border-orange-500 hover:bg-orange-50",
      iconColors: "bg-orange-100 text-orange-600 group-hover:bg-orange-200 group-hover:text-orange-700",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-ayur-gray-900">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action) => {
            const Icon = action.icon;
            
            return (
              <Button
                key={action.title}
                variant="outline"
                className={`flex flex-col items-center p-6 h-auto border-2 border-dashed border-gray-300 transition-colors duration-200 group ${action.colors}`}
                onClick={action.onClick}
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 transition-colors duration-200 ${action.iconColors}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="font-medium text-ayur-gray-700 group-hover:text-current">{action.title}</span>
                <span className="text-sm text-ayur-gray-500 mt-1">{action.subtitle}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
