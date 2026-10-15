import React from "react";
import { Loader2 } from "lucide-react";

interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      variant = "secondary",
      size = "md",
      loading = false,
      disabled,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "px-3.5 py-1.5 text-xs gap-1.5",
      md: "px-5 py-2.5 text-sm gap-2",
      lg: "px-7 py-3.5 text-base gap-2.5",
    }[size];

    let variantClass = "glass-button text-white";
    if (variant === "primary") {
      variantClass = "glass-button-primary text-white";
    } else if (variant === "danger") {
      variantClass =
        "glass-button text-rose-300 hover:text-rose-200 border-rose-500/30 hover:border-rose-500/50 hover:bg-rose-950/40";
    } else if (variant === "ghost") {
      variantClass =
        "text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors";
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center select-none font-medium outline-none cursor-pointer disabled:cursor-not-allowed ${variantClass} ${sizeClasses} ${className}`}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

GlassButton.displayName = "GlassButton";
