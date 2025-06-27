import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Patients from "@/pages/Patients";
import Appointments from "@/pages/Appointments";
import Prescriptions from "@/pages/Prescriptions";
import Payments from "@/pages/Payments";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Users from "@/pages/Users";
import AdminLogs from "@/pages/AdminLogs";
import AdminDashboard from "@/pages/AdminDashboard";
import Login from "@/pages/Login";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ayur-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ayur-primary"></div>
      </div>
    );
  }

  // Render login page for unauthenticated users
  if (!isAuthenticated) {
    return <Login />;
  }

  // Render main application for authenticated users
  return (
    <div className="min-h-screen flex bg-ayur-gray-50">
      <Sidebar />
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0 p-4 lg:p-8">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/patients" component={Patients} />
          <Route path="/appointments" component={Appointments} />
          <Route path="/prescriptions" component={Prescriptions} />
          <Route path="/payments" component={Payments} />
          <Route path="/reports" component={Reports} />
          <Route path="/settings" component={Settings} />
          <Route path="/users" component={Users} />
          <Route path="/admin/logs" component={AdminLogs} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
