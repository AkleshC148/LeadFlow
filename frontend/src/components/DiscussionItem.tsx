import React from "react";
import { Calendar, Clock } from "lucide-react";
import { formatRelativeTime, formatFollowUpDateTime } from "../lib/time";
import { Discussion } from "../lib/types";

interface DiscussionItemProps {
  discussion: Discussion;
}

export function DiscussionItem({ discussion }: DiscussionItemProps) {
  return (
    <div className="relative pl-6 pb-6 last:pb-2 border-l border-white/10 ml-2">
      {/* Timeline indicator node */}
      <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-400 border-2 border-[#0f0e26]" />

      <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 backdrop-blur-sm flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs text-white/50">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatRelativeTime(discussion.created_at)}</span>
          </div>

          {discussion.follow_up_at && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 text-xs">
              <Calendar className="w-3 h-3" />
              <span>Follow-up: {formatFollowUpDateTime(discussion.follow_up_at)}</span>
            </div>
          )}
        </div>

        <p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">
          {discussion.note}
        </p>
      </div>
    </div>
  );
}
