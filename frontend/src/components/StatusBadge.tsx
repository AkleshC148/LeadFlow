import React from "react";
import { LeadStatus } from "../lib/types";

interface StatusBadgeProps {
  status: LeadStatus;
  className?: string;
  size?: "sm" | "md";
}

const statusConfig: Record<
  LeadStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  New: {
    label: "New",
    bg: "bg-sky-500/15",
    text: "text-sky-200",
    border: "border-sky-400/30",
    dot: "bg-sky-400",
  },
  Contacted: {
    label: "Contacted",
    bg: "bg-indigo-500/15",
    text: "text-indigo-200",
    border: "border-indigo-400/30",
    dot: "bg-indigo-400",
  },
  Qualified: {
    label: "Qualified",
    bg: "bg-teal-500/15",
    text: "text-teal-200",
    border: "border-teal-400/30",
    dot: "bg-teal-400",
  },
  "Proposal Sent": {
    label: "Proposal Sent",
    bg: "bg-amber-500/15",
    text: "text-amber-200",
    border: "border-amber-400/30",
    dot: "bg-amber-400",
  },
  Won: {
    label: "Won",
    bg: "bg-emerald-500/20",
    text: "text-emerald-200",
    border: "border-emerald-400/40",
    dot: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]",
  },
  Lost: {
    label: "Lost",
    bg: "bg-rose-500/15",
    text: "text-rose-200",
    border: "border-rose-400/30",
    dot: "bg-rose-400",
  },
};

export function StatusBadge({
  status,
  className = "",
  size = "md",
}: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.New;
  const sizeClasses =
    size === "sm"
      ? "px-2.5 py-0.5 text-xs gap-1.5"
      : "px-3 py-1 text-xs font-medium gap-2";

  return (
    <span
      className={`inline-flex items-center rounded-full border backdrop-blur-md select-none shrink-0 ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
}
