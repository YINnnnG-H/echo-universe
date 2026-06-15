import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DashboardStats, Entry } from "../types";
import { emotionLabel, formatDate, typeLabel } from "../utils/format";

interface CosmicCanvasProps {
  entries: Entry[];
  stats: DashboardStats | null;
  activeTag: string;
  selectedEntry?: Entry | null;
  recentEntryId?: string;
  onSelectTag: (tag: string) => void;
  onSelectEntry: (entry: Entry) => void;
  onDismissDetail: () => void;
}

type StarNode = {
  id: string;
  size: number;
  color: string;
  x: number;
  y: number;
  entry: Entry;
};

const nebulaPalette = ["#7d79b7", "#8daa91", "#b98fa1", "#7fa7c9", "#d4a373", "#93b4d6"];

function polarPosition(index: number, total: number, radius: number, centerX: number, centerY: number, angleOffset = 0) {
  const angle = angleOffset + (Math.PI * 2 * index) / Math.max(total, 1);
  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius
  };
}

function stableSortTags(entries: Entry[], stats: DashboardStats | null) {
  const counts = new Map<string, number>();
  const recency = new Map<string, number>();

  entries.forEach((entry, entryIndex) => {
    entry.tags.forEach((tag, tagIndex) => {
      counts.set(tag, (counts.get(tag) || 0) + 1);
      const score = entryIndex * 10 + tagIndex;
      if (!recency.has(tag) || score < (recency.get(tag) || Number.MAX_SAFE_INTEGER)) {
        recency.set(tag, score);
      }
    });
  });

  const sourceTags = [...new Set((stats?.tags || []).map((item) => item.tag).concat(entries.flatMap((entry) => entry.tags)))];

  return sourceTags
    .map((tag) => ({
      tag,
      count: counts.get(tag) || 1,
      order: recency.get(tag) || Number.MAX_SAFE_INTEGER
    }))
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.order - b.order;
    });
}

