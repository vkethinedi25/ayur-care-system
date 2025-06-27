import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import TopBar from "@/components/layout/TopBar";
import PatientForm from "@/components/forms/PatientForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, Edit, UserPlus } from "lucide-react";
import { Patient } from "@/lib/types";

export default function Patients() {
  const [patientFormOpen, setPatientFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: patients = [], isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients", { search: searchQuery }],
    queryFn: async () => {
      const url = searchQuery 
        ? `/api/patients?search=${encodeURIComponent(searchQuery)}`
        : "/api/patients";
      const response = await fetch(url);
      return response.json();
    },
  });

  const getPrakritiColor = (prakriti: string) => {
    if (prakriti.includes("Vata")) return "bg-green-100 text-green-800";
    if (prakriti.includes("Pitta")) return "bg-red-100 text-red-800";
    if (prakriti.includes("Kapha")) return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <>
      <TopBar 
        title="Patients" 
        subtitle="Manage patient records and information"
        onSearch={setSearchQuery}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
          <CardTitle className="text-xl font-semibold text-ayur-gray-900">All Patients</CardTitle>
          <Button 
            onClick={() => setPatientFormOpen(true)}
            className="bg-ayur-primary text-white hover:bg-ayur-primary-600"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add New Patient
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ayur-primary"></div>
            </div>
          ) : patients.length === 0 ? (
            <div className="py-8 text-center text-ayur-gray-500">
              {searchQuery ? "No patients found matching your search." : "No patients found. Add your first patient to get started."}
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-ayur-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-ayur-gray-700">Patient</th>
                      <th className="text-left py-3 px-4 font-medium text-ayur-gray-700">Contact</th>
                      <th className="text-left py-3 px-4 font-medium text-ayur-gray-700">Prakriti</th>
                      <th className="text-left py-3 px-4 font-medium text-ayur-gray-700">Age/Gender</th>
                      <th className="text-left py-3 px-4 font-medium text-ayur-gray-700">Registered</th>
                      <th className="text-left py-3 px-4 font-medium text-ayur-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((patient) => (
                      <tr key={patient.id} className="border-b border-ayur-gray-100 hover:bg-ayur-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={`https://images.unsplash.com/photo-1494790108755?ixlib=rb-4.0.3&w=40&h=40&fit=crop&crop=face`} />
                              <AvatarFallback>{patient.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-ayur-gray-900">{patient.fullName}</p>
                              <p className="text-sm text-ayur-gray-500">{patient.patientId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm text-ayur-gray-900">{patient.phoneNumber}</p>
                          {patient.email && <p className="text-sm text-ayur-gray-500">{patient.email}</p>}
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={getPrakritiColor(patient.prakriti)}>
                            {patient.prakriti}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm text-ayur-gray-900">{patient.age} years</p>
                          <p className="text-sm text-ayur-gray-500 capitalize">{patient.gender}</p>
                        </td>
                        <td className="py-4 px-4 text-sm text-ayur-gray-900">
                          {new Date(patient.createdAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm" className="text-ayur-gray-400 hover:text-ayur-gray-600">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-ayur-gray-400 hover:text-blue-600">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {patients.map((patient) => (
                  <Card key={patient.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={`https://images.unsplash.com/photo-1494790108755?ixlib=rb-4.0.3&w=48&h=48&fit=crop&crop=face`} />
                        <AvatarFallback>{patient.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-ayur-gray-900">{patient.fullName}</h3>
                            <p className="text-sm text-ayur-gray-500">{patient.patientId}</p>
                          </div>
                          <div className="flex space-x-1 ml-2">
                            <Button variant="ghost" size="sm" className="text-ayur-gray-400 hover:text-ayur-gray-600">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-ayur-gray-400 hover:text-blue-600">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-ayur-gray-900">{patient.phoneNumber}</p>
                          {patient.email && <p className="text-sm text-ayur-gray-500">{patient.email}</p>}
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge className={getPrakritiColor(patient.prakriti)} variant="secondary">
                              {patient.prakriti}
                            </Badge>
                            <span className="text-sm text-ayur-gray-500">
                              {patient.age}y, {patient.gender.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-xs text-ayur-gray-500">
                            {new Date(patient.createdAt).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <PatientForm 
        open={patientFormOpen} 
        onOpenChange={setPatientFormOpen} 
      />
    </>
  );
}
