"use client";

import React, { useEffect, useState } from "react";
import { LogOut, Sparkles, User as UserIcon, Loader2 } from "lucide-react";
import { onServerWaking } from "../lib/api";
import { removeToken } from "../lib/auth";
import { User } from "../lib/types";
import { GlassButton } from "./ui/GlassButton";

interface HeaderProps {
  user: User | null;
  onLogout?: () => void;
}

export function Header({ user, onLogout }: HeaderProps) {
  const [isWaking, setIsWaking] = useState(false);

  useEffect(() => {
    const unsubscribe = onServerWaking((waking) => {
      setIsWaking(waking);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      removeToken();
      window.location.href = "/login";
    }
  };

  return (
    <header className="glass-panel mx-auto w-full px-5 py-3.5 mb-8 flex items-center justify-between gap-4">
      {/* Brand logo & name */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] border border-white/30">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
            LeadFlow
          </span>
          <span className="text-[10px] text-white/40 uppercase tracking-widest -mt-1 font-medium">
            Pipeline CRM
          </span>
        </div>
      </div>

      {/* Middle status: Server waking up badge */}
      {isWaking && (
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-200 text-xs animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
          <span>Waking up the server...</span>
        </div>
      )}

      {/* Right side: User name & Logout */}
      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/80">
            <UserIcon className="w-3.5 h-3.5 text-indigo-300" />
            <span className="font-medium max-w-[140px] truncate text-white/90">
              {user.name}
            </span>
          </div>
        )}

        <GlassButton
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          title="Sign out of LeadFlow"
        >
          <LogOut className="w-3.5 h-3.5 mr-1 text-white/70" />
          <span className="hidden sm:inline">Logout</span>
        </GlassButton>
      </div>
    </header>
  );
}
