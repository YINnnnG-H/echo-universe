import { AnimatePresence, motion } from "framer-motion";
import { Maximize2, Minus, Plus, RotateCcw, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from "react";
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
  emphasis: number;
};

type SpatialPoint = {
  x: number;
  y: number;
  color: string;
};

type ViewportState = {
  x: number;
  y: number;
  scale: number;
};

type DustParticle = {
  id: string;
  size: number;
  delay: number;
  duration: number;
  spreadX: number;
  spreadY: number;
  opacity: number;
};

const nebulaPalette = ["#7d79b7", "#8daa91", "#b98fa1", "#7fa7c9", "#d4a373", "#93b4d6", "#d98373", "#73b2ad"];

const archetypeKeys = new Set([
  "孤儿原型",
  "战士原型",
  "疗愈者原型",
  "女王原型",
  "智者原型",
  "寻找者原型"
]);

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

function normalizeIndicator(value: number | boolean) {
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }
  if (!Number.isFinite(value)) {
    return 0;
  }
  return clampRange(value, 0, 1);
}

function constellationAnchor(index: number, total: number, isExpanded: boolean) {
  const anchors = isExpanded
    ? [
        { x: 60, y: 23 },
        { x: 76, y: 31 },
        { x: 84, y: 48 },
        { x: 77, y: 67 },
        { x: 61, y: 78 },
        { x: 41, y: 75 },
        { x: 26, y: 61 },
        { x: 21, y: 41 },
        { x: 31, y: 24 },
        { x: 47, y: 36 }
      ]
    : [
        { x: 64, y: 30 },
        { x: 80, y: 43 },
        { x: 71, y: 63 },
        { x: 49, y: 73 },
        { x: 28, y: 61 },
        { x: 33, y: 35 },
        { x: 53, y: 47 }
      ];

  if (index < anchors.length) {
    return anchors[index];
  }

  const overflowIndex = index - anchors.length;
  const overflowTotal = Math.max(total - anchors.length, 1);
  return polarPosition(overflowIndex, overflowTotal, isExpanded ? 34 : 26, 55, 50, -Math.PI / 5);
}

