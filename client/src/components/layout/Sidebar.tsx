import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { 
  ChartPie, 
  Users, 
  Calendar, 
  Pill, 
  CreditCard, 
  BarChart3, 
  Settings, 
  LogOut,
  Flower,
  Shield,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navigationItems = [
  { path: "/", label: "Dashboard", icon: ChartPie },
  { path: "/patients", label: "Patients", icon: Users },
  { path: "/appointments", label: "Appointments", icon: Calendar },
  { path: "/prescriptions", label: "Prescriptions", icon: Pill },
  { path: "/payments", label: "Payments", icon: CreditCard },
  { path: "/reports", label: "Reports", icon: BarChart3 },
  { path: "/settings", label: "Settings", icon: Settings },
];

const adminNavigationItems = [
  { path: "/users", label: "User Management", icon: Shield, adminOnly: true },
  { path: "/admin/logs", label: "Login Logs", icon: FileText, adminOnly: true },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-white shadow-lg fixed h-full overflow-y-auto">
      <div className="p-6 border-b border-ayur-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-ayur-primary rounded-lg flex items-center justify-center">
            <Flower className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ayur-gray-900">AyurCare</h1>
            <p className="text-sm text-ayur-gray-500">Healthcare Management</p>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Link key={item.path} href={item.path} className={`flex items-center space-x-3 px-4 py-3 text-ayur-gray-700 hover:bg-ayur-primary-50 hover:text-ayur-primary-600 rounded-lg transition-colors duration-200 ${
              isActive ? 'bg-ayur-primary-50 text-ayur-primary-600' : ''
            }`}>
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
        
        {/* Admin-only navigation items */}
        {user?.role === 'admin' && (
          <>
            <div className="border-t border-ayur-gray-200 my-4"></div>
            {adminNavigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              
              return (
                <Link key={item.path} href={item.path} className={`flex items-center space-x-3 px-4 py-3 text-ayur-gray-700 hover:bg-ayur-primary-50 hover:text-ayur-primary-600 rounded-lg transition-colors duration-200 ${
                  isActive ? 'bg-ayur-primary-50 text-ayur-primary-600' : ''
                }`}>
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-ayur-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&w=40&h=40&fit=crop&crop=face" />
            <AvatarFallback>DW</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium text-ayur-gray-900">{user?.fullName}</p>
            <p className="text-xs text-ayur-gray-500">Ayurvedic Physician</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-ayur-gray-400 hover:text-ayur-gray-600"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
