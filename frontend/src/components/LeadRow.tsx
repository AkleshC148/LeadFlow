import React from "react";
import { Bell, Clock, Building, MessageSquare } from "lucide-react";
import { Lead } from "../lib/types";
import {
  formatFollowUpDateTime,
  formatRelativeTime,
  isLeadOverdue,
} from "../lib/time";
import { StatusBadge } from "./StatusBadge";

interface LeadRowProps {
  lead: Lead;
  onClick: () => void;
}

export function LeadRow({ lead, onClick }: LeadRowProps) {
  const overdue = isLeadOverdue(lead.follow_up_at, lead.status);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={`glass-row group p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 ${
        overdue
          ? "border-rose-500/50 hover:border-rose-400/80 bg-rose-950/20 hover:bg-rose-950/30 shadow-[0_4px_20px_rgba(244,63,94,0.15)]"
          : ""
      }`}
    >
      {/* Left side: Name, company, status badge, overdue pill */}
      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span
            className={`font-semibold text-base tracking-tight truncate ${
              overdue ? "text-rose-200" : "text-white group-hover:text-white"
            }`}
          >
            {lead.name}
          </span>

          {lead.company && (
            <span className="flex items-center gap-1 text-xs text-white/50 truncate max-w-[200px]">
              <Building className="w-3 h-3 shrink-0" />
              <span className="truncate">{lead.company}</span>
            </span>
          )}

          <StatusBadge status={lead.status} size="sm" />

          {overdue && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 tracking-wider uppercase">
              Overdue
            </span>
          )}
        </div>

        {/* Last note truncated to 1 line */}
        <div className="flex items-center gap-1.5 text-xs text-white/60">
          <MessageSquare className="w-3.5 h-3.5 shrink-0 text-white/40" />
          {lead.last_note ? (
            <p className="truncate text-white/70">{lead.last_note}</p>
          ) : (
            <p className="italic text-white/40">No discussions yet</p>
          )}
        </div>
      </div>

      {/* Right side: Relative time & Follow-up chip */}
      <div className="flex items-center gap-3 shrink-0 self-start md:self-center flex-wrap">
        {/* Relative time since last discussion */}
        <div
          className="flex items-center gap-1.5 text-xs text-white/50"
          title="Time since last discussion"
        >
          <Clock className="w-3.5 h-3.5 text-white/40" />
          <span>{formatRelativeTime(lead.last_discussion_at)}</span>
        </div>

        {/* Follow-up date/time chip if set */}
        {lead.follow_up_at && (
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-md ${
              overdue
                ? "bg-rose-500/20 border-rose-500/40 text-rose-200"
                : "bg-white/10 border-white/20 text-white/90"
            }`}
          >
            <Bell
              className={`w-3.5 h-3.5 ${
                overdue ? "text-rose-400 animate-pulse" : "text-amber-300"
              }`}
            />
            <span>{formatFollowUpDateTime(lead.follow_up_at)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
