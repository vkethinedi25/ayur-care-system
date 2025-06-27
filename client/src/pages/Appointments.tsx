import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import TopBar from "@/components/layout/TopBar";
import AppointmentForm from "@/components/forms/AppointmentForm";
import AppointmentCalendar from "@/components/calendar/AppointmentCalendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarPlus, Clock, CheckCircle, List, Calendar } from "lucide-react";
import { Appointment, Patient, User } from "@/lib/types";

type AppointmentWithDetails = Appointment & {
  patient: Patient;
  doctor: User;
};

export default function Appointments() {
  const [appointmentFormOpen, setAppointmentFormOpen] = useState(false);

  const { data: appointments = [], isLoading } = useQuery<AppointmentWithDetails[]>({
    queryKey: ["/api/appointments"],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "confirmed": return "bg-green-100 text-green-800";
      case "completed": return "bg-gray-100 text-gray-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };
  };

  return (
    <>
      <TopBar 
        title="Appointments" 
        subtitle="Manage patient appointments and schedules"
      />

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-ayur-gray-900">Appointments</h1>
          <Button 
            onClick={() => setAppointmentFormOpen(true)}
            className="bg-ayur-primary text-white hover:bg-ayur-primary-600"
          >
            <CalendarPlus className="w-4 h-4 mr-2" />
            Schedule Appointment
          </Button>
        </div>

        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendar View
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              List View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-6">
            <AppointmentCalendar appointments={appointments} />
          </TabsContent>

          <TabsContent value="list" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-ayur-gray-900">All Appointments</CardTitle>
              </CardHeader>
              <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ayur-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-ayur-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-ayur-gray-700">Patient</th>
                    <th className="text-left py-3 px-4 font-medium text-ayur-gray-700">Date & Time</th>
                    <th className="text-left py-3 px-4 font-medium text-ayur-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-ayur-gray-700">Duration</th>
                    <th className="text-left py-3 px-4 font-medium text-ayur-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-ayur-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-ayur-gray-500">
                        No appointments found. Schedule your first appointment to get started.
                      </td>
                    </tr>
                  ) : (
                    appointments.map((appointment) => {
                      const { date, time } = formatDateTime(appointment.appointmentDate.toString());
                      
                      return (
                        <tr key={appointment.id} className="border-b border-ayur-gray-100 hover:bg-ayur-gray-50">
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={`https://images.unsplash.com/photo-1494790108755?ixlib=rb-4.0.3&w=40&h=40&fit=crop&crop=face`} />
                                <AvatarFallback>{appointment.patient?.fullName?.split(' ').map(n => n[0]).join('') || 'NA'}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-ayur-gray-900">{appointment.patient?.fullName || 'Unknown Patient'}</p>
                                <p className="text-sm text-ayur-gray-500">{appointment.patient?.patientId || 'N/A'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm font-medium text-ayur-gray-900">{date}</p>
                            <p className="text-sm text-ayur-gray-500">{time}</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-ayur-gray-900 capitalize">{appointment.type}</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-ayur-gray-900">{appointment.duration} mins</p>
                          </td>
                          <td className="py-4 px-4">
                            <Badge className={getStatusColor(appointment.status)}>
                              {appointment.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700" title="Mark Complete">
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700" title="Reschedule">
                                <Clock className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AppointmentForm 
        open={appointmentFormOpen} 
        onOpenChange={setAppointmentFormOpen} 
      />
    </>
  );
}
