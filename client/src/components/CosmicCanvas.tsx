import { AnimatePresence, motion } from "framer-motion";
import { Maximize2, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DashboardStats, Entry } from "../types";
import { emotionLabel, formatDate, typeLabel } from "../utils/format";

interface CosmicCanvasProps {
  entries: Entry[];
  stats: DashboardStats | null;
  activeTag: string;
  selectedEntry?: Entry | null;
  showDetailOverlay?: boolean;
  recentEntryId?: string;
  viewMode?: "compact" | "expanded";
  showExpandButton?: boolean;
  onSelectTag: (tag: string) => void;
  onSelectEntry: (entry: Entry) => void;
  onDismissDetail: () => void;
  onRequestExpand?: () => void;
}

type StarNode = {
  id: string;
  size: number;
  color: string;
  x: number;
  y: number;
  entry: Entry;
};

type SpatialPoint = {
  x: number;
  y: number;
  color: string;
};

const nebulaPalette = ["#7d79b7", "#8daa91", "#b98fa1", "#7fa7c9", "#d4a373", "#93b4d6"];
const archetypeKeys = new Set(["孤儿原型", "战士原型", "疗愈者原型", "女王原型", "智者原型", "寻找者原型"]);

function polarPosition(index: number, total: number, radius: number, centerX: number, centerY: number, angleOffset = 0) {
  const angle = angleOffset + (Math.PI * 2 * index) / Math.max(total, 1);
  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius
  };
}