export function CosmicCanvas({
  entries,
  stats,
  activeTag,
  selectedEntry,
  recentEntryId,
  onSelectTag,
  onSelectEntry,
  onDismissDetail
}: CosmicCanvasProps) {
  const [showArrival, setShowArrival] = useState(false);
  const latestEntry = entries[0];

  const featuredTags = useMemo(() => {
    const ranked = stableSortTags(entries, stats);
    return ranked.slice(0, 6).map((item) => ({ tag: item.tag, count: item.count }));
  }, [entries, stats]);

  const backgroundStars = useMemo(
    () =>
      Array.from({ length: 96 }, (_, index) => {
        const x = ((index * 37) % 100) + ((index % 3) * 0.7);
        const y = ((index * 29) % 100) + ((index % 5) * 0.5);
        const quietZone = x < 36 && y < 30;
        return {
          id: `bg-${index}`,
          x: quietZone ? x + 28 : x % 100,
          y: y % 100,
          size: 1 + (index % 3),
          delay: (index % 9) * 0.35,
          duration: 2.4 + (index % 7) * 0.6
        };
      }),
    []
  );

  const tagColorMap = useMemo(() => {
    const map = new Map<string, string>();
    featuredTags.forEach((tag, index) => map.set(tag.tag, nebulaPalette[index % nebulaPalette.length]));
    return map;
  }, [featuredTags]);

  const constellations = useMemo(() => {
    return featuredTags.map((tag, index) => {
      const center = polarPosition(index, featuredTags.length, 24, 62, 50, -Math.PI / 5);
      const satellites = entries
        .filter((entry) => entry.tags.includes(tag.tag))
        .slice(0, 5)
        .map((entry, entryIndex, array) => {
          const point = polarPosition(entryIndex, array.length, 8 + entryIndex * 3, center.x, center.y, Math.PI / 6);
          return { ...point, entry };
        });

      return {
        ...center,
        tag,
        color: tagColorMap.get(tag.tag) || nebulaPalette[index % nebulaPalette.length],
        satellites
      };
    });
  }, [entries, featuredTags, tagColorMap]);

  const stars = useMemo<StarNode[]>(() => {
    const centerX = 61;
    const centerY = 52;
    return entries.slice(0, 24).map((entry, index) => {
      const orbit = 15 + (index % 6) * 6 + Math.floor(index / 6) * 6;
      const offset = polarPosition(index, Math.min(entries.length, 24), orbit, centerX, centerY, Math.PI / 7);
      const tone = entry.tags.find((tag) => tagColorMap.has(tag));
      return {
        id: entry.id,
        entry,
        size: 6 + Math.min(entry.tags.length, 5) * 1.8,
        color: tone ? tagColorMap.get(tone) || "#93b4d6" : nebulaPalette[index % nebulaPalette.length],
        x: offset.x,
        y: offset.y
      };
    });
  }, [entries, tagColorMap]);

  const recentTarget = useMemo(() => {
    if (!recentEntryId) {
      return null;
    }

    const star = stars.find((item) => item.id === recentEntryId);
    if (!star) {
      return null;
    }

    const relatedConstellation = constellations.find((constellation) =>
      star.entry.tags.some((tag) => tag === constellation.tag.tag)
    );

    return {
      x: relatedConstellation?.x ?? star.x,
      y: relatedConstellation?.y ?? star.y,
      color: relatedConstellation?.color ?? star.color
    };
  }, [constellations, recentEntryId, stars]);

  useEffect(() => {
    if (!recentTarget) {
      return;
    }

    setShowArrival(true);
    const timer = window.setTimeout(() => setShowArrival(false), 2600);
    return () => window.clearTimeout(timer);
  }, [recentTarget]);

  return (
    <section className="relative min-h-[620px] overflow-hidden rounded-[30px] border border-white/10 bg-[#07111f]/76 shadow-[0_32px_90px_rgba(2,6,16,0.55)] md:min-h-[860px] md:rounded-[40px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(125,121,183,0.18),transparent_26%),radial-gradient(circle_at_20%_70%,rgba(143,170,145,0.16),transparent_24%),radial-gradient(circle_at_75%_35%,rgba(185,143,161,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(127,167,201,0.14),transparent_24%)]" />
      <div className="absolute inset-0 opacity-65 [background-image:radial-gradient(circle_at_center,rgba(255,255,255,0.9)_0.8px,transparent_0.8px)] [background-size:120px_120px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_10%,rgba(8,18,32,0.72),transparent_38%),radial-gradient(circle_at_center,transparent_0%,rgba(7,17,31,0.16)_54%,rgba(2,6,12,0.74)_100%)]" />

      {backgroundStars.map((star) => (
        <motion.span
          key={star.id}
          animate={{ opacity: [0.18, 0.95, 0.36], scale: [0.9, 1.25, 1] }}
          transition={{
            delay: star.delay,
            duration: star.duration,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut"
          }}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            boxShadow: "0 0 12px rgba(255,255,255,0.45)"
          }}
        />
      ))}

      {constellations.map((constellation, index) => (
        <div
          key={constellation.tag.tag}
          className="absolute rounded-full blur-3xl"
          style={{
            left: `${constellation.x - 10}%`,
            top: `${constellation.y - 8}%`,
            width: "190px",
            height: "190px",
            background: `${constellation.color}2d`,
            animation: `floatNebula ${18 + index * 4}s ease-in-out infinite`
          }}
        />
      ))}

      <div className="relative z-10 min-h-[620px] p-4 md:min-h-[860px] md:p-8">
        <div className="pointer-events-none mb-6 max-w-[540px] pt-20 md:mb-8 md:pt-28">
          <p className="text-[11px] uppercase tracking-[0.34em] text-slate-300/60">Private Cosmos</p>
          <h2 className="mt-3 max-w-[88%] text-2xl font-semibold tracking-tight text-white drop-shadow-[0_6px_28px_rgba(3,8,18,0.55)] md:max-w-none md:text-5xl">
            你的每一段记录，都会在这里慢慢长成自己的星群。
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300/80 md:text-base md:leading-7">
            高频关键词成为恒星，相关记录成为它们的卫星，主题在时间里聚成颜色不同的星云。点开一颗星，详情会像从宇宙深处缓慢展开。
          </p>
        </div>

        <div className="pointer-events-none absolute right-4 top-20 z-20 hidden w-[260px] md:right-8 md:top-32 md:block">
          <div className="pointer-events-auto rounded-[24px] border border-white/10 bg-[rgba(8,20,35,0.34)] p-3 backdrop-blur-xl">
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-300/65">Layer Switch</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["星云", "恒星", "卫星", "情绪潮汐"].map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs text-slate-200/78"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {constellations.map((constellation, index) => (
          <div key={constellation.tag.tag}>
            <button
              type="button"
              onClick={() => onSelectTag(constellation.tag.tag)}
              className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full text-left transition ${
                activeTag === constellation.tag.tag ? "scale-110" : "hover:scale-105"
              }`}
              style={{ left: `${constellation.x}%`, top: `${constellation.y}%` }}
            >
              <motion.div
                animate={{
                  scale: [1, 1.05, 0.98, 1.08, 1],
                  opacity: [0.92, 0.78, 0.96, 0.82, 0.92]
                }}
                transition={{
                  duration: 4.8 + index * 0.5,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut"
                }}
                className="rounded-full border border-white/15 shadow-[0_0_32px_rgba(255,255,255,0.1)]"
                style={{
                  width: `${24 + constellation.tag.count * 6}px`,
                  height: `${24 + constellation.tag.count * 6}px`,
                  background: `radial-gradient(circle, #fff6d9 0%, ${constellation.color} 48%, transparent 86%)`
                }}
              />
              <div
                className="mt-2 -ml-6 rounded-full border border-white/10 px-2.5 py-1 text-[10px] backdrop-blur md:mt-3 md:-ml-8 md:px-3 md:py-1.5 md:text-xs"
                style={{
                  background: `${constellation.color}22`,
                  color: "#eef2ff"
                }}
              >
                #{constellation.tag.tag}
              </div>
            </button>

            {constellation.satellites.map((satellite, satelliteIndex) => (
              <div key={`${constellation.tag.tag}-${satellite.entry.id}`}>
                <motion.div
                  animate={{ opacity: [0.18, 0.52, 0.26], scaleX: [0.94, 1.04, 1] }}
                  transition={{
                    duration: 3.6 + satelliteIndex * 0.3,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut"
                  }}
                  className="pointer-events-none absolute z-10 origin-left rounded-full"
                  style={{
                    left: `${constellation.x}%`,
                    top: `${constellation.y}%`,
                    width: `${Math.hypot(satellite.x - constellation.x, satellite.y - constellation.y)}%`,
                    height: "1px",
                    background: `linear-gradient(90deg, ${constellation.color}, transparent)`,
                    transform: `rotate(${Math.atan2(
                      satellite.y - constellation.y,
                      satellite.x - constellation.x
                    )}rad)`,
                    transformOrigin: "0 0"
                  }}
                />
                <motion.button
                  type="button"
                  onClick={() => onSelectEntry(satellite.entry)}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0.55, 1, 0.72, 1], scale: [0.94, 1.08, 1, 0.96] }}
                  transition={{
                    delay: satelliteIndex * 0.06,
                    duration: 3.8 + satelliteIndex * 0.3,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut"
                  }}
                  className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                    selectedEntry?.id === satellite.entry.id ? "scale-125" : ""
                  }`}
                  style={{ left: `${satellite.x}%`, top: `${satellite.y}%`, width: "28px", height: "28px" }}
                >
                  <div
                    className="mx-auto rounded-full border border-white/15 shadow-[0_0_22px_rgba(255,255,255,0.1)]"
                    style={{
                      width: "14px",
                      height: "14px",
                      background: `radial-gradient(circle, #ffffff 0%, ${constellation.color} 58%, transparent 100%)`
                    }}
                  />
                </motion.button>
              </div>
            ))}
          </div>
        ))}

        {stars.map((star, index) => (
          <motion.button
            key={star.id}
            type="button"
            onClick={() => onSelectEntry(star.entry)}
            className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full ${
              selectedEntry?.id === star.id ? "ring-2 ring-white/40" : ""
            }`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: selectedEntry?.id === star.id ? [0.62, 1, 0.8, 1] : [0.22, 0.52, 0.34, 0.62, 0.28],
              scale: selectedEntry?.id === star.id ? [1, 1.22, 1.08, 1.18] : [0.9, 1.08, 0.98, 1.12, 0.92]
            }}
            transition={{
              delay: index * 0.03,
              duration: 4 + (index % 5) * 0.6,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut"
            }}
            style={{ left: `${star.x}%`, top: `${star.y}%`, width: "26px", height: "26px" }}
          >
            <div
              className="mx-auto rounded-full blur-[0.35px]"
              style={{
                width: `${star.size}px`,
                height: `${star.size}px`,
                background: `radial-gradient(circle, #fffdf5 0%, ${star.color} 54%, transparent 100%)`,
                boxShadow: `0 0 18px ${star.color}`
              }}
            />
          </motion.button>
        ))}

        <AnimatePresence>
          {showArrival && recentTarget ? (
            <motion.div
              key={recentEntryId}
              initial={{ left: "18%", top: "82%", scale: 0.45, opacity: 0 }}
              animate={{
                left: `${recentTarget.x}%`,
                top: `${recentTarget.y}%`,
                scale: [0.45, 1.1, 0.9],
                opacity: [0, 1, 0]
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2"
            >
              <div
                className="h-4 w-4 rounded-full"
                style={{
                  background: `radial-gradient(circle, #fffaf1 0%, ${recentTarget.color} 58%, transparent 100%)`,
                  boxShadow: `0 0 24px ${recentTarget.color}`
                }}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {latestEntry ? (
          <motion.article
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 right-4 z-20 hidden max-w-sm rounded-[28px] border border-white/10 bg-[#081423b5] p-5 backdrop-blur-xl xl:block"
          >
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-300/65">Latest Star</p>
            <h3 className="mt-2 text-lg font-semibold text-white">{latestEntry.title || latestEntry.summary}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300/80">{latestEntry.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-slate-200/80">
                {typeLabel(latestEntry.entry_type)}
              </span>
              <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-slate-200/80">
                {formatDate(latestEntry.occurred_at)}
              </span>
            </div>
          </motion.article>
        ) : null}

        <AnimatePresence>
          {selectedEntry ? (
            <motion.aside
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 18 }}
              transition={{ duration: 0.3, ease: [0.2, 1, 0.32, 1] }}
              className="absolute inset-x-3 bottom-3 z-30 rounded-[24px] border border-white/10 bg-[rgba(8,20,35,0.88)] p-4 shadow-[0_28px_80px_rgba(2,6,16,0.36)] backdrop-blur-xl md:inset-x-auto md:right-6 md:top-[26%] md:w-[360px] md:bottom-auto"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-slate-300/60">Stellar Overlay</p>
                  <h3 className="mt-2 text-lg font-semibold text-white md:text-xl">{selectedEntry.title || selectedEntry.summary}</h3>
                </div>
                <button
                  type="button"
                  onClick={onDismissDetail}
                  className="rounded-full border border-white/10 bg-white/6 p-2 text-slate-200/84 transition hover:bg-white/10"
                  aria-label="关闭详情"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span>{typeLabel(selectedEntry.entry_type)}</span>
                <span>·</span>
                <span>{formatDate(selectedEntry.occurred_at)}</span>
                <span>·</span>
                <span>{emotionLabel(selectedEntry.emotion)}</span>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-200/84">{selectedEntry.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedEntry.tags.slice(0, 5).map((tag) => (
                  <span key={tag} className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-slate-200/84">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {Object.entries(selectedEntry.personality_indicators)
                  .sort((a, b) => {
                    const left = typeof a[1] === "boolean" ? (a[1] ? 1 : 0) : a[1];
                    const right = typeof b[1] === "boolean" ? (b[1] ? 1 : 0) : b[1];
                    return right - left;
                  })
                  .slice(0, 4)
                  .map(([key, value]) => {
                    const numeric = typeof value === "boolean" ? (value ? 1 : 0) : value;
                    return (
                      <div key={key} className="rounded-2xl bg-white/6 p-3">
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span className="text-slate-200">{key}</span>
                          <span className="text-slate-300/80">{numeric.toFixed(2)}</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-white/8">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-[#8fb0d6] via-[#b98fa1] to-[#f4d7a1]"
                            style={{ width: `${Math.max(numeric * 100, 10)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </motion.aside>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}
