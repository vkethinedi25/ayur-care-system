import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users as UsersIcon, Plus, Edit, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export default function Users() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest(`/api/users/${userId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User deleted",
        description: "User has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete user.",
        variant: "destructive",
      });
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: number; isActive: boolean }) => {
      await apiRequest(`/api/users/${userId}/toggle-status`, "PATCH", { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User status updated",
        description: "User status has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user status.",
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users.filter((user: User) =>
    user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowUserForm(true);
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm("Are you sure you want to delete this user?")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleToggleStatus = (userId: number, currentStatus: boolean) => {
    toggleUserStatusMutation.mutate({ userId, isActive: !currentStatus });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "doctor":
        return "bg-blue-100 text-blue-800";
      case "staff":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ayur-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ayur-gray-900">User Management</h1>
          <p className="text-ayur-gray-600 mt-2">
            Manage system users, roles, and permissions
          </p>
        </div>
        <Button 
          onClick={() => {
            setEditingUser(null);
            setShowUserForm(true);
          }}
          className="bg-ayur-primary hover:bg-ayur-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5" />
            System Users ({filteredUsers.length})
          </CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-ayur-gray-900">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-ayur-gray-900">Username</th>
                  <th className="text-left py-3 px-4 font-medium text-ayur-gray-900">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-ayur-gray-900">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-ayur-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-ayur-gray-900">Created Date</th>
                  <th className="text-right py-3 px-4 font-medium text-ayur-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user: User) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-ayur-gray-900">
                        {user.fullName || "N/A"}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-ayur-gray-900">
                      {user.username}
                    </td>
                    <td className="py-3 px-4 text-ayur-gray-600">
                      {user.email || "N/A"}
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge 
                        className={user.isActive 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                        }
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-ayur-gray-600 text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(user.id, user.isActive)}
                          className={user.isActive 
                            ? "text-red-600 hover:text-red-700" 
                            : "text-green-600 hover:text-green-700"
                          }
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-ayur-gray-500">
                No users found matching your search.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* User Form Dialog - Simple inline implementation */}
      {showUserForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const userData = {
                username: formData.get('username') as string,
                password: formData.get('password') as string,
                email: formData.get('email') as string,
                fullName: formData.get('fullName') as string,
                role: formData.get('role') as string,
                isActive: formData.get('isActive') === 'on'
              };
              // Handle form submission here
              console.log('User data:', userData);
              setShowUserForm(false);
              setEditingUser(null);
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <Input name="username" defaultValue={editingUser?.username} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <Input name="password" type="password" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input name="email" type="email" defaultValue={editingUser?.email} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <Input name="fullName" defaultValue={editingUser?.fullName} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select name="role" defaultValue={editingUser?.role || 'staff'} className="w-full border border-gray-300 rounded px-3 py-2">
                  <option value="admin">Admin</option>
                  <option value="doctor">Doctor</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  name="isActive" 
                  defaultChecked={editingUser?.isActive ?? true}
                  className="mr-2"
                />
                <label className="text-sm font-medium">Active</label>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowUserForm(false);
                    setEditingUser(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingUser ? 'Update' : 'Create'} User
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}