function clampRange(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
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
  showDetailOverlay = true,
  recentEntryId,
  viewMode = "compact",
  showExpandButton = false,
  onSelectTag,
  onSelectEntry,
  onDismissDetail,
  onRequestExpand
}: CosmicCanvasProps) {
  const [showArrival, setShowArrival] = useState(false);
  const [isLatestPreviewExpanded, setIsLatestPreviewExpanded] = useState(false);
  const isExpanded = viewMode === "expanded";
  const latestEntry = entries[0];

  const featuredTags = useMemo(() => {
    const ranked = stableSortTags(entries, stats);
    return ranked.slice(0, isExpanded ? 8 : 4).map((item) => ({ tag: item.tag, count: item.count }));
  }, [entries, isExpanded, stats]);

  const compactHeight = useMemo(
    () => clampRange(460 + featuredTags.length * 40 + entries.length * 24, 540, 920),
    [entries.length, featuredTags.length]
  );
  const expandedHeight = useMemo(
    () => clampRange(620 + featuredTags.length * 30 + entries.length * 18, 700, 1060),
    [entries.length, featuredTags.length]
  );
  const sectionHeightStyle = isExpanded
    ? { height: `min(${expandedHeight}px, calc(100vh - 170px))`, minHeight: "700px" }
    : { minHeight: `${compactHeight}px` };

  const backgroundStars = useMemo(
    () =>
      Array.from({ length: isExpanded ? 132 : 80 }, (_, index) => {
        const x = ((index * 37) % 100) + ((index % 3) * 0.7);
        const y = ((index * 29) % 100) + ((index % 5) * 0.5);
        const quietZone = x < 34 && y < 28;
        return {
          id: `bg-${index}`,
          x: quietZone ? x + 28 : x % 100,
          y: y % 100,
          size: 1 + (index % 3),
          delay: (index % 9) * 0.35,
          duration: 2.4 + (index % 7) * 0.6
        };
      }),
    [isExpanded]
  );

  const deepFieldStars = useMemo(
    () =>
      Array.from({ length: isExpanded ? 42 : 24 }, (_, index) => ({
        id: `deep-${index}`,
        x: (index * 17.8) % 100,
        y: (index * 23.4 + 11) % 100,
        width: 44 + (index % 5) * 18,
        angle: -12 + (index % 7) * 7,
        delay: index * 0.12
      })),
    [isExpanded]
  );

  const dustClouds = useMemo(
    () =>
      Array.from({ length: isExpanded ? 8 : 5 }, (_, index) => ({
        id: `dust-${index}`,
        x: 10 + ((index * 19) % 76),
        y: 14 + ((index * 15) % 64),
        size: (isExpanded ? 250 : 190) + (index % 3) * (isExpanded ? 56 : 36),
        opacity: 0.08 + (index % 4) * 0.03,
        warm: index % 2 === 1
      })),
    [isExpanded]
  );

  const orbitBands = useMemo(
    () =>
      Array.from({ length: isExpanded ? 4 : 3 }, (_, index) => ({
        id: `ring-${index}`,
        width: 40 + index * (isExpanded ? 16 : 14),
        height: 24 + index * (isExpanded ? 12 : 10),
        opacity: 0.08 - index * 0.014
      })),
    [isExpanded]
  );

  const tagColorMap = useMemo(() => {
    const map = new Map<string, string>();
    featuredTags.forEach((tag, index) => map.set(tag.tag, nebulaPalette[index % nebulaPalette.length]));
    return map;
  }, [featuredTags]);

  const constellations = useMemo(() => {
    if (featuredTags.length === 0) {
      return [];
    }

    return featuredTags.map((tag, index) => {
      const center = polarPosition(index, featuredTags.length, isExpanded ? 26 : 20, 61, 52, -Math.PI / 5);
      const satellites = entries
        .filter((entry) => entry.tags.includes(tag.tag))
        .slice(0, isExpanded ? 6 : 3)
        .map((entry, entryIndex, array) => {
          const point = polarPosition(
            entryIndex,
            array.length,
            (isExpanded ? 10 : 7) + entryIndex * (isExpanded ? 3.4 : 2.4),
            center.x,
            center.y,
            Math.PI / 6
          );
          return { ...point, entry };
        });

      return {
        ...center,
        tag,
        color: tagColorMap.get(tag.tag) || nebulaPalette[index % nebulaPalette.length],
        satellites
      };
    });
  }, [entries, featuredTags, isExpanded, tagColorMap]);

  const stars = useMemo<StarNode[]>(() => {
    const centerX = 61;
    const centerY = 54;
    const visibleEntries = entries.slice(0, isExpanded ? 28 : 14);

    return visibleEntries.map((entry, index) => {
      const orbit = (isExpanded ? 16 : 11) + (index % 6) * (isExpanded ? 6 : 8) + Math.floor(index / 6) * (isExpanded ? 6 : 7);
      const offset = polarPosition(index, visibleEntries.length, orbit, centerX, centerY, Math.PI / 7);
      const tone = entry.tags.find((tag) => tagColorMap.has(tag));

      return {
        id: entry.id,
        entry,
        size: (isExpanded ? 5.6 : 4.2) + Math.min(entry.tags.length, 5) * (isExpanded ? 1.5 : 1),
        color: tone ? tagColorMap.get(tone) || "#93b4d6" : nebulaPalette[index % nebulaPalette.length],
        x: offset.x,
        y: offset.y
      };
    });
  }, [entries, isExpanded, tagColorMap]);

  const selectedOrigin = useMemo<SpatialPoint | null>(() => {
    if (!selectedEntry) {
      return null;
    }

    const directStar = stars.find((item) => item.id === selectedEntry.id);
    if (directStar) {
      return { x: directStar.x, y: directStar.y, color: directStar.color };
    }

    for (const constellation of constellations) {
      const satellite = constellation.satellites.find((item) => item.entry.id === selectedEntry.id);
      if (satellite) {
        return { x: satellite.x, y: satellite.y, color: constellation.color };
      }
    }

    return null;
  }, [constellations, selectedEntry, stars]);

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

  const recentTrajectory = useMemo(() => {
    if (!recentTarget) {
      return null;
    }

    const startX = isExpanded ? 84 : 88;
    const startY = isExpanded ? 80 : 86;
    const angle = (Math.atan2(recentTarget.y - startY, recentTarget.x - startX) * 180) / Math.PI;

    return { startX, startY, angle };
  }, [isExpanded, recentTarget]);

  useEffect(() => {
    if (!recentTarget) {
      return;
    }

    setShowArrival(true);
    setIsLatestPreviewExpanded(true);

    const arrivalTimer = window.setTimeout(() => setShowArrival(false), 3200);
    const previewTimer = window.setTimeout(() => setIsLatestPreviewExpanded(false), 5200);

    return () => {
      window.clearTimeout(arrivalTimer);
      window.clearTimeout(previewTimer);
    };
  }, [recentTarget]);

  useEffect(() => {
    if (!latestEntry) {
      setIsLatestPreviewExpanded(false);
    }
  }, [latestEntry]);

  const selectedIndicators = selectedEntry
    ? Object.entries(selectedEntry.personality_indicators)
        .filter(([key]) => !archetypeKeys.has(key))
        .map(([key, value]) => ({ key, value: typeof value === "boolean" ? (value ? 1 : 0) : value }))
        .sort((left, right) => right.value - left.value)
        .slice(0, 4)
    : [];

  const selectedArchetypes = selectedEntry
    ? Object.entries(selectedEntry.personality_indicators)
        .filter(([key]) => archetypeKeys.has(key))
        .map(([key, value]) => ({ key, value: typeof value === "boolean" ? (value ? 1 : 0) : value }))
        .filter((item) => item.value >= 0.36)
        .sort((left, right) => right.value - left.value)
    : [];

  return (
    <section
      className={`relative overflow-hidden border border-white/10 bg-[#07111f]/76 shadow-[0_32px_90px_rgba(2,6,16,0.55)] ${
        isExpanded ? "rounded-[34px]" : "rounded-[30px] md:rounded-[40px]"
      }`}
      style={sectionHeightStyle}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(125,121,183,0.18),transparent_26%),radial-gradient(circle_at_20%_70%,rgba(143,170,145,0.16),transparent_24%),radial-gradient(circle_at_75%_35%,rgba(185,143,161,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(127,167,201,0.14),transparent_24%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(244,215,161,0.05),transparent_16%),radial-gradient(circle_at_84%_18%,rgba(141,170,145,0.08),transparent_18%),radial-gradient(circle_at_72%_78%,rgba(185,143,161,0.08),transparent_20%)]" />
      <div className="absolute inset-0 opacity-65 [background-image:radial-gradient(circle_at_center,rgba(255,255,255,0.9)_0.8px,transparent_0.8px)] [background-size:120px_120px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_10%,rgba(8,18,32,0.72),transparent_38%),radial-gradient(circle_at_center,transparent_0%,rgba(7,17,31,0.16)_54%,rgba(2,6,12,0.78)_100%)]" />

      <div className="cosmos-camera absolute inset-0">
        <div className="cosmos-parallax-slow absolute inset-0">
          {dustClouds.map((cloud) => (
            <div
              key={cloud.id}
              className="pointer-events-none absolute rounded-full blur-3xl"
              style={{
                left: `${cloud.x}%`,
                top: `${cloud.y}%`,
                width: `${cloud.size}px`,
                height: `${cloud.size}px`,
                opacity: cloud.opacity,
                background: cloud.warm
                  ? "radial-gradient(circle, rgba(244,215,161,0.9) 0%, rgba(244,215,161,0) 72%)"
                  : "radial-gradient(circle, rgba(143,176,214,0.95) 0%, rgba(143,176,214,0) 72%)"
              }}
            />
          ))}
        </div>

        <div className="cosmos-parallax-reverse absolute inset-0">
          {deepFieldStars.map((star) => (
            <div
              key={star.id}
              className="pointer-events-none absolute rounded-full"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.width}px`,
                height: "1px",
                opacity: 0.14,
                transform: `rotate(${star.angle}deg)`,
                background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.55), rgba(255,255,255,0))"
              }}
            />
          ))}
        </div>

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

        {orbitBands.map((band) => (
          <div
            key={band.id}
            className="pointer-events-none absolute left-[61%] top-[54%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 cosmos-parallax-slow"
            style={{
              width: `${band.width}%`,
              height: `${band.height}%`,
              opacity: band.opacity
            }}
          />
        ))}
      </div>

      {constellations.map((constellation, index) => (
        <div
          key={constellation.tag.tag}
          className="absolute rounded-full blur-3xl cosmos-parallax-slow"
          style={{
            left: `${constellation.x - 10}%`,
            top: `${constellation.y - 8}%`,
            width: isExpanded ? "220px" : "170px",
            height: isExpanded ? "220px" : "170px",
            background: `${constellation.color}2d`,
            animation: `floatNebula ${18 + index * 4}s ease-in-out infinite`
          }}
        />
      ))}

      <div className="relative z-10 h-full p-4 md:p-8">
        <div className={`pointer-events-none max-w-[560px] ${isExpanded ? "mb-4 pt-6 md:pt-8" : "mb-6 pt-20 md:mb-8 md:pt-28"}`}>
          <p className="text-[11px] uppercase tracking-[0.34em] text-slate-300/60">Private Cosmos</p>
          <h2
            className={`mt-3 max-w-[90%] font-semibold tracking-tight text-white drop-shadow-[0_10px_36px_rgba(3,8,18,0.62)] md:max-w-none ${
              isExpanded ? "text-xl md:text-4xl" : "text-2xl md:text-5xl"
            }`}
          >
            每一段记录，都会在这里慢慢长成自己的星群。
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300/80 md:text-base md:leading-7">
            高频关键词会成为恒星，相关记录会环绕成卫星，主题在时间里慢慢聚成不同颜色的星云。首页更轻盈，放大后再进入细看。
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300/72">
            <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1">星云 {featuredTags.length}</span>
            <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1">
              星体 {Math.min(entries.length, isExpanded ? 28 : 14)}
            </span>
          </div>
        </div>

        {showExpandButton ? (
          <div className="absolute right-4 top-4 z-30 md:right-8 md:top-8">
            <button
              type="button"
              onClick={onRequestExpand}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[rgba(8,20,35,0.62)] px-4 py-2 text-sm text-slate-100 backdrop-blur-xl transition hover:bg-white/10"
            >
              <Maximize2 size={16} />
              放大宇宙
            </button>
          </div>
        ) : null}

        {!isExpanded ? (
          <div className="pointer-events-none absolute right-4 top-20 z-20 hidden w-[240px] md:right-8 md:top-32 md:block">
            <div className="pointer-events-auto rounded-[24px] border border-white/10 bg-[rgba(8,20,35,0.34)] p-3 backdrop-blur-xl">
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-300/65">Layer Switch</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["星云", "恒星", "卫星", "情绪潮汐"].map((label) => (
                  <span key={label} className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs text-slate-200/78">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {entries.length === 0 ? (
          <div className="absolute inset-x-4 bottom-8 top-[34%] z-20 flex items-center justify-center md:inset-x-10">
            <div className="max-w-lg rounded-[30px] border border-white/10 bg-[rgba(8,20,35,0.54)] p-6 text-center shadow-[0_24px_80px_rgba(2,6,16,0.28)] backdrop-blur-2xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/8 text-[#f4d7a1]">
                <Sparkles size={20} />
              </div>
              <h3 className="mt-4 text-2xl font-semibold text-white">你的宇宙还在等待第一颗星</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300/78">
                写下一段播客感受、一场展览余波、一段对话、一次运动后的身体反馈，或今天最难忘的一次心跳。保存之后，它会像流星一样飞入对应的星云。
              </p>
            </div>
          </div>
        ) : null}

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
                  width: `${(isExpanded ? 22 : 16) + constellation.tag.count * (isExpanded ? 6 : 4)}px`,
                  height: `${(isExpanded ? 22 : 16) + constellation.tag.count * (isExpanded ? 6 : 4)}px`,
                  background: `radial-gradient(circle, #fff6d9 0%, ${constellation.color} 48%, transparent 86%)`
                }}
              />
              <div
                className={`rounded-full border border-white/10 backdrop-blur ${isExpanded ? "mt-3 -ml-8 px-3 py-1.5 text-xs" : "mt-2 -ml-5 px-2 py-1 text-[10px]"}`}
                style={{ background: `${constellation.color}22`, color: "#eef2ff" }}
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
                    transform: `rotate(${Math.atan2(satellite.y - constellation.y, satellite.x - constellation.x)}rad)`,
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
                  style={{
                    left: `${satellite.x}%`,
                    top: `${satellite.y}%`,
                    width: isExpanded ? "28px" : "22px",
                    height: isExpanded ? "28px" : "22px"
                  }}
                >
                  <div
                    className="mx-auto rounded-full border border-white/15 shadow-[0_0_22px_rgba(255,255,255,0.1)]"
                    style={{
                      width: isExpanded ? "14px" : "10px",
                      height: isExpanded ? "14px" : "10px",
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
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: isExpanded ? "26px" : "20px",
              height: isExpanded ? "26px" : "20px"
            }}
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
          {showArrival && recentTarget && recentTrajectory ? (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: [0, 0.95, 0.28, 0], scale: [0.4, 1.25, 1.9, 2.4] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="pointer-events-none absolute z-40 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  left: `${recentTrajectory.startX}%`,
                  top: `${recentTrajectory.startY}%`,
                  width: "26px",
                  height: "26px",
                  background: `radial-gradient(circle, rgba(255,250,241,0.9) 0%, ${recentTarget.color}66 46%, transparent 72%)`,
                  boxShadow: `0 0 34px ${recentTarget.color}`
                }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 8 }}
                animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1, 1, 0.96], y: [8, 0, 0, -10] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.7, ease: "easeOut" }}
                className="pointer-events-none absolute bottom-5 right-5 z-40 md:bottom-8 md:right-8"
              >
                <div className="rounded-full border border-white/10 bg-[rgba(8,20,35,0.84)] px-4 py-2 text-xs tracking-[0.18em] text-[#f6e8ca] shadow-[0_0_30px_rgba(244,215,161,0.15)] backdrop-blur-xl">
                  新星正在入轨
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scaleX: 0.18 }}
                animate={{ opacity: [0, 1, 0.42, 0], scaleX: [0.18, 1, 1.04, 1] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.7, ease: [0.16, 1, 0.3, 1] }}
                className="pointer-events-none absolute z-30 origin-left"
                style={{
                  left: `${recentTrajectory.startX}%`,
                  top: `${recentTrajectory.startY}%`,
                  width: isExpanded ? "320px" : "240px",
                  height: "3px",
                  transform: `rotate(${recentTrajectory.angle}deg)`,
                  background: `linear-gradient(90deg, rgba(255,255,255,0) 0%, ${recentTarget.color}88 55%, ${recentTarget.color} 100%)`,
                  boxShadow: `0 0 24px ${recentTarget.color}`
                }}
              />
              <motion.div
                initial={{ left: `${recentTrajectory.startX}%`, top: `${recentTrajectory.startY}%`, opacity: 0, scale: 0.5 }}
                animate={{
                  left: `${recentTarget.x}%`,
                  top: `${recentTarget.y}%`,
                  opacity: [0, 1, 1, 0],
                  scale: [0.5, 1.35, 1.08, 0.84]
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.9, ease: [0.16, 1, 0.3, 1] }}
                className="pointer-events-none absolute z-40 -translate-x-1/2 -translate-y-1/2"
              >
                <div className="flex items-center" style={{ transform: `rotate(${recentTrajectory.angle}deg)` }}>
                  <div
                    className="rounded-full"
                    style={{
                      width: isExpanded ? "120px" : "88px",
                      height: "4px",
                      background: `linear-gradient(90deg, rgba(255,255,255,0), ${recentTarget.color})`,
                      boxShadow: `0 0 18px ${recentTarget.color}`
                    }}
                  />
                  <div
                    className="rounded-full"
                    style={{
                      width: isExpanded ? "20px" : "16px",
                      height: isExpanded ? "20px" : "16px",
                      background: `radial-gradient(circle, #fffaf1 0%, ${recentTarget.color} 58%, transparent 100%)`,
                      boxShadow: `0 0 32px ${recentTarget.color}`
                    }}
                  />
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: [0, 0.95, 0.22, 0], scale: [0.4, 1.8, 2.5, 3.1] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.9, delay: 2.05, ease: "easeOut" }}
                className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2 rounded-full border"
                style={{
                  left: `${recentTarget.x}%`,
                  top: `${recentTarget.y}%`,
                  width: "34px",
                  height: "34px",
                  borderColor: `${recentTarget.color}99`
                }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.65 }}
                animate={{ opacity: [0, 0.34, 0.2, 0], scale: [0.65, 1.16, 1.34, 1.48] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.8, delay: 1.85, ease: "easeOut" }}
                className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
                style={{
                  left: `${recentTarget.x}%`,
                  top: `${recentTarget.y}%`,
                  width: isExpanded ? "220px" : "170px",
                  height: isExpanded ? "220px" : "170px",
                  background: `radial-gradient(circle, ${recentTarget.color}55 0%, transparent 74%)`
                }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.72 }}
                animate={{ opacity: [0, 0.48, 0], scale: [0.72, 1.08, 1.28] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.1, delay: 2.1, ease: "easeOut" }}
                className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border"
                style={{
                  left: `${recentTarget.x}%`,
                  top: `${recentTarget.y}%`,
                  width: isExpanded ? "120px" : "92px",
                  height: isExpanded ? "120px" : "92px",
                  borderColor: `${recentTarget.color}55`
                }}
              />
            </>
          ) : null}
        </AnimatePresence>

        {!isExpanded && latestEntry && !selectedEntry ? (
          <div className="absolute bottom-4 right-4 z-20 hidden xl:flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={() => setIsLatestPreviewExpanded((current) => !current)}
              className="rounded-full border border-white/10 bg-[#081423d9] px-4 py-2 text-sm text-slate-200/88 backdrop-blur-xl transition hover:bg-white/10"
            >
              {isLatestPreviewExpanded ? "收起最新星体" : "展开最新星体"}
            </button>

            <AnimatePresence>
              {isLatestPreviewExpanded ? (
                <motion.article
                  initial={{ opacity: 0, y: 14, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  className="max-w-[260px] rounded-[24px] border border-white/10 bg-[#081423b5] p-4 backdrop-blur-xl"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.3em] text-slate-300/65">Latest Star</p>
                      <h3 className="mt-2 text-base font-semibold text-white">{latestEntry.title || latestEntry.summary}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsLatestPreviewExpanded(false)}
                      className="rounded-full border border-white/10 bg-white/6 p-2 text-slate-200/82 transition hover:bg-white/10"
                      aria-label="收起最新星体"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300/78">{latestEntry.summary}</p>
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
            </AnimatePresence>
          </div>
        ) : null}

        <AnimatePresence>
          {selectedEntry && showDetailOverlay ? (
            <>
              <motion.button
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onDismissDetail}
                className="absolute inset-0 z-20 cursor-default bg-[rgba(3,8,18,0.18)] backdrop-blur-[2px]"
                aria-label="关闭星体详情"
              />

              {selectedOrigin ? (
                <>
                  <div
                    className="portal-halo pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      left: `${selectedOrigin.x}%`,
                      top: `${selectedOrigin.y}%`,
                      width: isExpanded ? "116px" : "92px",
                      height: isExpanded ? "116px" : "92px",
                      background: `radial-gradient(circle, ${selectedOrigin.color}40 0%, transparent 72%)`
                    }}
                  />
                  <div
                    className="portal-ring portal-ring--outer pointer-events-none absolute z-30 rounded-full border border-white/14"
                    style={{
                      left: `${selectedOrigin.x}%`,
                      top: `${selectedOrigin.y}%`,
                      width: isExpanded ? "92px" : "74px",
                      height: isExpanded ? "92px" : "74px",
                      borderColor: `${selectedOrigin.color}66`
                    }}
                  />
                  <div
                    className="portal-ring portal-ring--inner pointer-events-none absolute z-30 rounded-full border border-dashed border-white/12"
                    style={{
                      left: `${selectedOrigin.x}%`,
                      top: `${selectedOrigin.y}%`,
                      width: isExpanded ? "56px" : "44px",
                      height: isExpanded ? "56px" : "44px",
                      borderColor: `${selectedOrigin.color}88`
                    }}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.3 }}
                    animate={{ opacity: [0, 1, 0], scale: [0.3, 1.4, 2.3] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2 rounded-full border"
                    style={{
                      left: `${selectedOrigin.x}%`,
                      top: `${selectedOrigin.y}%`,
                      width: "28px",
                      height: "28px",
                      borderColor: `${selectedOrigin.color}88`
                    }}
                  />
                  <motion.div
                    initial={{ opacity: 0, scaleX: 0.24 }}
                    animate={{ opacity: [0, 0.65, 0.18], scaleX: [0.24, 1, 1] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.9, ease: [0.2, 1, 0.32, 1] }}
                    className="pointer-events-none absolute hidden origin-left rounded-full md:block"
                    style={{
                      left: `${selectedOrigin.x}%`,
                      top: `${selectedOrigin.y}%`,
                      width: `${Math.max(22, 84 - selectedOrigin.x)}%`,
                      height: "1px",
                      background: `linear-gradient(90deg, ${selectedOrigin.color}, rgba(255,255,255,0.08))`
                    }}
                  />
                </>
              ) : null}

              <motion.aside
                initial={{
                  opacity: 0,
                  y: 48,
                  scale: 0.92,
                  clipPath: "inset(18% 22% 28% 22% round 26px)"
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  clipPath: "inset(0% 0% 0% 0% round 26px)"
                }}
                exit={{
                  opacity: 0,
                  y: 22,
                  scale: 0.98,
                  clipPath: "inset(12% 14% 18% 14% round 24px)"
                }}
                transition={{ duration: 0.46, ease: [0.2, 1, 0.32, 1] }}
                className="absolute inset-x-3 bottom-3 z-30 max-h-[58%] overflow-y-auto rounded-[24px] border border-white/10 bg-[linear-gradient(160deg,rgba(10,24,42,0.94),rgba(6,14,28,0.92))] p-4 shadow-[0_28px_90px_rgba(2,6,16,0.42)] backdrop-blur-xl md:inset-x-auto md:right-6 md:top-[15%] md:bottom-auto md:max-h-[70%] md:w-[396px]"
              >
                <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-[radial-gradient(circle_at_top_right,rgba(244,215,161,0.12),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(143,176,214,0.14),transparent_28%)]" />
                <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-white/12 md:hidden" />

                <div className="relative">
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

                  {selectedArchetypes.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {selectedArchetypes.map((item) => (
                        <span key={item.key} className="rounded-full border border-white/10 bg-[#f4d7a1]/12 px-3 py-1 text-xs text-[#f6e8ca]">
                          {item.key} {item.value.toFixed(2)}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {selectedIndicators.map((indicator) => (
                      <div key={indicator.key} className="rounded-2xl bg-white/6 p-3">
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span className="text-slate-200">{indicator.key}</span>
                          <span className="text-slate-300/80">{indicator.value.toFixed(2)}</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-white/8">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-[#8fb0d6] via-[#b98fa1] to-[#f4d7a1]"
                            style={{ width: `${Math.max(indicator.value * 100, 10)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.aside>
            </>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}
