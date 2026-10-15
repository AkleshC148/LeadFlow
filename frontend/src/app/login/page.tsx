"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Lock, Mail } from "lucide-react";
import { login } from "../../lib/api";
import { setToken } from "../../lib/auth";
import { GlassButton } from "../../components/ui/GlassButton";
import { GlassCard } from "../../components/ui/GlassCard";
import { GlassInput } from "../../components/ui/GlassInput";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const validate = () => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Enter a valid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validate()) return;

    setLoading(true);

    try {
      const res = await login({
        email: email.trim().toLowerCase(),
        password,
      });

      setToken(res.access_token);
      window.location.href = "/";
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to sign in. Please try again.";
      setFormError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
        <GlassCard className="p-8 sm:p-10 flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-[0_0_24px_rgba(99,102,241,0.6)] border border-white/30 mb-1">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Welcome to LeadFlow
            </h1>
            <p className="text-xs text-white/60 max-w-xs">
              Enter your credentials to access your sales pipeline.
            </p>
          </div>

          {/* Form Error Banner */}
          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="relative">
              <GlassInput
                label="Email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }
                  if (formError) setFormError(null);
                }}
                error={fieldErrors.email}
                disabled={loading}
                autoFocus
              />
              <Mail className="w-4 h-4 text-white/30 absolute right-3.5 top-9 pointer-events-none" />
            </div>

            <div className="relative">
              <GlassInput
                label="Password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }
                  if (formError) setFormError(null);
                }}
                error={fieldErrors.password}
                disabled={loading}
              />
              <Lock className="w-4 h-4 text-white/30 absolute right-3.5 top-9 pointer-events-none" />
            </div>

            <GlassButton
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="mt-2 w-full"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </GlassButton>
          </form>

          {/* Footer link */}
          <div className="pt-4 border-t border-white/10 text-center text-xs text-white/60">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-indigo-300 hover:text-indigo-200 hover:underline transition-colors"
            >
              Create account
            </Link>
          </div>
        </GlassCard>
      </div>
    </main>
  );
}