function stableSortTags(entries: Entry[], stats: DashboardStats | null) {
  const counts = new Map<string, number>();
  const recency = new Map<string, number>();

  entries.forEach((entry, entryIndex) => {
    entry.tags.forEach((tag, tagIndex) => {
      counts.set(tag, (counts.get(tag) || 0) + 1);
      const score = entryIndex * 12 + tagIndex;
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
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }
      return left.order - right.order;
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
  const [viewport, setViewport] = useState<ViewportState>({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panStateRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  const isExpanded = viewMode === "expanded";
  const latestEntry = entries[0];
  const maxConstellations = isExpanded ? 9 : 5;
  const maxFreeStars = isExpanded ? 18 : 9;

  const featuredTags = useMemo(() => {
    return stableSortTags(entries, stats)
      .slice(0, maxConstellations)
      .map((item) => ({ tag: item.tag, count: item.count }));
  }, [entries, maxConstellations, stats]);

  const compactHeight = useMemo(
    () => clampRange(450 + featuredTags.length * 28 + entries.length * 16, 520, 860),
    [entries.length, featuredTags.length]
  );
  const expandedHeight = useMemo(
    () => clampRange(700 + featuredTags.length * 26 + entries.length * 10, 760, 1120),
    [entries.length, featuredTags.length]
  );

  const sectionHeightStyle = isExpanded
    ? { height: `min(${expandedHeight}px, calc(100vh - 168px))`, minHeight: "720px", touchAction: "none" as const }
    : { minHeight: `${compactHeight}px` };

  const backgroundStars = useMemo(
    () =>
      Array.from({ length: isExpanded ? 132 : 82 }, (_, index) => {
        const rawX = ((index * 37) % 100) + ((index % 3) * 0.8);
        const rawY = ((index * 29) % 100) + ((index % 5) * 0.65);
        const quietZone = rawX < 34 && rawY < 26;
        return {
          id: `bg-${index}`,
          x: quietZone ? rawX + 30 : rawX % 100,
          y: rawY % 100,
          size: 1 + (index % 3),
          delay: (index % 8) * 0.28,
          duration: 2.8 + (index % 7) * 0.55
        };
      }),
    [isExpanded]
  );

  const deepFieldStars = useMemo(
    () =>
      Array.from({ length: isExpanded ? 40 : 24 }, (_, index) => ({
        id: `deep-${index}`,
        x: (index * 17.4) % 100,
        y: (index * 24.6 + 9) % 100,
        width: 40 + (index % 5) * 18,
        angle: -14 + (index % 6) * 8
      })),
    [isExpanded]
  );

  const dustClouds = useMemo(
    () =>
      Array.from({ length: isExpanded ? 8 : 5 }, (_, index) => ({
        id: `dust-${index}`,
        x: 8 + ((index * 19) % 78),
        y: 12 + ((index * 15) % 68),
        size: (isExpanded ? 280 : 210) + (index % 3) * (isExpanded ? 54 : 34),
        opacity: 0.06 + (index % 4) * 0.03,
        warm: index % 2 === 1
      })),
    [isExpanded]
  );

  const orbitBands = useMemo(
    () =>
      Array.from({ length: isExpanded ? 4 : 3 }, (_, index) => ({
        id: `ring-${index}`,
        width: 32 + index * (isExpanded ? 14 : 13),
        height: 18 + index * (isExpanded ? 12 : 10),
        opacity: 0.09 - index * 0.015
      })),
    [isExpanded]
  );

  const tagColorMap = useMemo(() => {
    const nextMap = new Map<string, string>();
    featuredTags.forEach((item, index) => {
      nextMap.set(item.tag, nebulaPalette[index % nebulaPalette.length]);
    });
    return nextMap;
  }, [featuredTags]);

  const prioritizedEntries = useMemo(() => {
    if (!activeTag) {
      return entries;
    }
    const matched = entries.filter((entry) => entry.tags.includes(activeTag));
    const rest = entries.filter((entry) => !entry.tags.includes(activeTag));
    return [...matched, ...rest];
  }, [activeTag, entries]);

  const constellationScale = featuredTags.length >= 7 ? 0.82 : featuredTags.length >= 5 ? 0.9 : 1;
  const satelliteLimit = isExpanded ? (featuredTags.length >= 7 ? 4 : 5) : featuredTags.length >= 5 ? 2 : 3;

  const constellations = useMemo(() => {
    if (featuredTags.length === 0) {
      return [];
    }

    return featuredTags.map((item, index) => {
      const anchor = constellationAnchor(index, featuredTags.length, isExpanded);
      const relatedEntries = entries.filter((entry) => entry.tags.includes(item.tag)).slice(0, satelliteLimit);
      const baseRadius = (isExpanded ? 9.6 : 6.6) * constellationScale;
      const satellites = relatedEntries.map((entry, satelliteIndex, array) => {
        const point = polarPosition(
          satelliteIndex,
          array.length,
          baseRadius + satelliteIndex * (isExpanded ? 2.6 : 1.8),
          anchor.x,
          anchor.y,
          Math.PI / 5 + index * 0.18
        );

        return { ...point, entry };
      });

      return {
        x: anchor.x,
        y: anchor.y,
        tag: item,
        color: tagColorMap.get(item.tag) || nebulaPalette[index % nebulaPalette.length],
        satellites,
        haloSize: (isExpanded ? 180 : 136) * constellationScale + Math.min(item.count, 5) * (isExpanded ? 12 : 9),
        starSize: (isExpanded ? 24 : 18) * constellationScale + Math.min(item.count, 4) * (isExpanded ? 4.4 : 3.1)
      };
    });
  }, [entries, featuredTags, isExpanded, satelliteLimit, constellationScale, tagColorMap]);

  const stars = useMemo<StarNode[]>(() => {
    const visibleEntries = prioritizedEntries.slice(0, maxFreeStars);
    const ringCenter = { x: 56, y: isExpanded ? 54 : 57 };
    const tightness = visibleEntries.length >= 14 ? 0.88 : 1;

    return visibleEntries.map((entry, index) => {
      const orbitBand = Math.floor(index / 6);
      const withinBand = index % 6;
      const radius = ((isExpanded ? 18 : 14) + orbitBand * (isExpanded ? 7 : 6) + withinBand * 1.8) * tightness;
      const point = polarPosition(index, visibleEntries.length, radius, ringCenter.x, ringCenter.y, Math.PI / 7);
      const tone = entry.tags.find((tag) => tagColorMap.has(tag));
      const matchesActive = !activeTag || entry.tags.includes(activeTag);

      return {
        id: entry.id,
        entry,
        size: (isExpanded ? 5.2 : 4.1) + Math.min(entry.tags.length, 4) * (isExpanded ? 1.25 : 0.85),
        color: tone ? tagColorMap.get(tone) || "#93b4d6" : nebulaPalette[index % nebulaPalette.length],
        x: point.x,
        y: point.y,
        emphasis: matchesActive ? 1 : 0.42
      };
    });
  }, [activeTag, isExpanded, maxFreeStars, prioritizedEntries, tagColorMap]);

  const selectedOrigin = useMemo<SpatialPoint | null>(() => {
    if (!selectedEntry) {
      return null;
    }

    const star = stars.find((item) => item.id === selectedEntry.id);
    if (star) {
      return { x: star.x, y: star.y, color: star.color };
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
    if (star) {
      return { x: star.x, y: star.y, color: star.color };
    }

    const entry = entries.find((item) => item.id === recentEntryId);
    if (!entry) {
      return null;
    }

    const relatedConstellation = constellations.find((constellation) => entry.tags.some((tag) => tag === constellation.tag.tag));
    if (!relatedConstellation) {
      return null;
    }

    return {
      x: relatedConstellation.x,
      y: relatedConstellation.y,
      color: relatedConstellation.color
    };
  }, [constellations, entries, recentEntryId, stars]);

  const recentTrajectory = useMemo(() => {
    if (!recentTarget) {
      return null;
    }

    const startX = isExpanded ? 88 : 86;
    const startY = isExpanded ? 82 : 85;
    const midX = (startX + recentTarget.x) / 2 + (isExpanded ? -7 : -4);
    const midY = (startY + recentTarget.y) / 2 - (isExpanded ? 8 : 6);
    const angle = (Math.atan2(recentTarget.y - startY, recentTarget.x - startX) * 180) / Math.PI;

    return { startX, startY, midX, midY, angle };
  }, [isExpanded, recentTarget]);

  const arrivalParticles = useMemo<DustParticle[]>(
    () =>
      Array.from({ length: isExpanded ? 16 : 12 }, (_, index) => ({
        id: `arrival-${index}`,
        size: 2.2 + (index % 4) * 1.2,
        delay: index * 0.045,
        duration: 1.8 + (index % 5) * 0.14,
        spreadX: -10 - index * 1.6,
        spreadY: (index % 2 === 0 ? -1 : 1) * (3 + (index % 3) * 1.8),
        opacity: 0.22 + (index % 4) * 0.12
      })),
    [isExpanded]
  );

  useEffect(() => {
    if (!isExpanded) {
      setViewport({ x: 0, y: 0, scale: 1 });
      setIsPanning(false);
      panStateRef.current = null;
    }
  }, [isExpanded]);

  useEffect(() => {
    if (!recentTarget) {
      return;
    }

    setShowArrival(true);
    setIsLatestPreviewExpanded(true);

    const arrivalTimer = window.setTimeout(() => setShowArrival(false), 3000);
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
        .map(([key, value]) => ({ key, value: normalizeIndicator(value) }))
        .sort((left, right) => right.value - left.value)
        .slice(0, 4)
    : [];

  const selectedArchetypes = selectedEntry
    ? Object.entries(selectedEntry.personality_indicators)
        .filter(([key]) => archetypeKeys.has(key))
        .map(([key, value]) => ({ key, value: normalizeIndicator(value) }))
        .filter((item) => item.value >= 0.2)
        .sort((left, right) => right.value - left.value)
    : [];

  function updateScale(nextScale: number) {
    setViewport((current) => ({
      ...current,
      scale: clampRange(nextScale, 0.88, 1.72)
    }));
  }

  function beginPan(event: ReactPointerEvent<HTMLElement>) {
    if (!isExpanded || selectedEntry) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest("[data-space-node='true']") || target.closest("[data-space-ui='true']")) {
      return;
    }

    panStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: viewport.x,
      originY: viewport.y
    };
    setIsPanning(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function movePan(event: ReactPointerEvent<HTMLElement>) {
    if (!isExpanded || !panStateRef.current) {
      return;
    }

    const nextX = panStateRef.current.originX + (event.clientX - panStateRef.current.startX);
    const nextY = panStateRef.current.originY + (event.clientY - panStateRef.current.startY);

    setViewport((current) => ({
      ...current,
      x: clampRange(nextX, -180, 180),
      y: clampRange(nextY, -160, 160)
    }));
  }

  function endPan(event?: ReactPointerEvent<HTMLElement>) {
    if (event && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    panStateRef.current = null;
    setIsPanning(false);
  }

  function handleWheel(event: ReactWheelEvent<HTMLElement>) {
    if (!isExpanded || selectedEntry) {
      return;
    }
    event.preventDefault();
    updateScale(viewport.scale + (event.deltaY < 0 ? 0.08 : -0.08));
  }

  const worldTransform = `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.scale})`;

  return (
    <section
      className={`relative overflow-hidden border border-white/10 bg-[#07111f]/76 shadow-[0_32px_90px_rgba(2,6,16,0.55)] ${
        isExpanded ? `rounded-[34px] ${isPanning ? "cursor-grabbing" : "cursor-grab"}` : "rounded-[30px] md:rounded-[40px]"
      }`}
      style={sectionHeightStyle}
      onWheel={handleWheel}
      onPointerDown={beginPan}
      onPointerMove={movePan}
      onPointerUp={endPan}
      onPointerCancel={endPan}
      onPointerLeave={() => {
        if (isPanning) {
          panStateRef.current = null;
          setIsPanning(false);
        }
      }}
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
                  ? "radial-gradient(circle, rgba(244,215,161,0.88) 0%, rgba(244,215,161,0) 72%)"
                  : "radial-gradient(circle, rgba(143,176,214,0.92) 0%, rgba(143,176,214,0) 72%)"
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
            animate={{ opacity: [0.18, 0.95, 0.34], scale: [0.9, 1.26, 1] }}
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
      </div>

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
            高频关键词会成为恒星，相关记录会化作卫星。先看整体星云，再在放大视图里拖动、缩放、靠近它们。
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300/72">
            <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1">星云 {featuredTags.length}</span>
            <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1">
              星体 {Math.min(prioritizedEntries.length, maxFreeStars)}
            </span>
            {isExpanded ? (
              <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1">可拖动与缩放</span>
            ) : null}
          </div>
        </div>

        {showExpandButton ? (
          <div className="absolute right-4 top-4 z-30 md:right-8 md:top-8" data-space-ui="true">
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

        {isExpanded ? (
          <div className="absolute right-4 top-4 z-30 flex items-center gap-2 md:right-8 md:top-8" data-space-ui="true">
            <div className="hidden rounded-full border border-white/10 bg-[rgba(8,20,35,0.52)] px-3 py-2 text-xs tracking-[0.24em] text-slate-200/76 backdrop-blur-xl md:block">
              缩放 {viewport.scale.toFixed(2)}x
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[rgba(8,20,35,0.64)] p-2 backdrop-blur-xl">
              <button
                type="button"
                onClick={() => updateScale(viewport.scale - 0.12)}
                className="rounded-full border border-white/10 bg-white/8 p-2 text-slate-100 transition hover:bg-white/14"
                aria-label="缩小宇宙"
              >
                <Minus size={14} />
              </button>
              <button
                type="button"
                onClick={() => updateScale(1)}
                className="rounded-full border border-white/10 bg-white/8 p-2 text-slate-100 transition hover:bg-white/14"
                aria-label="重置视角"
              >
                <RotateCcw size={14} />
              </button>
              <button
                type="button"
                onClick={() => updateScale(viewport.scale + 0.12)}
                className="rounded-full border border-white/10 bg-white/8 p-2 text-slate-100 transition hover:bg-white/14"
                aria-label="放大宇宙"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        ) : null}

        {!isExpanded ? (
          <div className="pointer-events-none absolute right-4 top-20 z-20 hidden w-[240px] md:right-8 md:top-32 md:block" data-space-ui="true">
            <div className="pointer-events-auto rounded-[24px] border border-white/10 bg-[rgba(8,20,35,0.34)] p-3 backdrop-blur-xl">
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-300/65">Layer Switch</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["星云", "恒星", "卫星", "轨迹"].map((label) => (
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
                写下一段播客感受、一场展览余温、一段对话、一次运动后的身体反馈，保存之后，它就会飞进对应的星云。
              </p>
            </div>
          </div>
        ) : null}

        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 origin-center transition-transform duration-300 ease-out will-change-transform"
            style={{ transform: worldTransform }}
          >
            {orbitBands.map((band) => (
              <div
                key={band.id}
                className="pointer-events-none absolute left-[56%] top-[57%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 cosmos-parallax-slow"
                style={{
                  width: `${band.width}%`,
                  height: `${band.height}%`,
                  opacity: band.opacity
                }}
              />
            ))}

            {constellations.map((constellation, index) => (
              <div key={`nebula-${constellation.tag.tag}`} className="pointer-events-none absolute inset-0">
                {[
                  {
                    dx: -8,
                    dy: -6,
                    width: constellation.haloSize,
                    height: constellation.haloSize * 0.74,
                    opacity: 0.25,
                    radius: "58% 42% 62% 38% / 44% 36% 64% 56%"
                  },
                  {
                    dx: 4,
                    dy: -10,
                    width: constellation.haloSize * 0.88,
                    height: constellation.haloSize * 0.92,
                    opacity: 0.18,
                    radius: "40% 60% 48% 52% / 58% 44% 56% 42%"
                  },
                  {
                    dx: 10,
                    dy: 5,
                    width: constellation.haloSize * 0.7,
                    height: constellation.haloSize * 0.66,
                    opacity: 0.14,
                    radius: "64% 36% 46% 54% / 42% 58% 40% 60%"
                  }
                ].map((blob, blobIndex) => (
                  <div
                    key={`${constellation.tag.tag}-blob-${blobIndex}`}
                    className={`absolute blur-3xl ${blobIndex % 2 === 0 ? "cosmos-parallax-slow" : "cosmos-parallax-reverse"}`}
                    style={{
                      left: `${constellation.x + blob.dx}%`,
                      top: `${constellation.y + blob.dy}%`,
                      width: `${blob.width}px`,
                      height: `${blob.height}px`,
                      opacity: activeTag && activeTag !== constellation.tag.tag ? blob.opacity * 0.35 : blob.opacity,
                      borderRadius: blob.radius,
                      background: `radial-gradient(circle at 40% 35%, ${constellation.color}cc 0%, ${constellation.color}44 42%, transparent 78%)`,
                      animation: `floatNebula ${18 + index * 3 + blobIndex * 2}s ease-in-out infinite`
                    }}
                  />
                ))}
                <div
                  className="absolute rounded-full blur-2xl"
                  style={{
                    left: `${constellation.x - 5}%`,
                    top: `${constellation.y - 4}%`,
                    width: `${constellation.haloSize * 0.58}px`,
                    height: `${constellation.haloSize * 0.52}px`,
                    opacity: activeTag && activeTag !== constellation.tag.tag ? 0.08 : 0.16,
                    borderRadius: "48% 52% 44% 56% / 52% 42% 58% 48%",
                    background: `radial-gradient(circle at 60% 40%, rgba(255,255,255,0.16), ${constellation.color}22 52%, transparent 80%)`
                  }}
                />
              </div>
            ))}

            {constellations.map((constellation, index) => {
              const isActive = !activeTag || activeTag === constellation.tag.tag;

              return (
                <div key={constellation.tag.tag}>
                  <button
                    type="button"
                    data-space-node="true"
                    onClick={() => onSelectTag(constellation.tag.tag)}
                    className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full text-left transition ${
                      activeTag === constellation.tag.tag ? "scale-110" : "hover:scale-105"
                    }`}
                    style={{ left: `${constellation.x}%`, top: `${constellation.y}%`, opacity: isActive ? 1 : 0.5 }}
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.08, 0.97, 1.12, 1],
                        opacity: [0.94, 0.76, 0.92, 0.84, 0.94],
                        rotate: [0, -1.2, 0.8, 0]
                      }}
                      transition={{
                        duration: 5 + index * 0.45,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut"
                      }}
                      className="relative rounded-full border border-white/15 shadow-[0_0_32px_rgba(255,255,255,0.1)]"
                      style={{
                        width: `${constellation.starSize}px`,
                        height: `${constellation.starSize}px`,
                        background: `radial-gradient(circle, #fff6d9 0%, ${constellation.color} 45%, transparent 82%)`
                      }}
                    >
                      <motion.div
                        animate={{ scale: [0.9, 1.15, 0.96], opacity: [0.22, 0.46, 0.26] }}
                        transition={{
                          duration: 3.2 + index * 0.4,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut"
                        }}
                        className="absolute inset-[-20%] rounded-full blur-xl"
                        style={{
                          background: `radial-gradient(circle, ${constellation.color}55 0%, transparent 76%)`
                        }}
                      />
                    </motion.div>
                    <div
                      className={`rounded-full border border-white/10 backdrop-blur ${
                        isExpanded ? "mt-3 -ml-8 px-3 py-1.5 text-xs" : "mt-2 -ml-5 px-2 py-1 text-[10px]"
                      }`}
                      style={{ background: `${constellation.color}22`, color: "#eef2ff" }}
                    >
                      #{constellation.tag.tag}
                    </div>
                  </button>

                  {constellation.satellites.map((satellite, satelliteIndex) => (
                    <div key={`${constellation.tag.tag}-${satellite.entry.id}`}>
                      <motion.div
                        animate={{ opacity: [0.14, 0.5, 0.22], scaleX: [0.94, 1.04, 1] }}
                        transition={{
                          duration: 3.5 + satelliteIndex * 0.34,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut"
                        }}
                        className="pointer-events-none absolute z-10 origin-left rounded-full"
                        style={{
                          left: `${constellation.x}%`,
                          top: `${constellation.y}%`,
                          width: `${Math.hypot(satellite.x - constellation.x, satellite.y - constellation.y)}%`,
                          height: "1px",
                          opacity: isActive ? 0.55 : 0.2,
                          background: `linear-gradient(90deg, ${constellation.color}, transparent)`,
                          transform: `rotate(${Math.atan2(satellite.y - constellation.y, satellite.x - constellation.x)}rad)`,
                          transformOrigin: "0 0"
                        }}
                      />
                      <motion.button
                        type="button"
                        data-space-node="true"
                        onClick={() => onSelectEntry(satellite.entry)}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{
                          opacity: selectedEntry?.id === satellite.entry.id ? [0.74, 1, 0.84, 1] : [0.4, 0.92, 0.58, 0.9],
                          scale: selectedEntry?.id === satellite.entry.id ? [1, 1.18, 1.08, 1.14] : [0.94, 1.1, 0.98, 1.02]
                        }}
                        transition={{
                          delay: satelliteIndex * 0.06,
                          duration: 4.1 + satelliteIndex * 0.25,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut"
                        }}
                        className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                          selectedEntry?.id === satellite.entry.id ? "scale-125" : ""
                        }`}
                        style={{
                          left: `${satellite.x}%`,
                          top: `${satellite.y}%`,
                          width: isExpanded ? "30px" : "24px",
                          height: isExpanded ? "30px" : "24px",
                          opacity: isActive ? 1 : 0.38
                        }}
                      >
                        <div
                          className="mx-auto rounded-full border border-white/15 shadow-[0_0_22px_rgba(255,255,255,0.1)]"
                          style={{
                            width: isExpanded ? "13px" : "10px",
                            height: isExpanded ? "13px" : "10px",
                            background: `radial-gradient(circle, #ffffff 0%, ${constellation.color} 60%, transparent 100%)`
                          }}
                        />
                      </motion.button>
                    </div>
                  ))}
                </div>
              );
            })}

            {stars.map((star, index) => (
              <motion.button
                key={star.id}
                type="button"
                data-space-node="true"
                onClick={() => onSelectEntry(star.entry)}
                className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                  selectedEntry?.id === star.id ? "ring-2 ring-white/40" : ""
                }`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: selectedEntry?.id === star.id
                    ? [0.72, 1, 0.84, 1]
                    : [0.22 * star.emphasis, 0.62 * star.emphasis, 0.34 * star.emphasis, 0.58 * star.emphasis],
                  scale: selectedEntry?.id === star.id ? [1, 1.22, 1.08, 1.16] : [0.9, 1.08, 0.98, 1.1]
                }}
                transition={{
                  delay: index * 0.03,
                  duration: 4.2 + (index % 5) * 0.55,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut"
                }}
                style={{
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  width: isExpanded ? "28px" : "22px",
                  height: isExpanded ? "28px" : "22px"
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
                  {arrivalParticles.map((particle) => (
                    <motion.div
                      key={particle.id}
                      initial={{
                        left: `${recentTrajectory.startX}%`,
                        top: `${recentTrajectory.startY}%`,
                        opacity: 0,
                        scale: 0.6
                      }}
                      animate={{
                        left: [
                          `${recentTrajectory.startX}%`,
                          `${recentTrajectory.midX + particle.spreadX * 0.12}%`,
                          `${recentTarget.x + particle.spreadX * 0.04}%`
                        ],
                        top: [
                          `${recentTrajectory.startY}%`,
                          `${recentTrajectory.midY + particle.spreadY * 0.2}%`,
                          `${recentTarget.y + particle.spreadY * 0.06}%`
                        ],
                        opacity: [0, particle.opacity, particle.opacity * 0.7, 0],
                        scale: [0.4, 1, 0.88, 0.36]
                      }}
                      exit={{ opacity: 0 }}
                      transition={{
                        duration: particle.duration,
                        delay: particle.delay,
                        ease: [0.18, 1, 0.32, 1]
                      }}
                      className="pointer-events-none absolute z-40 -translate-x-1/2 -translate-y-1/2 rounded-full"
                      style={{
                        width: `${particle.size}px`,
                        height: `${particle.size}px`,
                        background: `radial-gradient(circle, rgba(255,250,241,0.92) 0%, ${recentTarget.color} 70%, transparent 100%)`,
                        boxShadow: `0 0 10px ${recentTarget.color}`
                      }}
                    />
                  ))}

                  <motion.div
                    initial={{ opacity: 0, scale: 0.45 }}
                    animate={{ opacity: [0, 0.65, 0.14, 0], scale: [0.45, 1.3, 1.8, 2.3] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.95, ease: "easeOut" }}
                    className="pointer-events-none absolute z-40 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      left: `${recentTrajectory.startX}%`,
                      top: `${recentTrajectory.startY}%`,
                      width: "22px",
                      height: "22px",
                      background: `radial-gradient(circle, rgba(255,250,241,0.86) 0%, ${recentTarget.color}55 45%, transparent 70%)`
                    }}
                  />

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: [0, 0.4, 0], scale: [0.9, 1.08, 1.12] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2.2, ease: "easeOut" }}
                    className="pointer-events-none absolute z-30 origin-left"
                    style={{
                      left: `${recentTrajectory.startX}%`,
                      top: `${recentTrajectory.startY}%`,
                      width: isExpanded ? "300px" : "228px",
                      height: "18px",
                      transform: `rotate(${recentTrajectory.angle}deg) translateY(-8px)`,
                      background: `linear-gradient(90deg, rgba(255,255,255,0) 0%, ${recentTarget.color}22 40%, ${recentTarget.color}00 100%)`,
                      filter: "blur(8px)"
                    }}
                  />

                  <motion.div
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: [0, 0.96, 0.24, 0], scale: [0.6, 1.45, 2.2, 2.8] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.9, delay: 1.25, ease: "easeOut" }}
                    className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2 rounded-full border"
                    style={{
                      left: `${recentTarget.x}%`,
                      top: `${recentTarget.y}%`,
                      width: "36px",
                      height: "36px",
                      borderColor: `${recentTarget.color}88`
                    }}
                  />

                  <motion.div
                    initial={{ opacity: 0, scale: 0.72 }}
                    animate={{ opacity: [0, 0.34, 0.18, 0], scale: [0.72, 1.1, 1.28, 1.42] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2.6, delay: 1.1, ease: "easeOut" }}
                    className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
                    style={{
                      left: `${recentTarget.x}%`,
                      top: `${recentTarget.y}%`,
                      width: isExpanded ? "230px" : "172px",
                      height: isExpanded ? "230px" : "172px",
                      background: `radial-gradient(circle, ${recentTarget.color}55 0%, transparent 74%)`
                    }}
                  />
                </>
              ) : null}
            </AnimatePresence>

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
              </>
            ) : null}
          </div>
        </div>

        {!isExpanded && latestEntry && !selectedEntry ? (
          <div className="absolute bottom-4 right-4 z-20 hidden xl:flex flex-col items-end gap-2" data-space-ui="true">
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
                data-space-ui="true"
              />

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
                data-space-ui="true"
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
                    {selectedEntry.tags.slice(0, 6).map((tag) => (
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
                            style={{ width: `${Math.max(indicator.value * 100, 8)}%` }}
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
