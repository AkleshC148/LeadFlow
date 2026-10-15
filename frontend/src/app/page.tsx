"use client";

import React, { useState } from "react";
import { AddLeadDialog } from "../components/AddLeadDialog";
import { AuthGuard, useAuth } from "../components/AuthGuard";
import { FilterBar } from "../components/FilterBar";
import { Header } from "../components/Header";
import { LeadList } from "../components/LeadList";
import { LeadTimelineDialog } from "../components/LeadTimelineDialog";
import { SearchInput } from "../components/SearchInput";
import { useDebounce } from "../hooks/useDebounce";
import { useLeads } from "../hooks/useLeads";
import { Lead } from "../lib/types";

function DashboardContent() {
  const { user, logout } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchInput, setSearchInput] = useState("");
  const debouncedQuery = useDebounce(searchInput, 300);

  const {
    todayLeads,
    otherLeads,
    loading,
    error,
    reload,
    insertLead,
    replaceLead,
    optimisticUpdateLead,
  } = useLeads(selectedStatus, debouncedQuery);

  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [timelineOpen, setTimelineOpen] = useState(false);

  const handleOpenTimeline = (lead: Lead) => {
    setActiveLead(lead);
    setTimelineOpen(true);
  };

  const handleLeadUpdated = (updatedLead: Lead) => {
    replaceLead(updatedLead);
    if (activeLead && activeLead.id === updatedLead.id) {
      setActiveLead(updatedLead);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <Header user={user} onLogout={logout} />

      {/* Main dashboard control bar */}
      <div className="flex flex-col gap-5 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <SearchInput
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search leads by name..."
            />
          </div>

          <div className="shrink-0 self-end sm:self-center">
            <AddLeadDialog onLeadCreated={insertLead} />
          </div>
        </div>

        {/* Status Filter Chips */}
        <FilterBar
          selectedStatus={selectedStatus}
          onSelectStatus={setSelectedStatus}
        />
      </div>

      {/* Lead List Section with Pinning */}
      <main className="flex-1">
        <LeadList
          todayLeads={todayLeads}
          otherLeads={otherLeads}
          loading={loading}
          error={error}
          onRetry={reload}
          onSelectLead={handleOpenTimeline}
        />
      </main>

      {/* Lead Timeline Dialog */}
      <LeadTimelineDialog
        lead={activeLead}
        open={timelineOpen}
        onOpenChange={(open) => {
          setTimelineOpen(open);
          if (!open) setActiveLead(null);
        }}
        onLeadUpdated={handleLeadUpdated}
        onOptimisticUpdateLead={optimisticUpdateLead}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
