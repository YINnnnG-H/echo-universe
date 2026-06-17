import type { AnalysisResult, Emotion, EntryInput, EntryType, PersonalityIndicators } from "../types.js";
import { ENTRY_TYPE_LABELS } from "./constants.js";
import { normalizeAnalysisInput } from "./insightNormalization.js";

const fallbackTags = ["自我观察", "生活切片", "回声线索"];

const emotionRules: Array<{ emotion: Emotion; words: string[] }> = [
  { emotion: "positive", words: ["释然", "满足", "开心", "轻松", "平静", "勇敢", "清楚", "松开", "被理解", "舒服"] },
  { emotion: "negative", words: ["焦虑", "难过", "崩溃", "内耗", "害怕", "痛苦", "无助", "压抑", "卡住", "紧绷"] }
];

const tagGroups = [
  { tag: "梦境回放", words: ["梦", "梦境", "做梦"] },
  { tag: "潜意识线索", words: ["潜意识", "反复出现", "隐隐觉得"] },
  { tag: "考试焦虑", words: ["考试", "复习", "成绩", "老师", "作业"] },
  { tag: "依恋模式", words: ["关系", "亲密", "靠近", "疏离", "依恋", "被抛下", "预演冲突"] },
  { tag: "边界练习", words: ["边界", "拒绝", "坦白", "表达需求", "说不"] },
  { tag: "播客启发", words: ["播客", "podcast"] },
  { tag: "认知模型", words: ["预测编码", "脑科学", "认知", "神经", "大脑", "模型"] },
  { tag: "展览观看", words: ["展", "展览", "美术馆", "装置", "策展"] },
  { tag: "音乐共振", words: ["音乐", "歌", "旋律", "专辑", "耳机", "歌词", "和声"] },
  { tag: "运动恢复", words: ["运动", "跑步", "瑜伽", "力量", "心率", "拉伸", "恢复"] },
  { tag: "阅读摘记", words: ["阅读", "书", "章节", "作者", "句子", "摘录"] },
  { tag: "对话复盘", words: ["聊天", "对话", "讨论", "谈话", "争执", "沟通"] },
  { tag: "身体感受", words: ["身体", "心跳", "呼吸", "肩膀", "疲惫", "放松", "酸痛"] },
  { tag: "投射识别", words: ["投射", "代入", "误读", "镜像"] },
  { tag: "过度分析", words: ["分析", "想太多", "过度解读", "拆解", "复盘"] },
  { tag: "创作冲动", words: ["写", "创作", "表达", "作品", "灵感"] },
  { tag: "节律恢复", words: ["恢复", "休息", "睡眠", "节律", "作息"] },
  { tag: "自我整合", words: ["成长", "练习", "疗愈", "整合", "接住自己"] },
  { tag: "孤独感", words: ["孤独", "一个人", "空落", "落单"] },
  { tag: "意义追问", words: ["意义", "价值", "方向", "为什么"] },
  { tag: "清醒时刻", words: ["清醒", "看见", "意识到", "理解了"] },
  { tag: "感官打开", words: ["气味", "光线", "颜色", "触感", "声音", "空间"] },
  { tag: "关系修复", words: ["修复", "和好", "重新靠近", "说开了"] },
  { tag: "焦虑波动", words: ["焦虑", "紧张", "不安", "担心"] }
];

