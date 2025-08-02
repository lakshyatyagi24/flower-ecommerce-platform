"use client";
import React, { createContext, useEffect, useState } from 'react';
import type { AuthContextType, User } from '../types';
import { login as loginAPI, logout as logoutAPI } from '../api/authApi';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch current user status from API/localStorage/cookie
    setLoading(false); // Set user if already logged in
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    const userData = await loginAPI(email, password);
    setUser(userData.user);
    setLoading(false);
  };

  const logout = async () => {
    setLoading(true);
    await logoutAPI();
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
