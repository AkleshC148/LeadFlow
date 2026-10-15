import { getToken, removeToken } from "./auth";
import {
  AuthResponse,
  CreateLeadPayload,
  Discussion,
  Lead,
  UpdateLeadPayload,
  AddDiscussionPayload,
  AddDiscussionResponse,
  User,
} from "./types";

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

// Waking up server notification listeners
type WakingListener = (isWaking: boolean) => void;
const wakingListeners: Set<WakingListener> = new Set();
let slowRequestCount = 0;

export function onServerWaking(listener: WakingListener): () => void {
  wakingListeners.add(listener);
  return () => {
    wakingListeners.delete(listener);
  };
}

function notifyWaking(isWaking: boolean) {
  wakingListeners.forEach((fn) => {
    try {
      fn(isWaking);
    } catch {
      // ignore listener error
    }
  });
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("leadflow:server-waking", { detail: { waking: isWaking } })
    );
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  headers.set("Content-Type", "application/json");

  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let timerFired = false;
  const timeoutId = setTimeout(() => {
    timerFired = true;
    slowRequestCount += 1;
    notifyWaking(true);
  }, 3000);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (timerFired) {
      slowRequestCount = Math.max(0, slowRequestCount - 1);
      if (slowRequestCount === 0) {
        notifyWaking(false);
      }
    }

    if (!response.ok) {
      let errorMessage = `Request failed (${response.status})`;
      try {
        const errorData = await response.json();
        if (errorData && typeof errorData.detail === "string") {
          errorMessage = errorData.detail;
        } else if (errorData && Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail
            .map((item: { msg?: string }) => item.msg || JSON.stringify(item))
            .join(", ");
        } else if (errorData && typeof errorData.message === "string") {
          errorMessage = errorData.message;
        }
      } catch {
        // Fallback to default message
      }

      if (response.status === 401) {
        removeToken();
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.startsWith("/login") &&
          !window.location.pathname.startsWith("/signup")
        ) {
          window.location.href = "/login";
        }
      }

      throw new Error(errorMessage);
    }

    // For 204 or empty responses
    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (timerFired) {
      slowRequestCount = Math.max(0, slowRequestCount - 1);
      if (slowRequestCount === 0) {
        notifyWaking(false);
      }
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Auth API
export async function signup(payload: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function login(payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function me(): Promise<User> {
  return request<User>("/api/auth/me", {
    method: "GET",
  });
}

// Leads API
export async function listLeads(
  status?: string,
  q?: string
): Promise<Lead[]> {
  const params = new URLSearchParams();
  if (status && status !== "All") {
    params.set("status", status);
  }
  if (q && q.trim()) {
    params.set("q", q.trim());
  }
  const queryString = params.toString();
  const endpoint = queryString ? `/api/leads?${queryString}` : "/api/leads";
  return request<Lead[]>(endpoint, {
    method: "GET",
  });
}

export async function createLead(payload: CreateLeadPayload): Promise<Lead> {
  return request<Lead>("/api/leads", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getLead(id: string): Promise<Lead> {
  return request<Lead>(`/api/leads/${id}`, {
    method: "GET",
  });
}

export async function updateLead(
  id: string,
  payload: UpdateLeadPayload
): Promise<Lead> {
  return request<Lead>(`/api/leads/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// Discussions API
export async function listDiscussions(
  leadId: string
): Promise<Discussion[]> {
  return request<Discussion[]>(`/api/leads/${leadId}/discussions`, {
    method: "GET",
  });
}

export async function addDiscussion(
  leadId: string,
  payload: AddDiscussionPayload
): Promise<AddDiscussionResponse> {
  return request<AddDiscussionResponse>(`/api/leads/${leadId}/discussions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
