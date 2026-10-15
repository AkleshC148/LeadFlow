import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: "panel" | "card" | "dialog";
}

export function GlassCard({
  children,
  className = "",
  variant = "card",
  ...props
}: GlassCardProps) {
  const variantClass =
    variant === "panel"
      ? "glass-panel"
      : variant === "dialog"
      ? "glass-dialog"
      : "glass-card";

  return (
    <div
      className={`p-6 md:p-8 ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
