import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  specialization?: string;
  licenseNumber?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 60000, // Cache for 1 minute
  });

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      // Clear authentication cache and redirect
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      window.location.reload();
    }
  }, [queryClient]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    logout,
  };
}
