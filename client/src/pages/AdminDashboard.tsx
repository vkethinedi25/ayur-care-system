import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, UserCheck, Calendar, Stethoscope, Activity } from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import { useAuth } from "@/hooks/useAuth";

interface DoctorStats {
  totalPatients: number;
  activePatients: number;
  totalAppointments: number;
  monthlyAppointments: number;
  lastActive: string;
}

interface Doctor {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  specialization?: string;
  licenseNumber?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
}

interface Patient {
  id: number;
  patientId: string;
  fullName: string;
  age: number;
  gender: string;
  phoneNumber: string;
  email?: string;
  lastVisitDate?: string;
  totalAppointments: number;
  createdAt: Date;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");

  // Fetch all doctors and staff
  const { data: doctors = [], isLoading: doctorsLoading } = useQuery({
    queryKey: ["/api/admin/doctors"],
    enabled: user?.role === 'admin',
  });

  // Fetch doctor statistics
  const { data: doctorStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/doctor-stats", selectedDoctorId],
    enabled: user?.role === 'admin' && !!selectedDoctorId,
  });

  // Fetch patients for selected doctor
  const { data: doctorPatients = [], isLoading: patientsLoading } = useQuery({
    queryKey: ["/api/admin/doctor-patients", selectedDoctorId],
    enabled: user?.role === 'admin' && !!selectedDoctorId,
  });

  const selectedDoctor = doctors.find((doc: Doctor) => doc.id.toString() === selectedDoctorId);

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to view this page. Admin access required.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <>
      <TopBar 
        title="Admin Dashboard" 
        subtitle="Manage doctors, staff, and monitor practice statistics"
      />
      
      <div className="flex-1 space-y-6 p-8 pt-6">
        {/* All Doctors/Staff Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Doctors & Staff
            </CardTitle>
            <CardDescription>
              Complete list of healthcare professionals in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {doctorsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">Loading doctors...</div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {doctors.map((doctor: Doctor) => (
                    <Card key={doctor.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{doctor.fullName}</h4>
                            <Badge variant={doctor.isActive ? 'default' : 'secondary'}>
                              {doctor.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex justify-between">
                              <span>Role:</span>
                              <Badge variant="outline">{doctor.role}</Badge>
                            </div>
                            {doctor.specialization && (
                              <div className="flex justify-between">
                                <span>Specialization:</span>
                                <span>{doctor.specialization}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span>Email:</span>
                              <span className="truncate">{doctor.email}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Username:</span>
                              <span>{doctor.username}</span>
                            </div>
                            {doctor.lastLogin && (
                              <div className="flex justify-between">
                                <span>Last Login:</span>
                                <span>{new Date(doctor.lastLogin).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {doctors.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No doctors or staff found in the system.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Doctor Selection and Patient Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Doctor Patient Management
            </CardTitle>
            <CardDescription>
              Select a doctor to view their patients and practice statistics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Doctor</label>
              <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a doctor to view their patients" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.filter((doc: Doctor) => doc.role === 'doctor').map((doctor: Doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span>{doctor.fullName}</span>
                        {doctor.specialization && (
                          <Badge variant="outline" className="text-xs">
                            {doctor.specialization}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedDoctorId && selectedDoctor && (
              <div className="space-y-6">
                {/* Doctor Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">Total Patients</p>
                          <p className="text-2xl font-bold">
                            {statsLoading ? "..." : doctorStats?.totalPatients || 0}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-sm font-medium">Active Patients</p>
                          <p className="text-2xl font-bold">
                            {statsLoading ? "..." : doctorStats?.activePatients || 0}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-purple-500" />
                        <div>
                          <p className="text-sm font-medium">Total Appointments</p>
                          <p className="text-2xl font-bold">
                            {statsLoading ? "..." : doctorStats?.totalAppointments || 0}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-orange-500" />
                        <div>
                          <p className="text-sm font-medium">This Month</p>
                          <p className="text-2xl font-bold">
                            {statsLoading ? "..." : doctorStats?.monthlyAppointments || 0}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Doctor's Patients Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Patients - {selectedDoctor.fullName}</CardTitle>
                    <CardDescription>
                      All patients under {selectedDoctor.fullName}'s care
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {patientsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-sm text-muted-foreground">Loading patients...</div>
                      </div>
                    ) : doctorPatients.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Patient ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Age</TableHead>
                            <TableHead>Gender</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Appointments</TableHead>
                            <TableHead>Last Visit</TableHead>
                            <TableHead>Registered</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {doctorPatients.map((patient: Patient) => (
                            <TableRow key={patient.id}>
                              <TableCell className="font-medium">{patient.patientId}</TableCell>
                              <TableCell>{patient.fullName}</TableCell>
                              <TableCell>{patient.age}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {patient.gender}
                                </Badge>
                              </TableCell>
                              <TableCell>{patient.phoneNumber}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {patient.totalAppointments}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {patient.lastVisitDate 
                                  ? new Date(patient.lastVisitDate).toLocaleDateString()
                                  : 'No visits'
                                }
                              </TableCell>
                              <TableCell>
                                {new Date(patient.createdAt).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No patients found for {selectedDoctor.fullName}.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  </>
  );
}