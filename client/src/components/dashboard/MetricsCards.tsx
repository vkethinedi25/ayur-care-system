import { Card, CardContent } from "@/components/ui/card";
import { Users, Calendar, IndianRupee, AlertTriangle, TrendingUp, Clock } from "lucide-react";
import { DashboardMetrics } from "@/lib/types";

interface MetricsCardsProps {
  metrics: DashboardMetrics;
}

export default function MetricsCards({ metrics }: MetricsCardsProps) {
  const cards = [
    {
      title: "Total Patients",
      value: metrics.totalPatients.toLocaleString(),
      change: "+12% from last month",
      changeType: "positive" as const,
      icon: Users,
      bgColor: "bg-ayur-primary-100",
      iconColor: "text-ayur-primary-600",
    },
    {
      title: "Today's Appointments",
      value: metrics.todayAppointments.toString(),
      change: "5 pending confirmations",
      changeType: "neutral" as const,
      icon: Calendar,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Monthly Revenue",
      value: `₹${(metrics.monthlyRevenue / 1000).toFixed(0)}K`,
      change: "+8% from last month",
      changeType: "positive" as const,
      icon: IndianRupee,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Pending Payments",
      value: `₹${(metrics.pendingPayments / 1000).toFixed(0)}K`,
      change: "12 overdue invoices",
      changeType: "negative" as const,
      icon: AlertTriangle,
      bgColor: "bg-orange-100",
      iconColor: "text-orange-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card) => {
        const Icon = card.icon;
        const ChangeIcon = card.changeType === "positive" ? TrendingUp : 
                          card.changeType === "negative" ? AlertTriangle : Clock;
        
        return (
          <Card key={card.title} className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ayur-gray-600">{card.title}</p>
                  <p className="text-3xl font-bold text-ayur-gray-900 mt-2">{card.value}</p>
                  <p className={`text-sm mt-1 flex items-center ${
                    card.changeType === "positive" ? "text-green-600" :
                    card.changeType === "negative" ? "text-orange-600" : "text-blue-600"
                  }`}>
                    <ChangeIcon className="w-4 h-4 mr-1" />
                    {card.change}
                  </p>
                </div>
                <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`${card.iconColor} text-xl`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
