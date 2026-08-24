import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

interface User {
  id: string;
  email: string;
  full_name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

interface AuthResult {
  error: { message: string } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// The hook intentionally lives beside its provider so authentication stays a
// single public module for this small application.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = api.getToken();
    if (token) {
      try {
        const userData = await api.getCurrentUser();
        setUser(userData);
      } catch {
        api.setToken(null);
        setUser(null);
      }
    }
    setLoading(false);
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      await api.signup(email, password, fullName);
      return { error: null };
    } catch (error: unknown) {
      return { error: { message: error instanceof Error ? error.message : 'Account creation failed.' } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const data = await api.login(email, password);
      setUser(data.user);
      return { error: null };
    } catch (error: unknown) {
      return { error: { message: error instanceof Error ? error.message : 'Sign in failed.' } };
    }
  };

  const signOut = async () => {
    try {
      await api.logout();
    } catch {
      // The local session should still end if the server is unavailable.
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
