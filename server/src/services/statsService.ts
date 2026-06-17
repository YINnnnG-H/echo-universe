import type { DashboardStats, EmotionPoint, Entry, PersonalityTimeline, TagStat, TypeStat } from "../types.js";
import { ARCHETYPE_KEYS, CORE_INDICATOR_KEYS, ENTRY_TYPE_LABELS } from "../utils/constants.js";

function toDateKey(timestamp: string) {
  return timestamp.slice(0, 10);
}

function toNumeric(value: number | boolean | undefined) {
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }
  return typeof value === "number" ? Number(value) : 0;
}

function buildTagStats(entries: Entry[]): TagStat[] {
  const counts = new Map<string, number>();

  for (const entry of entries) {
    for (const tag of entry.tags) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

function buildTypeStats(entries: Entry[]): TypeStat[] {
  const counts = new Map<string, number>();

  for (const entry of entries) {
    counts.set(entry.entry_type, (counts.get(entry.entry_type) || 0) + 1);
  }

  return [...counts.entries()]
    .map(([type, count]) => ({
      type: type as TypeStat["type"],
      label: ENTRY_TYPE_LABELS[type as keyof typeof ENTRY_TYPE_LABELS],
      count
    }))
    .sort((a, b) => b.count - a.count);
}

function buildPersonalityTimeline(entries: Entry[]): PersonalityTimeline {
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime()
  );
  const timeline = sortedEntries.map((entry) => toDateKey(entry.occurred_at));
  const indicatorSet = new Set<string>();

  for (const entry of sortedEntries) {
    Object.keys(entry.personality_indicators).forEach((key) => indicatorSet.add(key));
  }

  const orderedIndicators = [
    ...CORE_INDICATOR_KEYS.filter((key) => indicatorSet.has(key)),
    ...[...indicatorSet].filter((key) => !CORE_INDICATOR_KEYS.includes(key as (typeof CORE_INDICATOR_KEYS)[number]))
  ];

  const data: Record<string, number[]> = {};
  for (const indicator of orderedIndicators) {
    data[indicator] = sortedEntries.map((entry) => toNumeric(entry.personality_indicators[indicator]));
  }

  return { timeline, data };
}

function buildEmotionTimeline(entries: Entry[]): EmotionPoint[] {
  const grouped = new Map<string, EmotionPoint>();

  for (const entry of entries) {
    const date = toDateKey(entry.occurred_at);
    const point =
      grouped.get(date) ||
      ({
        date,
        positive: 0,
        neutral: 0,
        negative: 0
      } satisfies EmotionPoint);

    point[entry.emotion] += 1;
    grouped.set(date, point);
  }

  return [...grouped.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function buildArchetypeSummary(entries: Entry[]) {
  const result: Record<string, number> = {};

  for (const key of ARCHETYPE_KEYS) {
    result[key] = 0;
  }

  if (entries.length === 0) {
    return result;
  }

  for (const key of ARCHETYPE_KEYS) {
    const total = entries.reduce((sum, entry) => sum + toNumeric(entry.personality_indicators[key]), 0);
    result[key] = Number((total / entries.length).toFixed(2));
  }

  return result;
}

function buildThemeNetwork(entries: Entry[]) {
  const nodeCounts = new Map<string, number>();
  const pairCounts = new Map<string, number>();

  for (const entry of entries) {
    entry.tags.forEach((tag) => nodeCounts.set(tag, (nodeCounts.get(tag) || 0) + 1));

    for (let i = 0; i < entry.tags.length; i += 1) {
      for (let j = i + 1; j < entry.tags.length; j += 1) {
        const pair = [entry.tags[i], entry.tags[j]].sort().join("::");
        pairCounts.set(pair, (pairCounts.get(pair) || 0) + 1);
      }
    }
  }

  return {
    nodes: [...nodeCounts.entries()].map(([name, value]) => ({ name, value })),
    links: [...pairCounts.entries()].map(([pair, value]) => {
      const [source, target] = pair.split("::");
      return { source, target, value };
    })
  };
}

function buildWeeklySummary(entries: Entry[], tagStats: TagStat[]) {
  if (entries.length === 0) {
    return "这一周还没有新的回声。写下一条记录后，趋势和连接会慢慢出现。";
  }

  const latest = entries[0];
  const topTags = tagStats.slice(0, 3).map((item) => `#${item.tag}`).join(" · ");
  const strongestIndicator = Object.entries(latest.personality_indicators)
    .filter(([key]) => !ARCHETYPE_KEYS.includes(key as (typeof ARCHETYPE_KEYS)[number]))
    .map(([key, value]) => [key, toNumeric(value)] as const)
    .sort((a, b) => b[1] - a[1])[0];
  const latestType = ENTRY_TYPE_LABELS[latest.entry_type];

  return `这一周你最常回到 ${topTags || "#自我观察"}，最近一条${latestType}里最明显的信号是 ${strongestIndicator?.[0] || "反思深度"}。`;
}

export function buildDashboardStats(entries: Entry[]): DashboardStats {
  const tags = buildTagStats(entries);

  return {
    tags,
    type_counts: buildTypeStats(entries),
    personality: buildPersonalityTimeline(entries),
    emotions: buildEmotionTimeline(entries),
    archetypes: buildArchetypeSummary(entries),
    themeNetwork: buildThemeNetwork(entries),
    weeklySummary: buildWeeklySummary(entries, tags)
  };
}
