"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { me } from "../lib/api";
import { getToken, removeToken } from "../lib/auth";
import { User } from "../lib/types";

interface AuthContextType {
  user: User | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    removeToken();
    window.location.href = "/login";
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      window.location.href = "/login";
      return;
    }

    me()
      .then((userData) => {
        setUser(userData);
        setLoading(false);
      })
      .catch(() => {
        removeToken();
        window.location.href = "/login";
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="glass-card p-8 flex flex-col items-center gap-4 animate-in fade-in duration-300">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-[0_0_24px_rgba(99,102,241,0.5)]">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex items-center gap-2 text-sm text-white/80">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            <span>Verifying session...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
