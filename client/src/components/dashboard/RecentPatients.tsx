import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, Edit } from "lucide-react";
import { Patient } from "@/lib/types";
import { Link } from "wouter";

interface RecentPatientsProps {
  patients: Patient[];
}

export default function RecentPatients({ patients }: RecentPatientsProps) {
  const getPrakritiColor = (prakriti: string) => {
    if (prakriti.includes("Vata")) return "bg-green-100 text-green-800";
    if (prakriti.includes("Pitta")) return "bg-red-100 text-red-800";
    if (prakriti.includes("Kapha")) return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (index: number) => {
    const statuses = [
      { label: "Active Treatment", color: "bg-blue-100 text-blue-800" },
      { label: "Follow-up Due", color: "bg-yellow-100 text-yellow-800" },
      { label: "Treatment Complete", color: "bg-green-100 text-green-800" },
    ];
    return statuses[index % statuses.length];
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <CardTitle className="text-xl font-semibold text-ayur-gray-900">Recent Patients</CardTitle>
        <Link href="/patients">
          <Button variant="ghost" className="text-ayur-primary-600 hover:text-ayur-primary-700 font-medium text-sm">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ayur-gray-200">
                <th className="text-left py-3 px-4 font-medium text-ayur-gray-700">Patient</th>
                <th className="text-left py-3 px-4 font-medium text-ayur-gray-700">Prakriti</th>
                <th className="text-left py-3 px-4 font-medium text-ayur-gray-700">Last Visit</th>
                <th className="text-left py-3 px-4 font-medium text-ayur-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-ayur-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-ayur-gray-500">
                    No patients found. Add your first patient to get started.
                  </td>
                </tr>
              ) : (
                patients.map((patient, index) => {
                  const status = getStatusColor(index);
                  return (
                    <tr key={patient.id} className="border-b border-ayur-gray-100 hover:bg-ayur-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={`https://images.unsplash.com/photo-${1494790108755 + index}?ixlib=rb-4.0.3&w=40&h=40&fit=crop&crop=face`} />
                            <AvatarFallback>{patient.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-ayur-gray-900">{patient.fullName}</p>
                            <p className="text-sm text-ayur-gray-500">{patient.patientId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={getPrakritiColor(patient.prakriti)}>
                          {patient.prakriti}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-sm text-ayur-gray-900">
                        {new Date(patient.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={status.color}>
                          {status.label}
                        </Badge>
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
