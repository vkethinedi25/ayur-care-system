import { useState, useEffect } from "react";

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>({
    id: 1,
    username: "dr.sharma",
    email: "dr.sharma@clinic.com",
    fullName: "Dr. Rajesh Sharma",
    role: "doctor"
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Using test user from database
  }, []);

  const login = async (username: string, password: string) => {
    // Mock login - in real app would call API
    setUser({
      id: 1,
      username,
      email: "sarah@ayurcare.com",
      fullName: "Dr. Sarah Wilson",
      role: "doctor"
    });
  };

  const logout = () => {
    setUser(null);
  };

  return {
    user,
    isLoading,
    login,
    logout,
  };
}
