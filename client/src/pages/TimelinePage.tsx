import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { BottomNav } from "../components/BottomNav";
import { CosmicCanvas } from "../components/CosmicCanvas";
import { CosmicDetailPanel } from "../components/CosmicDetailPanel";
import { EntryForm } from "../components/EntryForm";
import { MoonPhase } from "../components/MoonPhase";
import { ObservationDeck } from "../components/ObservationDeck";
import { QuoteCard } from "../components/QuoteCard";
import { api } from "../services/api";
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
  { id: "write", label: "写下星星", description: "直接进入记录与补全" }
];

export function TimelinePage({ entries, stats, onRefresh, recentEntryId }: TimelinePageProps) {
  const [activeTag, setActiveTag] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [selectedEntrySource, setSelectedEntrySource] = useState<"canvas" | "archive" | null>(null);
  const [homeMode, setHomeMode] = useState<HomeMode>("nebula");
  const [isUniverseExpanded, setIsUniverseExpanded] = useState(false);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);
  const universeSectionRef = useRef<HTMLDivElement | null>(null);

  const filteredEntries = useMemo(() => {
    if (!activeTag) {
      return entries;
    }
    return entries.filter((entry) => entry.tags.includes(activeTag));
  }, [activeTag, entries]);

  const topTags = useMemo(() => (stats?.tags || []).slice(0, 3), [stats]);

  useEffect(() => {
    if (filteredEntries.length === 0) {
      setSelectedEntry(null);
      setSelectedEntrySource(null);
      return;
    }

    if (recentEntryId) {
      const recent =
        filteredEntries.find((entry) => entry.id === recentEntryId) || entries.find((entry) => entry.id === recentEntryId);
      if (recent) {
        setSelectedEntry(null);
        setSelectedEntrySource(null);
        setHomeMode("nebula");
        return;
      }
    }

    if (selectedEntry && !filteredEntries.some((entry) => entry.id === selectedEntry.id)) {
      setSelectedEntry(null);
      setSelectedEntrySource(null);
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

  useEffect(() => {
    if (!recentEntryId) {
      return;
    }

    const timer = window.setTimeout(() => {
      universeSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 180);

    return () => {
      window.clearTimeout(timer);
    };
  }, [recentEntryId]);

  async function handleDeleteEntry(entry: Entry) {
    if (deletingEntryId) {
      return;
    }

    const confirmed =
      typeof window === "undefined"
        ? true
        : window.confirm(`确认删除这颗星吗？\n\n${entry.title || entry.summary}\n\n删除后将无法恢复。`);

    if (!confirmed) {
      return;
    }

    setDeletingEntryId(entry.id);

    try {
      await api.deleteEntry(entry.id);
      setSelectedEntry(null);
      setSelectedEntrySource(null);
      await onRefresh();
    } finally {
      setDeletingEntryId(null);
    }
  }

  return (
    <div className="relative pb-28 pt-[17rem] md:pt-[15.5rem]">
      <section className="relative mb-8 grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_320px]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="cosmos-camera relative overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(145deg,rgba(10,18,34,0.92),rgba(5,12,24,0.78))] p-6 shadow-[0_30px_100px_rgba(2,6,16,0.32)] backdrop-blur-2xl md:p-8"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(143,176,214,0.12),transparent_20%),radial-gradient(circle_at_82%_20%,rgba(244,215,161,0.12),transparent_22%)]" />
          <div className="pointer-events-none cosmos-parallax-slow absolute -left-12 top-6 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(143,176,214,0.18),rgba(143,176,214,0))] blur-3xl" />
          <div className="pointer-events-none cosmos-parallax-reverse absolute right-0 top-0 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(244,215,161,0.14),rgba(244,215,161,0))] blur-3xl" />
          <div className="pointer-events-none absolute inset-x-8 bottom-10 h-px bg-gradient-to-r from-transparent via-white/16 to-transparent" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-300/72">
              <Sparkles size={14} />
              Private Cosmos Archive
            </div>

            <h2 className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight text-white md:text-5xl md:leading-[1.08]">
              你的记录，不再只是笔记。
              <br />
              它们会在深空里长成星群。
            </h2>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300/78 md:text-[15px]">
              每一次反思、听播客、看展、听音乐、运动或对话之后留下的文字，都会被送进一座活体宇宙档案馆。主题会聚成星云，关键词会点亮成恒星，细微的波动则留下自己的轨道。
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {topTags.length > 0 ? (
                topTags.map((tag) => (
                  <button
                    key={tag.tag}
                    type="button"
                    onClick={() => {
                      setActiveTag((current) => (current === tag.tag ? "" : tag.tag));
                      setHomeMode("nebula");
                    }}
                    className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm text-slate-200/84 transition hover:bg-white/12"
                  >
                    #{tag.tag} · {tag.count}
                  </button>
                ))
              ) : (
                <div className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm text-slate-200/80">
                  写下第一颗星，宇宙就会开始回应你。
                </div>
              )}
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-white/8 bg-white/6 p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Stellar Count</p>
                <p className="mt-2 text-3xl font-semibold text-white">{entries.length}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300/74">已经归档的星体数量，会继续随着你的生活变多。</p>
              </div>

              <div className="rounded-[24px] border border-white/8 bg-white/6 p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Nebula Density</p>
                <p className="mt-2 text-3xl font-semibold text-white">{stats?.tags.length || 0}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300/74">当前宇宙里可见的主题星云数，会随着回声逐渐长出层次。</p>
              </div>

              <div className="rounded-[24px] border border-white/8 bg-white/6 p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Live Signal</p>
                <p className="mt-2 text-base font-semibold text-white">{stats?.weeklySummary || "等待新的星体信号出现。"}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.58, delay: 0.06, ease: "easeOut" }}
          className="space-y-4"
        >
          <MoonPhase />
          <div className="cosmos-camera relative overflow-hidden rounded-[28px] border border-white/10 bg-[rgba(8,20,35,0.7)] p-4 shadow-[0_22px_70px_rgba(2,6,16,0.26)] backdrop-blur-2xl">
            <div className="pointer-events-none cosmos-parallax-slow absolute -right-6 top-0 h-20 w-20 rounded-full bg-[radial-gradient(circle,rgba(244,215,161,0.14),rgba(244,215,161,0))] blur-2xl" />
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-300/60">Entry Ritual</p>
            <h3 className="mt-2 text-lg font-semibold text-white">新星将如何诞生</h3>
            <p className="mt-3 text-sm leading-7 text-slate-300/78">
              当你点亮一颗星，它会先在书写仪式里聚光，然后以流星轨迹飞入对应星云。若是全新主题，它会自己点亮一团新的星云核。
            </p>
          </div>
        </motion.div>
      </section>

      <div ref={universeSectionRef} className="relative">
        <CosmicCanvas
          entries={entries}
          stats={stats}
          activeTag={activeTag}
          selectedEntry={selectedEntry}
          deletingEntryId={deletingEntryId}
          showDetailOverlay={selectedEntrySource === "canvas"}
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
            setSelectedEntrySource("canvas");
            setHomeMode("nebula");
          }}
          onDismissDetail={() => {
            setSelectedEntry(null);
            setSelectedEntrySource(null);
          }}
          onDeleteEntry={handleDeleteEntry}
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-30 hidden justify-center lg:flex">
          <div className="cosmos-camera pointer-events-auto relative flex items-center gap-2 overflow-hidden rounded-full border border-white/10 bg-[rgba(8,20,35,0.6)] p-2 shadow-[0_24px_70px_rgba(2,6,16,0.3)] backdrop-blur-xl">
            <div className="pointer-events-none cosmos-parallax-slow absolute left-[10%] top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(143,176,214,0.16),rgba(143,176,214,0))] blur-2xl" />
            <div className="pointer-events-none cosmos-parallax-reverse absolute right-[8%] top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(244,215,161,0.16),rgba(244,215,161,0))] blur-2xl" />
            {homeModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setHomeMode(mode.id)}
                className={`relative rounded-full px-4 py-2 text-sm transition ${
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
            className="fixed inset-0 z-[70] bg-[rgba(2,6,16,0.9)] p-3 backdrop-blur-xl md:p-6"
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
                  deletingEntryId={deletingEntryId}
                  showDetailOverlay={selectedEntrySource === "canvas"}
                  recentEntryId={recentEntryId}
                  viewMode="expanded"
                  onSelectTag={(tag) => setActiveTag((current) => (current === tag ? "" : tag))}
                  onSelectEntry={(entry) => {
                    setSelectedEntry(entry);
                    setSelectedEntrySource("canvas");
                  }}
                  onDismissDetail={() => {
                    setSelectedEntry(null);
                    setSelectedEntrySource(null);
                  }}
                  onDeleteEntry={handleDeleteEntry}
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
              <CosmicDetailPanel
                entry={selectedEntry || undefined}
                isDeleting={selectedEntry ? deletingEntryId === selectedEntry.id : false}
                onDelete={handleDeleteEntry}
              />
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
                      onClick={() => {
                        setSelectedEntry(entry);
                        setSelectedEntrySource("archive");
                      }}
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
              <CosmicDetailPanel
                entry={selectedEntry || undefined}
                isDeleting={selectedEntry ? deletingEntryId === selectedEntry.id : false}
                onDelete={handleDeleteEntry}
              />
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
