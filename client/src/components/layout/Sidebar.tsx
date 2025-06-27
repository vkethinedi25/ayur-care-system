import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
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
  FileText,
  Database,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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
  { path: "/admin/dashboard", label: "Admin Dashboard", icon: Database, adminOnly: true },
];

// Navigation component for sidebar content
function NavigationContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const [location] = useLocation();
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
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

      {/* Navigation */}
      <nav className="p-4 space-y-2 flex-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Link 
              key={item.path} 
              href={item.path} 
              onClick={onLinkClick}
              className={`flex items-center space-x-3 px-4 py-3 text-ayur-gray-700 hover:bg-ayur-primary-50 hover:text-ayur-primary-600 rounded-lg transition-colors duration-200 ${
                isActive ? 'bg-ayur-primary-50 text-ayur-primary-600' : ''
              }`}
            >
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
                <Link 
                  key={item.path} 
                  href={item.path} 
                  onClick={onLinkClick}
                  className={`flex items-center space-x-3 px-4 py-3 text-ayur-gray-700 hover:bg-ayur-primary-50 hover:text-ayur-primary-600 rounded-lg transition-colors duration-200 ${
                    isActive ? 'bg-ayur-primary-50 text-ayur-primary-600' : ''
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-ayur-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&w=40&h=40&fit=crop&crop=face" />
            <AvatarFallback>{user?.fullName?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ayur-gray-900 truncate">{user?.fullName}</p>
            <p className="text-xs text-ayur-gray-500 truncate">{user?.role === 'admin' ? 'Administrator' : 'Ayurvedic Physician'}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-ayur-gray-400 hover:text-ayur-gray-600 shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 bg-white shadow-lg fixed h-full overflow-y-auto z-40">
        <NavigationContent />
      </aside>

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-ayur-gray-200">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-ayur-primary rounded-lg flex items-center justify-center">
              <Flower className="text-white text-sm" />
            </div>
            <h1 className="text-lg font-bold text-ayur-gray-900">AyurCare</h1>
          </div>
          
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="lg:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <NavigationContent onLinkClick={() => setIsOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
}
