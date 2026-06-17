import type { Emotion, Entry, EntryInput, EntryType, PersonalityIndicators } from "../types.js";
import { ARCHETYPE_KEYS } from "./constants.js";

const TAG_ALIASES: Record<string, string> = {
  podcast: "播客启发",
  "podcast inspiration": "播客启发",
  cognition: "认知模型",
  "cognitive model": "认知模型",
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
  reflection: "自我观察",
  "self-observation": "自我观察",
  "body sensation": "身体感受",
  "somatic signal": "身体感受",
  "meaning making": "意义追问",
  "clear moment": "清醒时刻",
  "input content": "输入型内容",
  "creator clue": "创作者线索",
  "subconscious clue": "潜意识线索",
  theme: "生活切片",
  "life slice": "生活切片"
};

const INDICATOR_ALIASES: Record<string, string> = {
  "self awareness": "反思深度",
  "self-awareness": "反思深度",
  reflection: "反思深度",
  "pattern insight": "结构整合",
  "analytical thinking": "结构整合",
  "body awareness": "身体觉察",
  "somatic awareness": "身体觉察",
  "boundary sense": "自主感",
  "attachment fluctuation": "关系敏感",
  "relationship sensitivity": "关系敏感",
  "overthinking": "过度分析",
  "projection recognition": "过度分析",
  "anxiety": "情绪唤醒",
  "clear moment": "意义感",
  "meaning": "意义感",
  "recovery": "恢复弹性",
  "creative drive": "探索驱动",
  ni: "结构整合",
  ne: "探索驱动",
  ti: "结构整合",
  te: "胜任感",
  fi: "反思深度",
  fe: "联结感",
  si: "身体觉察",
  se: "情绪唤醒",
  "自我感受": "反思深度",
  "直觉整合": "结构整合",
  "结构分析": "结构整合",
  "结构化思考": "结构整合",
  "情感共鸣": "联结感",
  "关系敏感": "关系敏感",
  "焦虑水平": "情绪唤醒",
  "情绪安定": "情绪效价",
  "边界感": "自主感",
  "身体感知": "身体觉察",
  "身体觉察": "身体觉察",
  "节律恢复": "恢复弹性",
  "创作驱力": "探索驱动",
  "清醒时刻": "意义感",
  "意义感": "意义感",
  "恢复能力": "恢复弹性",
  "胜任感": "胜任感",
  "联结感": "联结感",
  "自主感": "自主感",
  "过度分析": "过度分析",
  "情绪唤醒": "情绪唤醒",
  "情绪效价": "情绪效价",
  "探索驱动": "探索驱动",
  "反思深度": "反思深度",
  "恢复弹性": "恢复弹性",
  "孤儿原型": "孤儿原型",
  "战士原型": "战士原型",
  "疗愈者原型": "疗愈者原型",
  "女王原型": "女王原型",
  "智者原型": "智者原型",
  "寻找者原型": "寻找者原型"
};

function canonicalizeToken(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function clampScore(value: number, max = 0.92) {
  return Math.max(0, Math.min(max, Number(value.toFixed(2))));
}

function normalizeSignal(value: number | boolean) {
  if (typeof value === "boolean") {
    return value ? 0.76 : 0;
  }
  return clampScore(value);
}

function mergeIndicator(target: PersonalityIndicators, key: string, value: number | boolean) {
  const nextValue = normalizeSignal(value);
  const currentValue = normalizeSignal(target[key] || 0);
  target[key] = clampScore(Math.max(currentValue, nextValue));
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

    const numeric = normalizeSignal(rawValue);
    if (!Number.isFinite(numeric)) {
      continue;
    }

    mergeIndicator(normalized, canonical, numeric);
  }

  return normalized;
}

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function deriveArchetypeIndicators(params: {
  entry_type?: EntryType;
  raw_text?: string;
  tags: string[];
  emotion?: Emotion;
  personality_indicators: PersonalityIndicators;
}) {
  const text = `${params.raw_text || ""} ${params.tags.join(" ")}`;
  const indicators = params.personality_indicators;
  const evidence: Record<(typeof ARCHETYPE_KEYS)[number], number> = {
    孤儿原型: 0,
    战士原型: 0,
    疗愈者原型: 0,
    女王原型: 0,
    智者原型: 0,
    寻找者原型: 0
  };

  const reflection = Number(indicators["反思深度"] || 0);
  const structure = Number(indicators["结构整合"] || 0);
  const body = Number(indicators["身体觉察"] || 0);
  const arousal = Number(indicators["情绪唤醒"] || 0);
  const valence = Number(indicators["情绪效价"] || 0.5);
  const autonomy = Number(indicators["自主感"] || 0);
  const relatedness = Number(indicators["联结感"] || 0);
  const competence = Number(indicators["胜任感"] || 0);
  const meaning = Number(indicators["意义感"] || 0);
  const exploration = Number(indicators["探索驱动"] || 0);
  const recovery = Number(indicators["恢复弹性"] || 0);
  const overthinking = Number(indicators["过度分析"] || 0);
  const sensitivity = Number(indicators["关系敏感"] || 0);

  evidence["孤儿原型"] += arousal * 0.35 + overthinking * 0.22 + sensitivity * 0.16 + (0.5 - valence) * 0.22;
  evidence["战士原型"] += autonomy * 0.42 + competence * 0.18 + (includesAny(text, ["边界", "拒绝", "坚持", "表达需求"]) ? 0.16 : 0);
  evidence["疗愈者原型"] += body * 0.26 + recovery * 0.34 + relatedness * 0.14 + (includesAny(text, ["安抚", "照顾", "修复", "休息"]) ? 0.12 : 0);
  evidence["女王原型"] += autonomy * 0.28 + competence * 0.28 + meaning * 0.12 + (includesAny(text, ["决定", "选择", "掌控", "主体"]) ? 0.12 : 0);
  evidence["智者原型"] += structure * 0.38 + reflection * 0.18 + meaning * 0.18 + (includesAny(text, ["模型", "理解", "分析", "阅读", "播客"]) ? 0.12 : 0);
  evidence["寻找者原型"] += exploration * 0.38 + meaning * 0.14 + valence * 0.08 + (includesAny(text, ["展览", "旅行", "新鲜", "可能"]) ? 0.14 : 0);

  if (params.emotion === "negative") {
    evidence["孤儿原型"] += 0.06;
  }
  if (params.tags.includes("关系修复")) {
    evidence["疗愈者原型"] += 0.08;
    evidence["战士原型"] += 0.05;
  }
  if (params.tags.includes("认知模型")) {
    evidence["智者原型"] += 0.08;
  }
  if (params.tags.includes("运动恢复") || params.tags.includes("身体感受")) {
    evidence["疗愈者原型"] += 0.08;
  }
  if (params.tags.includes("展览观看") || params.tags.includes("感官打开")) {
    evidence["寻找者原型"] += 0.08;
  }

  const ranked = Object.entries(evidence)
    .map(([key, value]) => [key, clampScore(value, 1)] as const)
    .sort((a, b) => b[1] - a[1]);

  const result: PersonalityIndicators = {};
  const strongest = ranked[0];
  const second = ranked[1];

  if (strongest && strongest[1] >= 0.38) {
    result[strongest[0]] = clampScore(0.42 + strongest[1] * 0.46, 0.86);
  }

  if (second && second[1] >= 0.46 && strongest && strongest[1] - second[1] <= 0.18) {
    result[second[0]] = clampScore(0.34 + second[1] * 0.4, 0.78);
  }

  return result;
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
