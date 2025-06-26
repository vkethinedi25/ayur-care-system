import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import TopBar from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, BarChart3, Users, IndianRupee, FileText } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function Reports() {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [reportType, setReportType] = useState("overview");

  const { data: patients = [] } = useQuery({
    queryKey: ["/api/patients"],
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["/api/appointments"],
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["/api/payments"],
  });

  // Calculate basic statistics
  const stats = {
    totalPatients: patients.length,
    newPatients: patients.filter((p: any) => {
      const createdDate = new Date(p.createdAt);
      return dateRange.from && dateRange.to && 
        createdDate >= dateRange.from && createdDate <= dateRange.to;
    }).length,
    totalAppointments: appointments.length,
    completedAppointments: appointments.filter((a: any) => a.status === "completed").length,
    totalRevenue: payments
      .filter((p: any) => p.paymentStatus === "completed")
      .reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0),
    pendingPayments: payments
      .filter((p: any) => p.paymentStatus === "pending")
      .reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0),
  };

  // Prakriti distribution
  const prakritiDistribution = patients.reduce((acc: any, patient: any) => {
    acc[patient.prakriti] = (acc[patient.prakriti] || 0) + 1;
    return acc;
  }, {});

  // Gender distribution
  const genderDistribution = patients.reduce((acc: any, patient: any) => {
    acc[patient.gender] = (acc[patient.gender] || 0) + 1;
    return acc;
  }, {});

  const reportTypes = [
    { value: "overview", label: "Practice Overview" },
    { value: "patients", label: "Patient Demographics" },
    { value: "appointments", label: "Appointment Analytics" },
    { value: "revenue", label: "Revenue Report" },
    { value: "treatments", label: "Treatment Outcomes" },
  ];

  const generateReport = () => {
    // In a real application, this would generate and download a PDF/Excel report
    alert("Report generation functionality would be implemented here");
  };

  return (
    <>
      <TopBar 
        title="Reports" 
        subtitle="Generate insights and analytics for your practice"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ayur-gray-600">Total Patients</p>
                <p className="text-2xl font-bold text-ayur-gray-900">{stats.totalPatients}</p>
                <p className="text-sm text-green-600">+{stats.newPatients} this period</p>
              </div>
              <div className="w-12 h-12 bg-ayur-primary-100 rounded-lg flex items-center justify-center">
                <Users className="text-ayur-primary-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ayur-gray-600">Appointments</p>
                <p className="text-2xl font-bold text-ayur-gray-900">{stats.totalAppointments}</p>
                <p className="text-sm text-blue-600">{stats.completedAppointments} completed</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="text-blue-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ayur-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-ayur-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-green-600">Collected</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <IndianRupee className="text-green-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ayur-gray-600">Pending</p>
                <p className="text-2xl font-bold text-ayur-gray-900">₹{stats.pendingPayments.toLocaleString()}</p>
                <p className="text-sm text-orange-600">Outstanding</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <IndianRupee className="text-orange-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-ayur-gray-900">Report Generation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ayur-gray-700 mb-2">Report Type</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-ayur-gray-700 mb-2">Date Range</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={{
                        from: dateRange.from,
                        to: dateRange.to,
                      }}
                      onSelect={(range) => {
                        setDateRange({
                          from: range?.from,
                          to: range?.to,
                        });
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Button 
              onClick={generateReport}
              className="w-full bg-ayur-primary text-white hover:bg-ayur-primary-600"
            >
              <Download className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-ayur-gray-900">Quick Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium text-ayur-gray-900 mb-3">Prakriti Distribution</h4>
              <div className="space-y-2">
                {Object.entries(prakritiDistribution).map(([prakriti, count]) => (
                  <div key={prakriti} className="flex justify-between items-center">
                    <span className="text-sm text-ayur-gray-600">{prakriti}</span>
                    <span className="text-sm font-medium text-ayur-gray-900">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-ayur-gray-900 mb-3">Gender Distribution</h4>
              <div className="space-y-2">
                {Object.entries(genderDistribution).map(([gender, count]) => (
                  <div key={gender} className="flex justify-between items-center">
                    <span className="text-sm text-ayur-gray-600 capitalize">{gender}</span>
                    <span className="text-sm font-medium text-ayur-gray-900">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-ayur-gray-200">
              <p className="text-xs text-ayur-gray-500">
                Data reflects current database records. For detailed analytics, generate a comprehensive report.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-ayur-gray-900">Available Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTypes.map((type) => (
              <div key={type.value} className="p-4 border border-ayur-gray-200 rounded-lg hover:bg-ayur-gray-50 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <FileText className="w-8 h-8 text-ayur-primary-600" />
                  <div>
                    <h5 className="font-medium text-ayur-gray-900">{type.label}</h5>
                    <p className="text-sm text-ayur-gray-500">
                      {type.value === "overview" && "Complete practice summary with key metrics"}
                      {type.value === "patients" && "Patient demographics and Ayurvedic assessments"}
                      {type.value === "appointments" && "Appointment trends and scheduling analytics"}
                      {type.value === "revenue" && "Financial performance and payment analysis"}
                      {type.value === "treatments" && "Treatment effectiveness and outcomes"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
