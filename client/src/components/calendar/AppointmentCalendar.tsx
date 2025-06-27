import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock, User, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Appointment {
  id: number;
  appointmentDate: string;
  type: string;
  status: string;
  duration: number;
  patient: {
    fullName: string;
    phoneNumber: string;
  };
}

interface AppointmentCalendarProps {
  appointments: Appointment[];
}

export default function AppointmentCalendar({ appointments }: AppointmentCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(apt => 
      isSameDay(parseISO(apt.appointmentDate), date)
    );
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const selectedDateAppointments = getAppointmentsForDate(selectedDate);
  const daysInMonth = getDaysInMonth();

  // Get weekday names
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar Grid */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Appointment Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium min-w-[140px] text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: daysInMonth[0].getDay() }).map((_, index) => (
              <div key={index} className="p-2 h-24" />
            ))}
            
            {/* Calendar days */}
            {daysInMonth.map(date => {
              const dayAppointments = getAppointmentsForDate(date);
              const isSelected = isSameDay(date, selectedDate);
              const isToday = isSameDay(date, new Date());
              
              return (
                <div
                  key={date.toISOString()}
                  className={cn(
                    "p-1 h-24 border border-border rounded-md cursor-pointer transition-colors hover:bg-muted/50",
                    isSelected && "bg-primary/10 border-primary",
                    isToday && "bg-blue-50 border-blue-200"
                  )}
                  onClick={() => setSelectedDate(date)}
                >
                  <div className={cn(
                    "text-sm font-medium mb-1",
                    isToday && "text-blue-600",
                    isSelected && "text-primary"
                  )}>
                    {format(date, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 2).map(apt => (
                      <div
                        key={apt.id}
                        className={cn(
                          "text-xs p-1 rounded border",
                          getStatusColor(apt.status)
                        )}
                      >
                        <div className="truncate">
                          {format(parseISO(apt.appointmentDate), 'HH:mm')}
                        </div>
                        <div className="truncate font-medium">
                          {apt.patient.fullName}
                        </div>
                      </div>
                    ))}
                    {dayAppointments.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayAppointments.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDateAppointments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No appointments scheduled for this date
            </p>
          ) : (
            <div className="space-y-3">
              {selectedDateAppointments.map(apt => (
                <div key={apt.id} className="border border-border rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {format(parseISO(apt.appointmentDate), 'HH:mm')}
                      </span>
                    </div>
                    <Badge variant="outline" className={getStatusColor(apt.status)}>
                      {apt.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{apt.patient.fullName}</span>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      Type: {apt.type}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      Duration: {apt.duration} minutes
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      Phone: {apt.patient.phoneNumber}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}