import { useQuery } from "@tanstack/react-query";

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
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 60000, // Cache for 1 minute
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}
