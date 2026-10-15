// API Contract Types - Single Source of Truth

export type LeadStatus =
  | "New"
  | "Contacted"
  | "Qualified"
  | "Proposal Sent"
  | "Won"
  | "Lost";

export const STATUSES: readonly LeadStatus[] = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Won",
  "Lost",
] as const;

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Lead {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  status: LeadStatus;
  follow_up_at: string | null;
  last_note: string | null;
  last_discussion_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Discussion {
  id: string;
  lead_id: string;
  note: string;
  follow_up_at: string | null;
  created_at: string;
}

export interface CreateLeadPayload {
  name: string;
  company?: string | null;
  phone?: string | null;
  status?: LeadStatus;
}

export interface UpdateLeadPayload {
  status?: LeadStatus;
  name?: string;
  company?: string | null;
  phone?: string | null;
  follow_up_at?: string | null;
}

export interface AddDiscussionPayload {
  note: string;
  follow_up_at?: string | null;
}

export interface AddDiscussionResponse {
  discussion: Discussion;
  lead: Lead;
}

export interface ApiErrorResponse {
  detail: string;
}
