"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastVariant = "default" | "success" | "destructive";

interface ToastMessage {
  id: string;
  title?: string;
  description: string;
  variant?: ToastVariant;
}

interface ToastContextType {
  toast: (options: {
    title?: string;
    description: string;
    variant?: ToastVariant;
  }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback(
    ({
      title,
      description,
      variant = "default",
    }: {
      title?: string;
      description: string;
      variant?: ToastVariant;
    }) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, description, variant }]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastPrimitive.Provider swipeDirection="right" duration={4500}>
        {children}
        {toasts.map((t) => {
          const isSuccess = t.variant === "success";
          const isDestructive = t.variant === "destructive";

          let borderClass = "border-white/20";
          let bgClass = "bg-slate-900/90 text-white";
          let icon = <Info className="w-5 h-5 text-indigo-400 shrink-0" />;

          if (isSuccess) {
            borderClass = "border-emerald-500/40";
            bgClass = "bg-slate-950/90 text-emerald-100";
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
          } else if (isDestructive) {
            borderClass = "border-rose-500/50";
            bgClass = "bg-slate-950/90 text-rose-100";
            icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
          }

          return (
            <ToastPrimitive.Root
              key={t.id}
              onOpenChange={(open) => {
                if (!open) removeToast(t.id);
              }}
              className={`glass-card p-4 flex items-start gap-3 min-w-[300px] max-w-md shadow-2xl backdrop-blur-xl border ${borderClass} ${bgClass} transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out`}
            >
              {icon}
              <div className="flex-1 flex flex-col gap-0.5">
                {t.title && (
                  <ToastPrimitive.Title className="text-sm font-semibold tracking-tight text-white">
                    {t.title}
                  </ToastPrimitive.Title>
                )}
                <ToastPrimitive.Description className="text-xs text-white/80 leading-relaxed">
                  {t.description}
                </ToastPrimitive.Description>
              </div>
              <ToastPrimitive.Close className="text-white/40 hover:text-white transition-colors p-1 rounded-md">
                <X className="w-4 h-4" />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          );
        })}
        <ToastPrimitive.Viewport className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 p-4 max-w-[100vw] outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