const typeDefaults: Record<EntryType, { tags: string[]; indicators: PersonalityIndicators }> = {
  reflection: {
    tags: ["自我观察"],
    indicators: { 反思深度: 0.42, 自主感: 0.28, 意义感: 0.22 }
  },
  podcast: {
    tags: ["播客启发", "认知模型", "输入型内容"],
    indicators: { 结构整合: 0.52, 意义感: 0.34, 探索驱动: 0.36 }
  },
  exhibition: {
    tags: ["展览观看", "感官打开"],
    indicators: { 身体觉察: 0.38, 探索驱动: 0.4, 情绪唤醒: 0.24 }
  },
  music: {
    tags: ["音乐共振", "身体感受"],
    indicators: { 身体觉察: 0.44, 情绪唤醒: 0.32, 联结感: 0.24 }
  },
  movement: {
    tags: ["运动恢复", "身体感受"],
    indicators: { 身体觉察: 0.48, 恢复弹性: 0.42, 胜任感: 0.26 }
  },
  reading: {
    tags: ["阅读摘记", "认知模型", "输入型内容"],
    indicators: { 结构整合: 0.5, 反思深度: 0.38, 意义感: 0.3 }
  },
  conversation: {
    tags: ["对话复盘", "关系修复"],
    indicators: { 联结感: 0.34, 关系敏感: 0.42, 自主感: 0.22 }
  },
  dream: {
    tags: ["梦境回放", "潜意识线索"],
    indicators: { 反思深度: 0.38, 情绪唤醒: 0.46, 意义感: 0.26 }
  },
  other: {
    tags: ["生活切片"],
    indicators: { 反思深度: 0.28, 身体觉察: 0.2 }
  }
};

function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function clamp(value: number, max = 0.92) {
  return Math.max(0, Math.min(max, Number(value.toFixed(2))));
}

function bump(indicators: PersonalityIndicators, key: string, amount: number, base = 0) {
  const current = typeof indicators[key] === "number" ? Number(indicators[key]) : base;
  indicators[key] = clamp(current + amount);
}

