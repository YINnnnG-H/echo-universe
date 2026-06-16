import type { Emotion, Entry, EntryInput, EntryType, PersonalityIndicators } from "../types.js";
import { ARCHETYPE_KEYS } from "./constants.js";

const TAG_ALIASES: Record<string, string> = {
  podcast: "播客启发",
  "podcast inspiration": "播客启发",
  "cognitive model": "认知模型",
  cognition: "认知模型",
  music: "音乐共振",
  exhibition: "展览观看",
  reading: "阅读摘记",
  movement: "运动恢复",
  dream: "梦境回放",
  relation: "关系修复",
  relationship: "关系修复",
  attachment: "依恋模式",
  boundary: "边界练习",
  boundaries: "边界练习",
  anxiety: "焦虑波动",
  projection: "投射识别",
  creativity: "创作冲动",
  recovery: "节律恢复",
  "self-observation": "自我观察",
  "self observation": "自我观察",
  reflection: "自我观察",
  "body sensation": "身体感受",
  "somatic signal": "身体感受",
  "meaning making": "意义追问",
  "clear moment": "清醒时刻",
  "input content": "输入型内容",
  "creator clue": "创作者线索",
  "subconscious clue": "潜意识线索",
  "theme": "生活切片",
  "life slice": "生活切片",
  "自我成长": "自我整合",
  "边界感": "边界练习",
  "关系": "关系修复",
  "焦虑": "焦虑波动",
  "考试焦虑": "考试焦虑",
  "过度解读": "过度分析",
  "脑科学": "认知模型",
  "播客": "播客启发",
  "阅读": "阅读摘记",
  "看展": "展览观看",
  "梦境": "梦境回放",
  "潜意识": "潜意识线索",
  "运动": "运动恢复",
  "音乐": "音乐共振"
};

const INDICATOR_ALIASES: Record<string, string> = {
  ni: "直觉整合",
  ne: "发散联想",
  ti: "结构分析",
  te: "外部执行",
  fi: "自我感受",
  fe: "情感共鸣",
  si: "内在记忆",
  se: "身体感知",
  "self awareness": "自我感受",
  "self-awareness": "自我感受",
  "pattern insight": "直觉整合",
  "analytical thinking": "结构分析",
  "emotional resonance": "情感共鸣",
  "body awareness": "身体觉察",
  "boundary sense": "边界感",
  "attachment fluctuation": "依恋波动",
  "overthinking": "过度分析",
  "projection recognition": "投射识别",
  "anxiety": "焦虑水平",
  "clear moment": "清醒时刻",
  "meaning": "意义感",
  "recovery": "节律恢复",
  "creative drive": "创作驱力",
  "relationship sensitivity": "关系敏感",
  "身体感受": "身体觉察",
  "身体觉察": "身体觉察",
  "边界练习": "边界感",
  "清醒": "清醒时刻",
  "焦虑": "焦虑水平",
  "释然": "节律恢复",
  "满足": "自我感受",
  "投射识别": "投射识别",
  "过度分析": "过度分析",
  "依恋模式": "依恋波动",
  "依恋波动": "依恋波动",
  "意义感": "意义感",
  "节律恢复": "节律恢复",
  "战士": "战士原型",
  "孤儿": "孤儿原型",
  "疗愈者": "疗愈者原型",
  "女王": "女王原型",
  "智者": "智者原型",
  "寻找者": "寻找者原型",
  "战士原型": "战士原型",
  "孤儿原型": "孤儿原型",
  "疗愈者原型": "疗愈者原型",
  "女王原型": "女王原型",
  "智者原型": "智者原型",
  "寻找者原型": "寻找者原型"
};

function canonicalizeToken(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}

function mergeIndicator(target: PersonalityIndicators, key: string, value: number | boolean) {
  const nextValue = typeof value === "boolean" ? (value ? 1 : 0) : value;
  const currentValue = typeof target[key] === "boolean" ? ((target[key] as boolean) ? 1 : 0) : Number(target[key] || 0);
  target[key] = clamp01(Math.max(currentValue, nextValue));
}

export function normalizeTags(tags: string[]) {
  const normalized: string[] = [];

  for (const rawTag of tags) {
    const trimmed = rawTag.trim();
    if (!trimmed) {
      continue;
    }

    const canonical = TAG_ALIASES[canonicalizeToken(trimmed)] || trimmed;
    if (!normalized.includes(canonical)) {
      normalized.push(canonical);
    }
  }

  return normalized;
}

export function normalizeIndicators(indicators: PersonalityIndicators) {
  const normalized: PersonalityIndicators = {};

  for (const [rawKey, rawValue] of Object.entries(indicators || {})) {
    const canonical = INDICATOR_ALIASES[canonicalizeToken(rawKey)] || rawKey.trim();
    if (!canonical) {
      continue;
    }

    if (typeof rawValue === "boolean") {
      mergeIndicator(normalized, canonical, rawValue ? 1 : 0);
      continue;
    }

    const numeric = Number(rawValue);
    if (!Number.isFinite(numeric)) {
      continue;
    }

    mergeIndicator(normalized, canonical, numeric);
  }

  return normalized;
}

