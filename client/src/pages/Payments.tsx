import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TopBar from "@/components/layout/TopBar";
import PaymentForm from "@/components/forms/PaymentForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { IndianRupee, Plus, Check, X } from "lucide-react";
import { Payment, Patient } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type PaymentWithDetails = Payment & {
  patient: Patient;
};

export default function Payments() {
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading } = useQuery<PaymentWithDetails[]>({
    queryKey: ["/api/payments"],
  });

  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PUT", `/api/payments/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Success",
        description: "Payment status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      case "refunded": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getMethodBadgeColor = (method: string) => {
    switch (method) {
      case "cash": return "bg-green-100 text-green-800";
      case "card": return "bg-blue-100 text-blue-800";
      case "upi": return "bg-purple-100 text-purple-800";
      case "netbanking": return "bg-indigo-100 text-indigo-800";
      case "cheque": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredPayments = payments.filter(payment =>
    !searchQuery || 
    payment.patient?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.patient?.patientId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.amount?.toString().includes(searchQuery)
  );

  const totalPending = payments
    .filter(p => p.paymentStatus === "pending")
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const totalCompleted = payments
    .filter(p => p.paymentStatus === "completed")
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  return (
    <>
      <TopBar 
        title="Payments" 
        subtitle="Manage patient payments and invoices"
        onSearch={setSearchQuery}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ayur-gray-600">Total Collected</p>
                <p className="text-2xl font-bold text-green-600">₹{totalCompleted.toLocaleString()}</p>
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
                <p className="text-sm font-medium text-ayur-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-yellow-600">₹{totalPending.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <IndianRupee className="text-yellow-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ayur-gray-600">Total Payments</p>
                <p className="text-2xl font-bold text-ayur-gray-900">{payments.length}</p>
              </div>
              <div className="w-12 h-12 bg-ayur-primary-100 rounded-lg flex items-center justify-center">
                <IndianRupee className="text-ayur-primary-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
          <CardTitle className="text-xl font-semibold text-ayur-gray-900">All Payments</CardTitle>
          <Button 
            onClick={() => setPaymentFormOpen(true)}
            className="bg-ayur-primary text-white hover:bg-ayur-primary-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Record Payment
          </Button>
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
                    <th className="text-left py-3 px-4 font-medium text-ayur-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-ayur-gray-700">Method</th>
                    <th className="text-left py-3 px-4 font-medium text-ayur-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-ayur-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-ayur-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-ayur-gray-500">
                        {searchQuery ? "No payments found matching your search." : "No payments found. Record your first payment to get started."}
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((payment) => (
                      <tr key={payment.id} className="border-b border-ayur-gray-100 hover:bg-ayur-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={`https://images.unsplash.com/photo-1494790108755?ixlib=rb-4.0.3&w=40&h=40&fit=crop&crop=face`} />
                              <AvatarFallback>{payment.patient?.fullName?.split(' ').map(n => n[0]).join('') || 'NA'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-ayur-gray-900">{payment.patient?.fullName || 'Unknown Patient'}</p>
                              <p className="text-sm text-ayur-gray-500">{payment.patient?.patientId || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-lg font-semibold text-ayur-gray-900">₹{parseFloat(payment.amount).toLocaleString()}</p>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={getMethodBadgeColor(payment.paymentMethod)}>
                            {payment.paymentMethod.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={getStatusColor(payment.paymentStatus)}>
                            {payment.paymentStatus}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm text-ayur-gray-900">
                            {new Date(payment.createdAt).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                          {payment.paidAt && (
                            <p className="text-xs text-ayur-gray-500">
                              Paid: {new Date(payment.paidAt).toLocaleDateString('en-IN')}
                            </p>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex space-x-2">
                            {payment.paymentStatus === "pending" && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => updatePaymentStatusMutation.mutate({ id: payment.id, status: "completed" })}
                                  disabled={updatePaymentStatusMutation.isPending}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => updatePaymentStatusMutation.mutate({ id: payment.id, status: "failed" })}
                                  disabled={updatePaymentStatusMutation.isPending}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
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

      <PaymentForm 
        open={paymentFormOpen} 
        onOpenChange={setPaymentFormOpen} 
      />
    </>
  );
}
