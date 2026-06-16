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
let apiAccessToken = "";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function setApiAccessToken(token?: string) {
  apiAccessToken = token || "";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 15000);

  try {
    const headers = new Headers(init?.headers || {});
    headers.set("Content-Type", "application/json");

    if (apiAccessToken) {
      headers.set("Authorization", `Bearer ${apiAccessToken}`);
    }

    const response = await fetch(`${API_URL}${path}`, {
      headers,
      ...init,
      signal: controller.signal
    });

    if (!response.ok) {
      let message = `Request failed: ${response.status}`;
      const raw = await response.text();

      if (raw) {
        try {
          const payload = JSON.parse(raw) as { message?: string };
          message = payload.message || raw;
        } catch {
          message = raw;
        }
      }

      if (response.status === 401) {
        message = "登录已失效，请重新登录";
      }

      throw new ApiError(message, response.status);
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
  bootstrapAccount: () =>
    request<{ claimed: number }>("/api/account/bootstrap", {
      method: "POST"
    }),
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