function bump(scores: Record<(typeof ARCHETYPE_KEYS)[number], number>, key: (typeof ARCHETYPE_KEYS)[number], amount: number) {
  scores[key] = clamp01(scores[key] + amount);
}

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

export function deriveArchetypeIndicators(params: {
  entry_type?: EntryType;
  raw_text?: string;
  tags: string[];
  emotion?: Emotion;
  personality_indicators: PersonalityIndicators;
}) {
  const text = `${params.raw_text || ""} ${params.tags.join(" ")}`;
  const indicators = params.personality_indicators;
  const scores: Record<(typeof ARCHETYPE_KEYS)[number], number> = {
    孤儿原型: 0.08,
    战士原型: 0.08,
    疗愈者原型: 0.08,
    女王原型: 0.08,
    智者原型: 0.08,
    寻找者原型: 0.08
  };

  if (params.emotion === "negative" || includesAny(text, ["焦虑", "无助", "孤独", "害怕", "考试"])) {
    bump(scores, "孤儿原型", 0.26);
  }
  if (includesAny(text, ["边界", "说不", "坚持", "行动", "冲突", "勇敢"])) {
    bump(scores, "战士原型", 0.32);
  }
  if (includesAny(text, ["修复", "恢复", "安抚", "照顾", "疗愈", "身体", "休息"])) {
    bump(scores, "疗愈者原型", 0.28);
  }
  if (includesAny(text, ["决定", "主体性", "选择", "价值", "掌控", "边界"])) {
    bump(scores, "女王原型", 0.24);
  }
  if (includesAny(text, ["理解", "分析", "模型", "阅读", "播客", "认知", "意义"])) {
    bump(scores, "智者原型", 0.3);
  }
  if (includesAny(text, ["探索", "展览", "旅行", "新鲜", "感官", "寻找", "可能"])) {
    bump(scores, "寻找者原型", 0.28);
  }

  if (params.tags.includes("依恋模式") || params.tags.includes("焦虑波动")) {
    bump(scores, "孤儿原型", 0.18);
  }
  if (params.tags.includes("边界练习") || params.tags.includes("关系修复")) {
    bump(scores, "战士原型", 0.16);
    bump(scores, "女王原型", 0.12);
  }
  if (params.tags.includes("身体感受") || params.tags.includes("节律恢复")) {
    bump(scores, "疗愈者原型", 0.18);
  }
  if (params.tags.includes("阅读摘记") || params.tags.includes("认知模型")) {
    bump(scores, "智者原型", 0.18);
  }
  if (params.tags.includes("展览观看") || params.tags.includes("感官打开")) {
    bump(scores, "寻找者原型", 0.2);
  }

  const structureAnalysis = Number(indicators["结构分析"] || 0);
  const intuition = Number(indicators["直觉整合"] || 0);
  const selfSense = Number(indicators["自我感受"] || 0);
  const emotionalResonance = Number(indicators["情感共鸣"] || 0);
  const boundary = Number(indicators["边界感"] || 0);
  const anxiety = Number(indicators["焦虑水平"] || 0);
  const recovery = Number(indicators["节律恢复"] || 0);
  const meaning = Number(indicators["意义感"] || 0);

  bump(scores, "智者原型", structureAnalysis * 0.28 + intuition * 0.12 + meaning * 0.12);
  bump(scores, "疗愈者原型", emotionalResonance * 0.18 + recovery * 0.24 + selfSense * 0.1);
  bump(scores, "战士原型", boundary * 0.26);
  bump(scores, "女王原型", selfSense * 0.18 + boundary * 0.12);
  bump(scores, "孤儿原型", anxiety * 0.22);
  bump(scores, "寻找者原型", intuition * 0.12 + meaning * 0.18);

  return scores;
}

export function normalizeInsightPayload(payload: {
  entry_type?: EntryType;
  raw_text?: string;
  emotion?: Emotion;
  tags: string[];
  personality_indicators: PersonalityIndicators;
}) {
  const tags = normalizeTags(payload.tags);
  const personalityIndicators = normalizeIndicators(payload.personality_indicators);
  const archetypes = deriveArchetypeIndicators({
    entry_type: payload.entry_type,
    raw_text: payload.raw_text,
    emotion: payload.emotion,
    tags,
    personality_indicators: personalityIndicators
  });

  for (const [key, value] of Object.entries(archetypes)) {
    mergeIndicator(personalityIndicators, key, value);
  }

  return {
    tags,
    personality_indicators: personalityIndicators
  };
}

export function normalizeEntryInsights(entry: Pick<Entry, "entry_type" | "raw_text" | "emotion" | "tags" | "personality_indicators">) {
  return normalizeInsightPayload({
    entry_type: entry.entry_type,
    raw_text: entry.raw_text,
    emotion: entry.emotion,
    tags: entry.tags,
    personality_indicators: entry.personality_indicators
  });
}

export function normalizeAnalysisInput(input: EntryInput, analysis: { emotion: Emotion; tags: string[]; personality_indicators: PersonalityIndicators }) {
  return normalizeInsightPayload({
    entry_type: input.entry_type,
    raw_text: input.raw_text,
    emotion: analysis.emotion,
    tags: analysis.tags,
    personality_indicators: analysis.personality_indicators
  });
}
