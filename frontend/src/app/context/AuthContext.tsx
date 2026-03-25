import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const API_BASE = 'http://localhost:3000/api';

interface User {
  id: number | null;
  username: string | null;
  email?: string | null;
  is_guest: boolean;
  session_id: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  guestLogin: () => Promise<void>;
  logout: () => void;
  isGuest: boolean;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('thirdplace_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('thirdplace_user');
      }
    }
    setIsLoading(false);
  }, []);

  const saveUser = (u: User) => {
    setUser(u);
    localStorage.setItem('thirdplace_user', JSON.stringify(u));
  };

  const login = async (username: string, password: string) => {
    try {
      const resp = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.toLowerCase(), password }),
      });
      const data = await resp.json();
      if (!resp.ok) return { success: false, error: data.error || 'Login failed' };
      saveUser(data.user);
      return { success: true };
    } catch {
      return { success: false, error: 'Server offline. Start the backend first.' };
    }
  };

  const signup = async (username: string, email: string, password: string) => {
    try {
      const resp = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.toLowerCase(), email, password }),
      });
      const data = await resp.json();
      if (!resp.ok) return { success: false, error: data.error || 'Signup failed' };
      saveUser(data.user);
      return { success: true };
    } catch {
      return { success: false, error: 'Server offline. Start the backend first.' };
    }
  };

  const guestLogin = async () => {
    const guestUser: User = {
      id: null,
      username: 'Guest',
      is_guest: true,
      session_id: 'guest-' + Date.now(),
    };
    saveUser(guestUser);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('thirdplace_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        guestLogin,
        logout,
        isGuest: user?.is_guest ?? true,
        isLoggedIn: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
