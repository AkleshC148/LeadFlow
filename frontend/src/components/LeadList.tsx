import React from "react";
import { AlertCircle, CalendarClock, Inbox, RefreshCw, Users } from "lucide-react";
import { Lead } from "../lib/types";
import { LeadRow } from "./LeadRow";
import { GlassButton } from "./ui/GlassButton";

interface LeadListProps {
  todayLeads: Lead[];
  otherLeads: Lead[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelectLead: (lead: Lead) => void;
}

export function LeadList({
  todayLeads,
  otherLeads,
  loading,
  error,
  onRetry,
  onSelectLead,
}: LeadListProps) {
  // Loading skeletons
  if (loading && todayLeads.length === 0 && otherLeads.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="glass-row p-5 flex items-center justify-between gap-4 animate-pulse"
          >
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-4 bg-white/10 rounded w-1/3" />
              <div className="h-3 bg-white/5 rounded w-1/2" />
            </div>
            <div className="h-6 bg-white/10 rounded-full w-24" />
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="glass-card p-8 flex flex-col items-center justify-center text-center gap-4 border-rose-500/30 bg-rose-950/20">
        <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="flex flex-col gap-1 max-w-md">
          <h3 className="text-base font-semibold text-rose-200">
            Failed to load leads
          </h3>
          <p className="text-xs text-rose-300/80 leading-relaxed">{error}</p>
        </div>
        <GlassButton variant="primary" size="sm" onClick={onRetry}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          <span>Try Again</span>
        </GlassButton>
      </div>
    );
  }

  // Empty state
  const totalLeads = todayLeads.length + otherLeads.length;
  if (!loading && totalLeads === 0) {
    return (
      <div className="glass-card p-12 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
          <Inbox className="w-7 h-7" />
        </div>
        <div className="flex flex-col gap-1 max-w-sm">
          <h3 className="text-base font-medium text-white/90">No leads found</h3>
          <p className="text-xs text-white/50 leading-relaxed">
            No leads match your current filter or search query. Create a new lead or adjust your filters to see more.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Pinned Section: Today's follow-ups */}
      {todayLeads.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2 px-1">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <CalendarClock className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-semibold text-white/95 uppercase tracking-wider">
              Today&apos;s follow-ups
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">
              {todayLeads.length}
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {todayLeads.map((lead) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                onClick={() => onSelectLead(lead)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Main Section: All leads */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2 px-1">
          <div className="w-6 h-6 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-white/70">
            <Users className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-sm font-semibold text-white/95 uppercase tracking-wider">
            {todayLeads.length > 0 ? "Other leads" : "All leads"}
          </h2>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/15">
            {otherLeads.length}
          </span>
        </div>

        {otherLeads.length === 0 ? (
          <div className="glass-panel p-6 text-center text-xs text-white/40 italic">
            No additional leads in this view.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {otherLeads.map((lead) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                onClick={() => onSelectLead(lead)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
