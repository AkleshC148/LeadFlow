"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, Plus, UserPlus, X } from "lucide-react";
import { createLead } from "../lib/api";
import { Lead, LeadStatus, STATUSES } from "../lib/types";
import { StatusBadge } from "./StatusBadge";
import { GlassButton } from "./ui/GlassButton";
import { GlassInput } from "./ui/GlassInput";
import { useToast } from "./ui/Toast";

interface AddLeadDialogProps {
  onLeadCreated: (lead: Lead) => void;
}

export function AddLeadDialog({ onLeadCreated }: AddLeadDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<LeadStatus>("New");
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const { toast } = useToast();

  const resetForm = () => {
    setName("");
    setCompany("");
    setPhone("");
    setStatus("New");
    setNameError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Name is required");
      return;
    }

    setLoading(true);
    setNameError(null);

    try {
      const newLead = await createLead({
        name: trimmedName,
        company: company.trim() || null,
        phone: phone.trim() || null,
        status,
      });

      onLeadCreated(newLead);
      toast({
        title: "Lead created",
        description: `${newLead.name} was successfully added.`,
        variant: "success",
      });
      resetForm();
      setOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create lead";
      toast({
        title: "Error creating lead",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetForm();
      }}
    >
      <Dialog.Trigger asChild>
        <GlassButton variant="primary" size="md">
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Add Lead</span>
        </GlassButton>
      </Dialog.Trigger>

      <Dialog.Portal>
        {/* Dimmed, blurred overlay */}
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 animate-in fade-in duration-200" />

        {/* Modal content */}
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-md z-50 glass-dialog p-6 sm:p-8 outline-none animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-semibold text-white tracking-tight">
                  Add New Lead
                </Dialog.Title>
                <Dialog.Description className="text-xs text-white/50">
                  Track a new contact and manage their journey.
                </Dialog.Description>
              </div>
            </div>

            <Dialog.Close asChild>
              <button
                className="text-white/40 hover:text-white p-1 rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <GlassInput
              label="Name *"
              placeholder="e.g. Sarah Connor"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(null);
              }}
              error={nameError || undefined}
              disabled={loading}
              autoFocus
            />

            <GlassInput
              label="Company"
              placeholder="e.g. Cyberdyne Systems"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              disabled={loading}
            />

            <GlassInput
              label="Phone"
              placeholder="e.g. +1 555-0199"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
            />

            {/* Radix Status Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-white/80 tracking-wide">
                Status
              </label>
              <Select.Root
                value={status}
                onValueChange={(val) => setStatus(val as LeadStatus)}
                disabled={loading}
              >
                <Select.Trigger className="glass-input px-4 py-2.5 text-sm flex items-center justify-between outline-none cursor-pointer">
                  <Select.Value>
                    <StatusBadge status={status} size="sm" />
                  </Select.Value>
                  <Select.Icon>
                    <ChevronDown className="w-4 h-4 text-white/50" />
                  </Select.Icon>
                </Select.Trigger>

                <Select.Portal>
                  <Select.Content
                    position="popper"
                    sideOffset={5}
                    className="glass-dialog z-50 min-w-[200px] p-1.5 shadow-2xl border border-white/20 animate-in fade-in zoom-in-95"
                  >
                    <Select.Viewport className="p-1 flex flex-col gap-1">
                      {STATUSES.map((s) => (
                        <Select.Item
                          key={s}
                          value={s}
                          className="flex items-center justify-between px-3 py-2 text-xs text-white rounded-lg cursor-pointer outline-none hover:bg-white/10 focus:bg-white/10"
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
            </div>

            <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-white/10">
              <Dialog.Close asChild>
                <GlassButton
                  type="button"
                  variant="ghost"
                  size="md"
                  disabled={loading}
                >
                  Cancel
                </GlassButton>
              </Dialog.Close>

              <GlassButton
                type="submit"
                variant="primary"
                size="md"
                loading={loading}
                disabled={loading}
              >
                Create Lead
              </GlassButton>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
