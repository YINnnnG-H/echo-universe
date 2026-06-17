import type { Session } from "@supabase/supabase-js";
import { startTransition, useEffect, useMemo, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { AuthScreen } from "./components/AuthScreen";
import { Header } from "./components/Header";
import { AdminPage } from "./pages/AdminPage";
import { InsightsPage } from "./pages/InsightsPage";
import { NewEntryPage } from "./pages/NewEntryPage";
import { TimelinePage } from "./pages/TimelinePage";
import { ApiError, api, setApiAccessToken } from "./services/api";
import { supabase } from "./services/supabase";
import type { DashboardStats, Entry } from "./types";
import { ENTRY_TYPE_LABELS } from "./utils/constants";

function getAdminEmails() {
  return (import.meta.env.VITE_ADMIN_EMAILS || "")
    .split(",")
    .map((item: string) => item.trim().toLowerCase())
    .filter(Boolean);
}

export default function App() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [search, setSearch] = useState("");
  const [recentEntryId, setRecentEntryId] = useState<string>();
  const [loadError, setLoadError] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(false);

  const isAdmin = Boolean(session?.user.email && getAdminEmails().includes(session.user.email.toLowerCase()));

  async function loadAll() {
    setLoadError("");
    const [entryList, dashboardStats] = await Promise.all([api.listEntries(), api.getDashboardStats()]);
    startTransition(() => {
      setEntries(entryList);
      setStats(dashboardStats);
    });
  }

  async function refreshAfterSave(entry?: Entry) {
    await loadAll();
    if (entry) {
      setRecentEntryId(entry.id);
    }
  }

  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) {
          return;
        }

        if (error) {
          console.error(error);
        }

        setSession(data.session);
        setApiAccessToken(data.session?.access_token);
        setIsAuthReady(true);
      })
      .catch((error) => {
        console.error(error);
        if (active) {
          setIsAuthReady(true);
        }
      });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setApiAccessToken(nextSession?.access_token);
      setIsAuthReady(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    if (!session) {
      setApiAccessToken("");
      setEntries([]);
      setStats(null);
      setRecentEntryId(undefined);
      setLoadError("");
      setIsWorkspaceLoading(false);
      return;
    }

    let cancelled = false;

    async function initializeWorkspace() {
      setIsWorkspaceLoading(true);
      setLoadError("");

      try {
        await api.bootstrapAccount();
        if (cancelled) {
          return;
        }
        await loadAll();
      } catch (error) {
        console.error(error);

        if (cancelled) {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          await supabase.auth.signOut();
          return;
        }

        setLoadError(error instanceof Error ? error.message : "加载失败，请稍后再试");
      } finally {
        if (!cancelled) {
          setIsWorkspaceLoading(false);
        }
      }
    }

    initializeWorkspace();

    return () => {
      cancelled = true;
    };
  }, [isAuthReady, session?.access_token]);

  const filteredEntries = useMemo(() => {
    if (!search.trim()) {
      return entries;
    }

    const keyword = search.trim().toLowerCase();

    return entries
      .map((entry) => {
        let score = 0;

        const title = entry.title.toLowerCase();
        const summary = entry.summary.toLowerCase();
        const rawText = entry.raw_text.toLowerCase();
        const tags = entry.tags.map((tag) => tag.toLowerCase());
        const indicators = Object.keys(entry.personality_indicators).map((key) => key.toLowerCase());
        const contexts = [
          entry.context.subject,
          entry.context.creator,
          entry.context.location,
          entry.context.companions,
          entry.context.body_state
        ]
          .filter(Boolean)
          .map((item) => String(item).toLowerCase());
        const typeLabel = ENTRY_TYPE_LABELS[entry.entry_type].toLowerCase();
        const dateLabel = new Date(entry.occurred_at).toISOString().slice(0, 10);

        if (title.includes(keyword)) score += 9;
        if (summary.includes(keyword)) score += 6;
        if (tags.some((tag) => tag.includes(keyword))) score += 8;
        if (contexts.some((item) => item.includes(keyword))) score += 7;
        if (indicators.some((item) => item.includes(keyword))) score += 5;
        if (rawText.includes(keyword)) score += 4;
        if (typeLabel.includes(keyword) || entry.entry_type.includes(keyword)) score += 4;
        if (entry.emotion.includes(keyword) || dateLabel.includes(keyword)) score += 2;

        return { entry, score };
      })
      .filter((item) => item.score > 0)
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }
        return new Date(right.entry.occurred_at).getTime() - new Date(left.entry.occurred_at).getTime();
      })
      .map((item) => item.entry);
  }, [entries, search]);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
    } finally {
      setIsSigningOut(false);
    }
  }

  if (!isAuthReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030812] text-white">
        <div className="rounded-[28px] border border-white/10 bg-white/6 px-6 py-5 text-sm text-slate-200/82 backdrop-blur-xl">
          正在校准你的宇宙入口...
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-[#030812] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(125,121,183,0.18),transparent_30%),radial-gradient(circle_at_20%_70%,rgba(141,170,145,0.14),transparent_24%),radial-gradient(circle_at_85%_25%,rgba(185,143,161,0.16),transparent_26%),linear-gradient(180deg,#040914_0%,#07111f_42%,#0a1627_100%)]" />
      <Header
        search={search}
        onSearchChange={setSearch}
        resultCount={filteredEntries.length}
        userEmail={session.user.email}
        isAdmin={isAdmin}
        onSignOut={handleSignOut}
        isSigningOut={isSigningOut}
      />
      <main className="relative mx-auto max-w-7xl px-4 pb-28 pt-6 md:px-6 md:pb-12">
        {isWorkspaceLoading ? (
          <div className="mb-4 rounded-[24px] border border-white/10 bg-white/8 px-4 py-3 text-sm text-slate-100/82 backdrop-blur">
            正在同步你的私人星图与历史档案...
          </div>
        ) : null}
        {loadError ? (
          <div className="mb-4 rounded-[24px] border border-amber-200/20 bg-amber-100/10 px-4 py-3 text-sm text-amber-50 backdrop-blur">
            当前云端服务读取失败：{loadError}
          </div>
        ) : null}
        <Routes>
          <Route
            path="/"
            element={
              <TimelinePage
                entries={filteredEntries}
                stats={stats}
                onRefresh={refreshAfterSave}
                recentEntryId={recentEntryId}
              />
            }
          />
          <Route path="/insights" element={<InsightsPage stats={stats} />} />
          <Route path="/admin" element={<AdminPage isAdmin={isAdmin} />} />
          <Route path="/new" element={<NewEntryPage onRefresh={refreshAfterSave} />} />
        </Routes>
      </main>
    </div>
  );
}
