import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Clock, MapPin, Monitor, Shield, User } from "lucide-react";
import { format } from "date-fns";

interface LoginLog {
  id: number;
  userId: number;
  loginTime: Date;
  ipAddress: string | null;
  userAgent: string | null;
  location: any;
  sessionId: string | null;
  loginStatus: string;
  user: {
    id: number;
    username: string;
    email: string;
    fullName: string;
    role: string;
  };
}

export default function AdminLogs() {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: loginLogs, isLoading, error } = useQuery({
    queryKey: ["/api/admin/login-logs"],
  });

  const { data: userLoginLogs, isLoading: userLogsLoading } = useQuery({
    queryKey: ["/api/admin/login-logs", selectedUserId],
    enabled: !!selectedUserId,
  });

  const filteredLogs = loginLogs?.filter((log: LoginLog) => {
    if (statusFilter !== "all" && log.loginStatus !== statusFilter) {
      return false;
    }
    return true;
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Success</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "locked":
        return <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border-yellow-200">Locked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200">Admin</Badge>;
      case "doctor":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Doctor</Badge>;
      case "staff":
        return <Badge variant="secondary">Staff</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const formatLocation = (location: any) => {
    if (!location) return "Unknown";
    if (typeof location === "string") return location;
    if (typeof location === "object") {
      const parts = [];
      if (location.city) parts.push(location.city);
      if (location.region) parts.push(location.region);
      if (location.country) parts.push(location.country);
      return parts.join(", ") || "Unknown";
    }
    return "Unknown";
  };

  const formatUserAgent = (userAgent: string | null) => {
    if (!userAgent) return "Unknown";
    
    // Extract browser and OS info
    const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/);
    const osMatch = userAgent.match(/(Windows|Mac|Linux|Android|iOS)/);
    
    const browser = browserMatch ? browserMatch[1] : "Unknown Browser";
    const os = osMatch ? osMatch[1] : "Unknown OS";
    
    return `${browser} on ${os}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-red-600" />
          <h1 className="text-2xl font-bold">Admin - User Login Logs</h1>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-500">Loading login logs...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-red-600" />
          <h1 className="text-2xl font-bold">Admin - User Login Logs</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-red-600">Error loading login logs. Please try again.</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-red-600" />
        <h1 className="text-2xl font-bold">Admin - User Login Logs</h1>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Filter Login Logs
          </CardTitle>
          <CardDescription>Filter and search through user login activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="locked">Locked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Input
                placeholder="Enter User ID for detailed logs"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                type="number"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Login Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Recent Login Activity
          </CardTitle>
          <CardDescription>
            All user login attempts and session information ({filteredLogs.length} records)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Login Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Device/Browser</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No login logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log: LoginLog) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{log.user.fullName}</span>
                          <span className="text-sm text-gray-500">@{log.user.username}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(log.user.role)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <div className="flex flex-col">
                            <span className="text-sm">
                              {format(new Date(log.loginTime), "MMM dd, yyyy")}
                            </span>
                            <span className="text-xs text-gray-500">
                              {format(new Date(log.loginTime), "hh:mm a")}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(log.loginStatus)}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {log.ipAddress || "Unknown"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {formatLocation(log.location)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {formatUserAgent(log.userAgent)}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* User-specific logs if selected */}
      {selectedUserId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4" />
              User Login History (ID: {selectedUserId})
            </CardTitle>
            <CardDescription>
              Detailed login history for the selected user
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userLogsLoading ? (
              <div className="text-center py-8 text-gray-500">
                Loading user login history...
              </div>
            ) : userLoginLogs?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No login history found for this user
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Login Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Session ID</TableHead>
                      <TableHead>Device/Browser</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userLoginLogs?.map((log: LoginLog) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <div className="flex flex-col">
                              <span className="text-sm">
                                {format(new Date(log.loginTime), "MMM dd, yyyy")}
                              </span>
                              <span className="text-xs text-gray-500">
                                {format(new Date(log.loginTime), "hh:mm:ss a")}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(log.loginStatus)}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">
                            {log.ipAddress || "Unknown"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {formatLocation(log.location)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs text-gray-500">
                            {log.sessionId ? log.sessionId.substring(0, 12) + "..." : "No session"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {formatUserAgent(log.userAgent)}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}