function getFullText(input: EntryInput) {
  return normalizeText(
    [
      input.title,
      input.raw_text,
      input.context?.subject,
      input.context?.creator,
      input.context?.location,
      input.context?.companions,
      input.context?.body_state
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function inferEmotion(text: string): Emotion {
  const positive = emotionRules[0].words.filter((word) => text.includes(word)).length;
  const negative = emotionRules[1].words.filter((word) => text.includes(word)).length;

  if (positive > negative) {
    return "positive";
  }

  if (negative > positive) {
    return "negative";
  }

  return "neutral";
}

function boostSpecificContext(input: EntryInput, scores: Map<string, number>) {
  const subject = input.context?.subject?.trim();
  if (subject && subject.length <= 12) {
    scores.set(subject, (scores.get(subject) || 0) + 1.2);
  }

  const title = input.title?.trim();
  if (title && title.length <= 16) {
    scores.set(title, (scores.get(title) || 0) + 0.9);
  }

  if (input.context?.body_state) {
    scores.set("身体感受", (scores.get("身体感受") || 0) + 1.1);
  }

  if (input.context?.creator && ["podcast", "reading", "music", "exhibition"].includes(input.entry_type || "reflection")) {
    scores.set("创作者线索", (scores.get("创作者线索") || 0) + 0.9);
  }
}

function inferTags(input: EntryInput, text: string) {
  const type = input.entry_type || "reflection";
  const scores = new Map<string, number>();

  for (const tag of typeDefaults[type].tags) {
    scores.set(tag, (scores.get(tag) || 0) + 2.1);
  }

  for (const group of tagGroups) {
    const hits = group.words.filter((word) => text.includes(word)).length;
    if (hits > 0) {
      scores.set(group.tag, (scores.get(group.tag) || 0) + hits * 2.6);
    }
  }

  boostSpecificContext(input, scores);

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag)
    .filter((tag, index, array) => array.indexOf(tag) === index)
    .slice(0, 6);
}

function inferIndicators(input: EntryInput, text: string, emotion: Emotion): PersonalityIndicators {
  const type = input.entry_type || "reflection";
  const indicators: PersonalityIndicators = { ...typeDefaults[type].indicators };
  const textLength = Math.min(text.length, 480);

  bump(indicators, "反思深度", Math.min(textLength / 700, 0.24), 0.18);

  if (text.includes("理解") || text.includes("模式") || text.includes("为什么") || text.includes("看见")) {
    bump(indicators, "结构整合", 0.18, 0.16);
    bump(indicators, "意义感", 0.12, 0.14);
  }

  if (text.includes("分析") || text.includes("拆解") || text.includes("想太多") || text.includes("过度解读")) {
    bump(indicators, "过度分析", 0.32, 0.18);
    bump(indicators, "结构整合", 0.1, 0.16);
  }

  if (text.includes("身体") || text.includes("呼吸") || text.includes("肩膀") || text.includes("心跳") || text.includes("酸痛")) {
    bump(indicators, "身体觉察", 0.3, 0.16);
  }

  if (text.includes("关系") || text.includes("朋友") || text.includes("伴侣") || text.includes("亲密")) {
    bump(indicators, "关系敏感", 0.24, 0.14);
    bump(indicators, "联结感", 0.16, 0.16);
  }

  if (text.includes("边界") || text.includes("拒绝") || text.includes("表达需求") || text.includes("说不")) {
    bump(indicators, "自主感", 0.28, 0.14);
  }

  if (text.includes("完成") || text.includes("做到") || text.includes("坚持") || text.includes("训练")) {
    bump(indicators, "胜任感", 0.26, 0.14);
  }

  if (text.includes("恢复") || text.includes("休息") || text.includes("睡眠") || text.includes("慢下来")) {
    bump(indicators, "恢复弹性", 0.28, 0.14);
  }

  if (text.includes("探索") || text.includes("好奇") || text.includes("新鲜") || text.includes("展览") || text.includes("旅行")) {
    bump(indicators, "探索驱动", 0.28, 0.16);
  }

  if (text.includes("意义") || text.includes("价值") || text.includes("方向")) {
    bump(indicators, "意义感", 0.26, 0.14);
  }

  if (emotion === "negative") {
    bump(indicators, "情绪唤醒", 0.24, 0.26);
    indicators["情绪效价"] = 0.24;
  } else if (emotion === "positive") {
    bump(indicators, "情绪唤醒", 0.14, 0.18);
    indicators["情绪效价"] = 0.76;
  } else {
    bump(indicators, "情绪唤醒", 0.1, 0.16);
    indicators["情绪效价"] = 0.52;
  }

  if (input.context?.energy !== undefined) {
    const normalizedEnergy = clamp(input.context.energy / 5, 1);
    indicators["情绪唤醒"] = clamp(
      (typeof indicators["情绪唤醒"] === "number" ? Number(indicators["情绪唤醒"]) : 0.2) * 0.6 + normalizedEnergy * 0.4
    );
  }

  return indicators;
}

function trimSummary(text: string) {
  if (text.length <= 48) {
    return text;
  }
  return `${text.slice(0, 46)}...`;
}

function inferSummary(input: EntryInput, tags: string[], emotion: Emotion) {
  const label = ENTRY_TYPE_LABELS[input.entry_type || "reflection"];
  const secondary = tags.find((tag) => tag !== label && tag !== "身体感受");

  if (input.title?.trim()) {
    return trimSummary(`${label}记录：${input.title.trim()}`);
  }

  if (input.context?.subject?.trim()) {
    return trimSummary(`${label}记录：${input.context.subject.trim()}`);
  }

  if (secondary) {
    const emotionLabel =
      emotion === "positive" ? "带来了一点松动" : emotion === "negative" ? "触发了明显波动" : "留下了可回看的线索";
    return trimSummary(`${label}里的${secondary}${emotionLabel}`);
  }

  return trimSummary(normalizeText(input.raw_text));
}

export function heuristicAnalyze(input: EntryInput): AnalysisResult {
  const fullText = getFullText(input);
  const emotion = inferEmotion(fullText);
  const rawTags = inferTags(input, fullText);
  const rawIndicators = inferIndicators(input, fullText, emotion);
  const normalized = normalizeAnalysisInput(input, {
    emotion,
    tags: rawTags.length > 0 ? rawTags : fallbackTags,
    personality_indicators: rawIndicators
  });

  return {
    summary: inferSummary(input, normalized.tags, emotion),
    tags: normalized.tags,
    emotion,
    personality_indicators: normalized.personality_indicators,
    needs_retry: false,
    provider: "heuristic"
  };
}
