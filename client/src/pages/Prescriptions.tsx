import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import TopBar from "@/components/layout/TopBar";
import PrescriptionForm from "@/components/forms/PrescriptionForm";
import PrescriptionUpload from "@/components/forms/PrescriptionUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileText, Upload, Eye, Download, Plus } from "lucide-react";
import { Prescription, Patient, User } from "@/lib/types";

type PrescriptionWithDetails = Prescription & {
  patient: Patient;
  doctor: User;
};

export default function Prescriptions() {
  const [prescriptionFormOpen, setPrescriptionFormOpen] = useState(false);
  const [uploadFormOpen, setUploadFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: prescriptions = [], isLoading } = useQuery<PrescriptionWithDetails[]>({
    queryKey: ["/api/prescriptions"],
  });

  const formatMedications = (medications: any) => {
    if (!medications || !Array.isArray(medications)) return "No medications";
    return medications.slice(0, 2).map(med => med.name).join(", ") + 
           (medications.length > 2 ? `... +${medications.length - 2} more` : "");
  };

  const filteredPrescriptions = prescriptions.filter(prescription =>
    !searchQuery || 
    prescription.patient?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prescription.patient?.patientId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prescription.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <TopBar 
        title="Prescriptions" 
        subtitle="Manage patient prescriptions and treatments"
        onSearch={setSearchQuery}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
          <CardTitle className="text-xl font-semibold text-ayur-gray-900">All Prescriptions</CardTitle>
          <div className="flex space-x-2">
            <Button 
              onClick={() => setUploadFormOpen(true)}
              variant="outline"
              className="border-ayur-primary text-ayur-primary hover:bg-ayur-primary-50"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Prescription
            </Button>
            <Button 
              onClick={() => setPrescriptionFormOpen(true)}
              className="bg-ayur-primary text-white hover:bg-ayur-primary-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Prescription
            </Button>
          </div>
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
                    <th className="text-left py-3 px-4 font-medium text-ayur-gray-700">Diagnosis</th>
                    <th className="text-left py-3 px-4 font-medium text-ayur-gray-700">Medications</th>
                    <th className="text-left py-3 px-4 font-medium text-ayur-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-ayur-gray-700">Follow-up</th>
                    <th className="text-left py-3 px-4 font-medium text-ayur-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPrescriptions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-ayur-gray-500">
                        {searchQuery ? "No prescriptions found matching your search." : "No prescriptions found. Create your first prescription to get started."}
                      </td>
                    </tr>
                  ) : (
                    filteredPrescriptions.map((prescription) => (
                      <tr key={prescription.id} className="border-b border-ayur-gray-100 hover:bg-ayur-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={`https://images.unsplash.com/photo-1494790108755?ixlib=rb-4.0.3&w=40&h=40&fit=crop&crop=face`} />
                              <AvatarFallback>{prescription.patient?.fullName?.split(' ').map(n => n[0]).join('') || 'NA'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-ayur-gray-900">{prescription.patient?.fullName || 'Unknown Patient'}</p>
                              <p className="text-sm text-ayur-gray-500">{prescription.patient?.patientId || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm text-ayur-gray-900">{prescription.diagnosis}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm text-ayur-gray-900">{formatMedications(prescription.medications)}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm text-ayur-gray-900">
                            {new Date(prescription.createdAt).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          {prescription.followUpDate ? (
                            <Badge className="bg-blue-100 text-blue-800">
                              {new Date(prescription.followUpDate).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </Badge>
                          ) : (
                            <span className="text-sm text-ayur-gray-500">Not scheduled</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm" className="text-ayur-gray-400 hover:text-ayur-gray-600">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {prescription.prescriptionUrl && (
                              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <PrescriptionForm 
        open={prescriptionFormOpen} 
        onOpenChange={setPrescriptionFormOpen} 
      />
      
      <PrescriptionUpload 
        open={uploadFormOpen} 
        onOpenChange={setUploadFormOpen} 
      />
    </>
  );
}
