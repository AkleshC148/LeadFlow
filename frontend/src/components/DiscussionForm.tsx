import React, { useState } from "react";
import { addDiscussion } from "../lib/api";
import { toUtcIso } from "../lib/time";
import { AddDiscussionResponse } from "../lib/types";
import { GlassButton } from "./ui/GlassButton";
import { GlassTextarea } from "./ui/GlassInput";
import { useToast } from "./ui/Toast";
import { Send, Calendar } from "lucide-react";

interface DiscussionFormProps {
  leadId: string;
  onDiscussionAdded: (data: AddDiscussionResponse) => void;
}

export function DiscussionForm({
  leadId,
  onDiscussionAdded,
}: DiscussionFormProps) {
  const [note, setNote] = useState("");
  const [followUpAtLocal, setFollowUpAtLocal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNote = note.trim();
    if (!trimmedNote) {
      setError("Note is required");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const followUpIso = followUpAtLocal ? toUtcIso(followUpAtLocal) : undefined;
      const res = await addDiscussion(leadId, {
        note: trimmedNote,
        follow_up_at: followUpIso,
      });

      onDiscussionAdded(res);
      setNote("");
      setFollowUpAtLocal("");
      toast({
        title: "Discussion added",
        description: "Note saved and lead updated.",
        variant: "success",
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to add discussion";
      setError(msg);
      toast({
        title: "Failed to save note",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 pt-3 border-t border-white/10">
      <div className="flex flex-col gap-1.5">
        <GlassTextarea
          placeholder="Add discussion notes..."
          rows={3}
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            if (error) setError(null);
          }}
          disabled={submitting}
          error={error || undefined}
        />
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-white/40 shrink-0" />
          <input
            type="datetime-local"
            value={followUpAtLocal}
            onChange={(e) => setFollowUpAtLocal(e.target.value)}
            disabled={submitting}
            className="glass-input px-3 py-1.5 text-xs text-white/90 outline-none w-auto"
            title="Set next follow-up date and time"
          />
        </div>

        <GlassButton
          type="submit"
          variant="primary"
          size="sm"
          loading={submitting}
          disabled={submitting || !note.trim()}
        >
          <Send className="w-3.5 h-3.5 mr-1" />
          <span>Save Note</span>
        </GlassButton>
      </div>
    </form>
  );
}
