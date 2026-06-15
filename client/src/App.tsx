import { useEffect, useMemo, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { Header } from "./components/Header";
import { InsightsPage } from "./pages/InsightsPage";
import { NewEntryPage } from "./pages/NewEntryPage";
import { TimelinePage } from "./pages/TimelinePage";
import { api } from "./services/api";
import type { DashboardStats, Entry } from "./types";

export default function App() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [search, setSearch] = useState("");
  const [recentEntryId, setRecentEntryId] = useState<string>();

  async function loadAll() {
    const [entryList, dashboardStats] = await Promise.all([api.listEntries(), api.getDashboardStats()]);
    setEntries(entryList);
    setStats(dashboardStats);
  }

  async function refreshAfterSave(entry?: Entry) {
    await loadAll();
    if (entry) {
      setRecentEntryId(entry.id);
    }
  }

  useEffect(() => {
    loadAll().catch((error) => console.error(error));
  }, []);

  const filteredEntries = useMemo(() => {
    if (!search.trim()) {
      return entries;
    }

    const keyword = search.trim().toLowerCase();
    return entries.filter((entry) =>
      [
        entry.title,
        entry.raw_text,
        entry.summary,
        entry.emotion,
        entry.context.subject,
        entry.context.creator,
        entry.context.location,
        entry.context.companions,
        ...entry.tags
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [entries, search]);

  async function handleDelete(entry: Entry) {
    const confirmed = window.confirm(`确定删除这条记录吗？\n\n${entry.title || entry.summary}`);
    if (!confirmed) {
      return;
    }

    await api.deleteEntry(entry.id);
    await loadAll();
  }

  return (
    <div className="min-h-screen bg-[#030812] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(125,121,183,0.18),transparent_30%),radial-gradient(circle_at_20%_70%,rgba(141,170,145,0.14),transparent_24%),radial-gradient(circle_at_85%_25%,rgba(185,143,161,0.16),transparent_26%),linear-gradient(180deg,#040914_0%,#07111f_42%,#0a1627_100%)]" />
      <Header search={search} onSearchChange={setSearch} />
      <main className="relative mx-auto max-w-7xl px-4 pb-28 pt-6 md:px-6 md:pb-12">
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
          <Route path="/new" element={<NewEntryPage onRefresh={refreshAfterSave} />} />
        </Routes>
      </main>
    </div>
  );
}
