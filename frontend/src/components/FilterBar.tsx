import React from "react";
import { STATUSES, LeadStatus } from "../lib/types";

interface FilterBarProps {
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  countByStatus?: Record<string, number>;
}

export function FilterBar({
  selectedStatus,
  onSelectStatus,
  countByStatus,
}: FilterBarProps) {
  const allFilters: Array<"All" | LeadStatus> = ["All", ...STATUSES];

  return (
    <div className="w-full overflow-x-auto pb-1 no-scrollbar">
      <div className="flex items-center gap-2 min-w-max">
        {allFilters.map((filter) => {
          const isSelected = selectedStatus === filter;
          const count = countByStatus ? countByStatus[filter] : undefined;

          return (
            <button
              key={filter}
              type="button"
              onClick={() => onSelectStatus(filter)}
              className={`px-4 py-2 rounded-full text-xs font-medium cursor-pointer transition-all duration-200 select-none flex items-center gap-2 border ${
                isSelected
                  ? "bg-white/20 text-white border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.2)] backdrop-blur-xl"
                  : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white backdrop-blur-md"
              }`}
            >
              <span>{filter}</span>
              {typeof count === "number" && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected
                      ? "bg-white/30 text-white"
                      : "bg-white/10 text-white/60"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
