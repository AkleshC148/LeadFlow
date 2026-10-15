"use client";

import React, { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import {
  Building,
  Check,
  ChevronDown,
  Clock,
  MessageSquare,
  Phone,
  X,
  AlertCircle,
} from "lucide-react";
import { listDiscussions, updateLead } from "../lib/api";
import {
  AddDiscussionResponse,
  Discussion,
  Lead,
  LeadStatus,
  STATUSES,
} from "../lib/types";
import { DiscussionForm } from "./DiscussionForm";
import { DiscussionItem } from "./DiscussionItem";
import { StatusBadge } from "./StatusBadge";
import { useToast } from "./ui/Toast";

interface LeadTimelineDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadUpdated: (lead: Lead) => void;
  onOptimisticUpdateLead: (
    id: string,
    updates: Partial<Lead>,
    applyRemote: () => Promise<Lead>
  ) => Promise<Lead>;
}

export function LeadTimelineDialog({
  lead,
  open,
  onOpenChange,
  onLeadUpdated,
  onOptimisticUpdateLead,
}: LeadTimelineDialogProps) {
  const [currentLead, setCurrentLead] = useState<Lead | null>(lead);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Sync internal lead when prop changes
  useEffect(() => {
    setCurrentLead(lead);
  }, [lead]);

  // Fetch discussions when modal opens
  useEffect(() => {
    if (open && lead) {
      setLoading(true);
      setError(null);
      listDiscussions(lead.id)
        .then((data) => {
          setDiscussions(data);
        })
        .catch((err: unknown) => {
          const msg =
            err instanceof Error ? err.message : "Failed to load discussions";
          setError(msg);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setDiscussions([]);
    }
  }, [open, lead?.id]);

  if (!currentLead) return null;

  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (!currentLead || currentLead.status === newStatus) return;

    const previousStatus = currentLead.status;
    const updatedLeadData: Lead = { ...currentLead, status: newStatus };
    setCurrentLead(updatedLeadData);

    try {
      const savedLead = await onOptimisticUpdateLead(
        currentLead.id,
        { status: newStatus },
        () => updateLead(currentLead.id, { status: newStatus })
      );
      setCurrentLead(savedLead);
      toast({
        title: "Status updated",
        description: `Lead status changed to ${newStatus}.`,
        variant: "success",
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to update status";
      // Rollback internal state
      setCurrentLead((prev) =>
        prev ? { ...prev, status: previousStatus } : null
      );
      toast({
        title: "Failed to update status",
        description: msg,
        variant: "destructive",
      });
    }
  };

  const handleDiscussionAdded = (data: AddDiscussionResponse) => {
    // Prepend discussion (newest first)
    setDiscussions((prev) => [data.discussion, ...prev]);
    // Replace lead state locally and in parent list
    setCurrentLead(data.lead);
    onLeadUpdated(data.lead);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Dimmed blurred backdrop overlay */}
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 animate-in fade-in duration-200" />

        {/* Modal content dialog */}
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[94vw] max-w-2xl max-h-[90vh] z-50 glass-dialog p-5 sm:p-7 flex flex-col outline-none animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
          {/* Header with Lead details & Status Select */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10 shrink-0">
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2">
                <Dialog.Title className="text-xl font-bold text-white tracking-tight truncate">
                  {currentLead.name}
                </Dialog.Title>
              </div>

              <div className="flex items-center gap-3 text-xs text-white/60 flex-wrap">
                {currentLead.company && (
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-white/40" />
                    <span>{currentLead.company}</span>
                  </span>
                )}
                {currentLead.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-white/40" />
                    <span>{currentLead.phone}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-center">
              {/* Status Select with optimistic updates */}
              <Select.Root
                value={currentLead.status}
                onValueChange={(val) => handleStatusChange(val as LeadStatus)}
              >
                <Select.Trigger className="glass-input px-3 py-1.5 text-xs flex items-center gap-2 outline-none cursor-pointer">
                  <Select.Value>
                    <StatusBadge status={currentLead.status} size="sm" />
                  </Select.Value>
                  <Select.Icon>
                    <ChevronDown className="w-3.5 h-3.5 text-white/40" />
                  </Select.Icon>
                </Select.Trigger>

                <Select.Portal>
                  <Select.Content
                    position="popper"
                    sideOffset={5}
                    className="glass-dialog z-50 min-w-[180px] p-1.5 shadow-2xl border border-white/20 animate-in fade-in zoom-in-95"
                  >
                    <Select.Viewport className="p-1 flex flex-col gap-1">
                      {STATUSES.map((s) => (
                        <Select.Item
                          key={s}
                          value={s}
                          className="flex items-center justify-between px-3 py-1.5 text-xs text-white rounded-lg cursor-pointer outline-none hover:bg-white/10 focus:bg-white/10"
                        >
                          <Select.ItemText>
                            <StatusBadge status={s} size="sm" />
                          </Select.ItemText>
                          <Select.ItemIndicator>
                            <Check className="w-3.5 h-3.5 text-white/80" />
                          </Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>

              <Dialog.Close asChild>
                <button
                  className="text-white/40 hover:text-white p-1 rounded-full transition-colors ml-1"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* Timeline Body (scrollable newest-first) */}
          <div className="flex-1 overflow-y-auto py-4 min-h-[160px] max-h-[46vh] flex flex-col">
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-white/70 uppercase tracking-wider px-1">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Activity Timeline</span>
            </div>

            {loading ? (
              <div className="flex flex-col gap-3 py-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 animate-pulse flex flex-col gap-2"
                  >
                    <div className="h-3 bg-white/10 rounded w-1/4" />
                    <div className="h-3 bg-white/5 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : discussions.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-white/40">
                <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm font-medium">No discussions logged yet</p>
                <p className="text-xs text-white/30 mt-1 max-w-xs">
                  Record call logs, notes, or next steps using the form below.
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {discussions.map((d) => (
                  <DiscussionItem key={d.id} discussion={d} />
                ))}
              </div>
            )}
          </div>

          {/* Bottom Form */}
          <div className="shrink-0">
            <DiscussionForm
              leadId={currentLead.id}
              onDiscussionAdded={handleDiscussionAdded}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
