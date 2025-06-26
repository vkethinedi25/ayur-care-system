import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Calendar } from "lucide-react";
import { AppointmentWithPatient } from "@/lib/types";

interface TodayScheduleProps {
  appointments: AppointmentWithPatient[];
}

export default function TodaySchedule({ appointments }: TodayScheduleProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTimeComponents = (dateString: string) => {
    const date = new Date(dateString);
    const time = date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const period = date.toLocaleTimeString('en-IN', {
      hour12: true
    }).slice(-2);
    
    return { time, period };
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <CardTitle className="text-xl font-semibold text-ayur-gray-900">Today's Schedule</CardTitle>
        <Button variant="ghost" size="sm" className="text-ayur-primary-600 hover:text-ayur-primary-700">
          <Calendar className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {appointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-ayur-gray-300 mx-auto mb-4" />
              <p className="text-ayur-gray-500">No appointments scheduled for today</p>
            </div>
          ) : (
            appointments.map((appointment) => {
              const { time, period } = getTimeComponents(appointment.appointmentDate);
              
              return (
                <div key={appointment.id} className="flex items-center space-x-4 p-3 border border-ayur-gray-200 rounded-lg hover:bg-ayur-gray-50">
                  <div className="text-center">
                    <p className="text-sm font-medium text-ayur-gray-900">{time}</p>
                    <p className="text-xs text-ayur-gray-500">{period}</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-ayur-gray-900">{appointment.patient.fullName}</p>
                    <p className="text-sm text-ayur-gray-500">{appointment.type}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700" title="Mark Complete">
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700" title="Reschedule">
                      <Clock className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <Button className="w-full mt-4 bg-ayur-primary text-white hover:bg-ayur-primary-600">
          View Full Schedule
        </Button>
      </CardContent>
    </Card>
  );
}
