import type { DashboardStats, Entry, EntryDraft } from "../types";

function getApiUrl() {
  if (import.meta.env.VITE_API_URL) {
    return String(import.meta.env.VITE_API_URL).replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    const isLocalhost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname.endsWith(".local");

    if (isLocalhost) {
      return `${protocol}//${hostname}:8787`;
    }

    return "";
  }

  return "http://localhost:8787";
}

const API_URL = getApiUrl();

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      headers: {
        "Content-Type": "application/json"
      },
      ...init,
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("网络连接超时，请稍后再试");
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
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
