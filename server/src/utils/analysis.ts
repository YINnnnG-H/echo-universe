import type { AnalysisResult, Emotion, EntryInput, EntryType, PersonalityIndicators } from "../types.js";
import { ENTRY_TYPE_LABELS } from "./constants.js";
import { normalizeAnalysisInput } from "./insightNormalization.js";

const fallbackTags = ["自我观察", "情绪切片", "回声线索"];

const emotionRules: Array<{ emotion: Emotion; words: string[] }> = [
  { emotion: "positive", words: ["释然", "满足", "开心", "轻松", "平静", "勇敢", "清晰", "松开", "被理解", "舒服"] },
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
  reflection: { tags: ["自我观察"], indicators: { 自我感受: 0.52, 直觉整合: 0.46 } },
  podcast: { tags: ["播客启发", "认知模型", "输入型内容"], indicators: { 直觉整合: 0.54, 结构分析: 0.62 } },
  exhibition: { tags: ["展览观看", "感官打开"], indicators: { 自我感受: 0.58, 身体感知: 0.48 } },
  music: { tags: ["音乐共振", "身体感受"], indicators: { 自我感受: 0.6, 情感共鸣: 0.46 } },
  movement: { tags: ["运动恢复", "身体感受"], indicators: { 身体感知: 0.64, 节律恢复: 0.42 } },
  reading: { tags: ["阅读摘记", "认知模型", "输入型内容"], indicators: { 结构分析: 0.6, 直觉整合: 0.48 } },
  conversation: { tags: ["对话复盘", "关系修复"], indicators: { 情感共鸣: 0.58, 关系敏感: 0.42 } },
  dream: { tags: ["梦境回放", "潜意识线索"], indicators: { 直觉整合: 0.7 } },
  other: { tags: ["生活切片"], indicators: { 自我感受: 0.5 } }
};

function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
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
    scores.set("身体感受", (scores.get("身体感受") || 0) + 1.2);
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
      scores.set(group.tag, (scores.get(group.tag) || 0) + hits * 2.8);
    }
  }

  boostSpecificContext(input, scores);

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag)
    .filter((tag, index, array) => array.indexOf(tag) === index)
    .slice(0, 6);
}

function inferIndicators(input: EntryInput, text: string): PersonalityIndicators {
  const type = input.entry_type || "reflection";
  const indicators: PersonalityIndicators = { ...typeDefaults[type].indicators };

  if (text.includes("关系") || text.includes("朋友") || text.includes("伴侣") || text.includes("亲密")) {
    indicators["情感共鸣"] = clamp((Number(indicators["情感共鸣"]) || 0.3) + 0.24);
    indicators["关系敏感"] = clamp((Number(indicators["关系敏感"]) || 0.2) + 0.28);
    indicators["依恋波动"] = clamp((Number(indicators["依恋波动"]) || 0.18) + 0.26);
  }

  if (text.includes("分析") || text.includes("理解") || text.includes("结构") || text.includes("模型")) {
    indicators["结构分析"] = clamp((Number(indicators["结构分析"]) || 0.34) + 0.28);
    indicators["过度分析"] = clamp((Number(indicators["过度分析"]) || 0.16) + 0.3);
  }

  if (text.includes("梦") || text.includes("预感") || text.includes("反复出现")) {
    indicators["直觉整合"] = clamp((Number(indicators["直觉整合"]) || 0.42) + 0.28);
  }

  if (text.includes("边界") || text.includes("说不") || text.includes("拒绝")) {
    indicators["边界感"] = clamp((Number(indicators["边界感"]) || 0.36) + 0.34);
  }

  if (text.includes("投射") || text.includes("镜像")) {
    indicators["投射识别"] = clamp((Number(indicators["投射识别"]) || 0.28) + 0.36);
  }

  if (text.includes("焦虑") || text.includes("不安") || text.includes("害怕")) {
    indicators["焦虑水平"] = clamp((Number(indicators["焦虑水平"]) || 0.32) + 0.42);
  }

  if (text.includes("清醒") || text.includes("意识到") || text.includes("看见")) {
    indicators["清醒时刻"] = clamp((Number(indicators["清醒时刻"]) || 0.22) + 0.38);
  }

  if (text.includes("意义") || text.includes("方向") || text.includes("价值")) {
    indicators["意义感"] = clamp((Number(indicators["意义感"]) || 0.24) + 0.36);
  }

  if (text.includes("恢复") || text.includes("休息") || text.includes("睡眠")) {
    indicators["节律恢复"] = clamp((Number(indicators["节律恢复"]) || 0.26) + 0.34);
  }

  if (text.includes("创作") || text.includes("表达") || text.includes("灵感")) {
    indicators["创作驱力"] = clamp((Number(indicators["创作驱力"]) || 0.24) + 0.34);
  }

  if (text.includes("身体") || text.includes("肩膀") || text.includes("呼吸") || text.includes("心跳")) {
    indicators["身体觉察"] = clamp((Number(indicators["身体觉察"]) || 0.3) + 0.32);
  }

  if (input.context?.energy !== undefined) {
    const normalizedEnergy = clamp(input.context.energy / 5);
    indicators["身体感知"] = clamp(Math.max(Number(indicators["身体感知"]) || 0, normalizedEnergy * 0.58));
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
      emotion === "positive" ? "带来了一些舒展" : emotion === "negative" ? "触发了明显波动" : "留下了可回看的线索";
    return trimSummary(`${label}里的${secondary}${emotionLabel}`);
  }

  return trimSummary(normalizeText(input.raw_text));
}

export function heuristicAnalyze(input: EntryInput): AnalysisResult {
  const fullText = getFullText(input);
  const emotion = inferEmotion(fullText);
  const rawTags = inferTags(input, fullText);
  const rawIndicators = inferIndicators(input, fullText);
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
