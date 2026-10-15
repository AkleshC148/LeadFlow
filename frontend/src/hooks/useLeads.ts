import { useCallback, useEffect, useMemo, useState } from "react";
import { listLeads } from "../lib/api";
import { isFollowUpToday } from "../lib/time";
import { Lead } from "../lib/types";

export function useLeads(status?: string, q?: string) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listLeads(status, q);
      setLeads(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load leads";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [status, q]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Insert a new lead into state respecting current filter & search
  const insertLead = useCallback(
    (newLead: Lead) => {
      setLeads((prev) => {
        // Check if lead matches current status filter
        if (status && status !== "All" && newLead.status !== status) {
          return prev;
        }
        // Check if lead matches current search query
        if (
          q &&
          q.trim() &&
          !newLead.name.toLowerCase().includes(q.trim().toLowerCase())
        ) {
          return prev;
        }
        // Prepend new lead
        return [newLead, ...prev.filter((l) => l.id !== newLead.id)];
      });
    },
    [status, q]
  );

  // Replace a lead in state (for discussions & status updates)
  const replaceLead = useCallback((updatedLead: Lead) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === updatedLead.id ? updatedLead : l))
    );
  }, []);

  // Optimistic update with automatic rollback on error
  const optimisticUpdateLead = useCallback(
    async (
      id: string,
      updates: Partial<Lead>,
      applyRemote: () => Promise<Lead>
    ): Promise<Lead> => {
      let previousLeads: Lead[] = [];
      setLeads((prev) => {
        previousLeads = prev;
        return prev.map((l) => (l.id === id ? { ...l, ...updates } : l));
      });

      try {
        const result = await applyRemote();
        setLeads((prev) =>
          prev.map((l) => (l.id === id ? result : l))
        );
        return result;
      } catch (err) {
        // Rollback
        setLeads(previousLeads);
        throw err;
      }
    },
    []
  );

  // Compute pinned today's follow-ups vs all other leads
  // Ensures no lead appears twice!
  const { todayLeads, otherLeads } = useMemo(() => {
    const today: Lead[] = [];
    const other: Lead[] = [];

    for (const lead of leads) {
      if (isFollowUpToday(lead.follow_up_at)) {
        today.push(lead);
      } else {
        other.push(lead);
      }
    }

    return { todayLeads: today, otherLeads: other };
  }, [leads]);

  return {
    leads,
    todayLeads,
    otherLeads,
    loading,
    error,
    reload: fetchLeads,
    insertLead,
    replaceLead,
    optimisticUpdateLead,
  };
}
