import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BottomNav } from "../components/BottomNav";
import { CosmicCanvas } from "../components/CosmicCanvas";
import { CosmicDetailPanel } from "../components/CosmicDetailPanel";
import { EntryForm } from "../components/EntryForm";
import { MoonPhase } from "../components/MoonPhase";
import { ObservationDeck } from "../components/ObservationDeck";
import { QuoteCard } from "../components/QuoteCard";
import type { DashboardStats, Entry } from "../types";

interface TimelinePageProps {
  entries: Entry[];
  stats: DashboardStats | null;
  onRefresh: (entry?: Entry) => Promise<void>;
  recentEntryId?: string;
}

type HomeMode = "nebula" | "observe" | "write";

const homeModes: Array<{ id: HomeMode; label: string; description: string }> = [
  { id: "nebula", label: "星云", description: "查看星体详情与回声档案" },
  { id: "observe", label: "观星", description: "查看主题、类型与信号摘要" },
  { id: "write", label: "写下星星", description: "直接进入记录与补充" }
];

export function TimelinePage({ entries, stats, onRefresh, recentEntryId }: TimelinePageProps) {
  const [activeTag, setActiveTag] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [homeMode, setHomeMode] = useState<HomeMode>("nebula");
  const [isUniverseExpanded, setIsUniverseExpanded] = useState(false);

  const filteredEntries = useMemo(() => {
    if (!activeTag) {
      return entries;
    }
    return entries.filter((entry) => entry.tags.includes(activeTag));
  }, [activeTag, entries]);

  useEffect(() => {
    if (filteredEntries.length === 0) {
      setSelectedEntry(null);
      return;
    }

    if (recentEntryId) {
      const recent =
        filteredEntries.find((entry) => entry.id === recentEntryId) || entries.find((entry) => entry.id === recentEntryId);
      if (recent) {
        setSelectedEntry(null);
        setHomeMode("nebula");
        return;
      }
    }

    if (selectedEntry && !filteredEntries.some((entry) => entry.id === selectedEntry.id)) {
      setSelectedEntry(null);
    }
  }, [entries, filteredEntries, recentEntryId, selectedEntry]);

  useEffect(() => {
    if (!isUniverseExpanded) {
      return;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isUniverseExpanded]);

  return (
    <div className="relative pb-28 pt-[19rem] md:pt-[18rem]">
      <div className="mb-8 flex justify-end">
        <div className="relative z-30 w-full max-w-[280px]">
          <MoonPhase />
        </div>
      </div>

      <div className="relative">
        <CosmicCanvas
          entries={entries}
          stats={stats}
          activeTag={activeTag}
          selectedEntry={selectedEntry}
          recentEntryId={recentEntryId}
          viewMode="compact"
          showExpandButton
          onRequestExpand={() => setIsUniverseExpanded(true)}
          onSelectTag={(tag) => {
            setActiveTag((current) => (current === tag ? "" : tag));
            setHomeMode("nebula");
          }}
          onSelectEntry={(entry) => {
            setSelectedEntry(entry);
            setHomeMode("nebula");
          }}
          onDismissDetail={() => setSelectedEntry(null)}
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-30 hidden justify-center lg:flex">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/10 bg-[rgba(8,20,35,0.58)] p-2 shadow-[0_24px_70px_rgba(2,6,16,0.28)] backdrop-blur-xl">
            {homeModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setHomeMode(mode.id)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  homeMode === mode.id
                    ? "bg-[#f4d7a1]/18 text-[#f6e8ca] shadow-[0_0_20px_rgba(244,215,161,0.16)]"
                    : "text-slate-300/78 hover:bg-white/10"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isUniverseExpanded ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-[rgba(2,6,16,0.88)] p-3 backdrop-blur-xl md:p-6"
          >
            <div className="flex h-full flex-col">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-slate-300/60">Expanded Cosmos</p>
                  <h2 className="mt-1 text-lg font-semibold text-white md:text-2xl">放大宇宙观测窗</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUniverseExpanded(false)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/12"
                >
                  <X size={16} />
                  关闭
                </button>
              </div>

              <div className="min-h-0 flex-1">
                <CosmicCanvas
                  entries={entries}
                  stats={stats}
                  activeTag={activeTag}
                  selectedEntry={selectedEntry}
                  recentEntryId={recentEntryId}
                  viewMode="expanded"
                  onSelectTag={(tag) => setActiveTag((current) => (current === tag ? "" : tag))}
                  onSelectEntry={setSelectedEntry}
                  onDismissDetail={() => setSelectedEntry(null)}
                />
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="mt-4 text-sm text-slate-300/72 lg:hidden">
        {homeModes.find((mode) => mode.id === homeMode)?.description}
      </div>

      <div className="mt-6 lg:fixed lg:bottom-8 lg:left-6 lg:z-30 lg:mt-0">
        <QuoteCard latestEntry={entries[0]} />
      </div>

      <div className="mt-8 grid gap-6 2xl:grid-cols-[minmax(0,1fr)_380px]">
        {homeMode === "nebula" ? (
          <>
            <div className="space-y-6">
              <CosmicDetailPanel entry={selectedEntry || undefined} />
              <section className="rounded-[32px] border border-white/10 bg-white/6 p-4 backdrop-blur-xl">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-slate-300/60">Stellar Archive</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">星体档案</h2>
                  </div>
                  {activeTag ? (
                    <button
                      type="button"
                      onClick={() => setActiveTag("")}
                      className="rounded-full border border-white/10 bg-white/8 px-3 py-2 text-xs text-slate-200/80"
                    >
                      清除筛选 #{activeTag}
                    </button>
                  ) : null}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {filteredEntries.slice(0, 8).map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setSelectedEntry(entry)}
                      className={`rounded-[24px] border p-4 text-left transition ${
                        selectedEntry?.id === entry.id
                          ? "border-white/20 bg-[#13253c]"
                          : "border-white/8 bg-[#0b1728]/85 hover:border-white/16 hover:bg-[#10213a]"
                      }`}
                    >
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{entry.title || entry.summary}</p>
                      <p className="mt-3 text-sm leading-6 text-slate-200/86">{entry.summary}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {entry.tags.slice(0, 4).map((tag) => (
                          <span key={tag} className="rounded-full bg-white/8 px-2.5 py-1 text-xs text-slate-300/80">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <div className="2xl:sticky 2xl:top-28 2xl:self-start">
              <EntryForm editingEntry={selectedEntry} onSaved={onRefresh} />
            </div>
          </>
        ) : null}

        {homeMode === "observe" ? (
          <>
            <ObservationDeck stats={stats} entries={filteredEntries} />
            <div className="2xl:sticky 2xl:top-28 2xl:self-start">
              <CosmicDetailPanel entry={selectedEntry || undefined} />
            </div>
          </>
        ) : null}

        {homeMode === "write" ? (
          <>
            <section className="rounded-[32px] border border-white/10 bg-white/6 p-5 backdrop-blur-xl">
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-300/60">Writing Ritual</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">写下今天的一颗星</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300/76">
                从标题、类型、时间、情绪和身体感受开始，慢慢把这一刻放进你的宇宙。保存后，它会自动生成一颗新星并飞入对应的星云。
              </p>
            </section>
            <div className="2xl:sticky 2xl:top-28 2xl:self-start">
              <EntryForm onSaved={onRefresh} />
            </div>
          </>
        ) : null}
      </div>

      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
