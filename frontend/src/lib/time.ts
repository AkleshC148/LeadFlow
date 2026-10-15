import { format, formatDistanceToNow, isToday as dateFnsIsToday, parseISO } from "date-fns";
import { LeadStatus } from "./types";

/**
 * Format relative time for last_discussion_at ("2 hours ago", "—" if none)
 */
export function formatRelativeTime(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  try {
    const date = parseISO(isoString);
    if (isNaN(date.getTime())) return "—";
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return "—";
  }
}

/**
 * Format full date and time for follow_up_at chip
 */
export function formatFollowUpDateTime(isoString: string | null | undefined): string {
  if (!isoString) return "";
  try {
    const date = parseISO(isoString);
    if (isNaN(date.getTime())) return "";
    return format(date, "MMM d, h:mm a");
  } catch {
    return "";
  }
}

/**
 * Check if the date string falls on the user's LOCAL calendar day
 */
export function isFollowUpToday(isoString: string | null | undefined): boolean {
  if (!isoString) return false;
  try {
    const date = parseISO(isoString);
    if (isNaN(date.getTime())) return false;
    return dateFnsIsToday(date);
  } catch {
    return false;
  }
}

/**
 * Check if a lead is overdue:
 * follow_up_at < now, not in the today section, status not Won/Lost
 */
export function isLeadOverdue(
  followUpAt: string | null | undefined,
  status: LeadStatus
): boolean {
  if (!followUpAt) return false;
  if (status === "Won" || status === "Lost") return false;
  if (isFollowUpToday(followUpAt)) return false;

  try {
    const date = parseISO(followUpAt);
    if (isNaN(date.getTime())) return false;
    return date.getTime() < Date.now();
  } catch {
    return false;
  }
}

/**
 * Convert local datetime string (e.g. from input datetime-local: "2026-10-15T15:30")
 * to a UTC ISO-8601 string ending in "Z".
 */
export function toUtcIso(localDatetimeString: string): string {
  if (!localDatetimeString) return "";
  const date = new Date(localDatetimeString);
  return date.toISOString();
}

/**
 * Convert ISO string to input[type="datetime-local"] format: YYYY-MM-DDTHH:mm
 */
export function toInputDateTimeLocal(isoString?: string | null): string {
  const d = isoString ? new Date(isoString) : new Date();
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
