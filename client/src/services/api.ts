import type { DashboardStats, Entry, EntryDraft } from "../types";

function getApiUrl() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:8787`;
  }

  return "http://localhost:8787";
}

const API_URL = getApiUrl();

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json"
    },
    ...init
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  listEntries: () => request<Entry[]>("/api/entries"),
  createEntry: (payload: EntryDraft) =>
    request<Entry>("/api/entries", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateEntry: (id: string, payload: Partial<EntryDraft>) =>
    request<Entry>(`/api/entries/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  deleteEntry: (id: string) =>
    request<void>(`/api/entries/${id}`, {
      method: "DELETE"
    }),
  getDashboardStats: () => request<DashboardStats>("/api/stats/dashboard")
};
