import type { Entry, EntryType } from "../types.js";

export const ARCHETYPE_KEYS = [
  "孤儿原型",
  "战士原型",
  "疗愈者原型",
  "女王原型",
  "智者原型",
  "寻找者原型"
] as const;

export const PERSONALITY_LIBRARY = [
  "直觉整合",
  "发散联想",
  "结构分析",
  "外部执行",
  "自我感受",
  "情感共鸣",
  "内在记忆",
  "身体感知",
  "边界感",
  "依恋波动",
  "过度分析",
  "投射识别",
  "关系敏感",
  "焦虑水平",
  "清醒时刻",
  "意义感",
  "节律恢复",
  "创作驱力",
  "身体觉察",
  ...ARCHETYPE_KEYS
] as const;

export const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  reflection: "个人反思",
  podcast: "播客",
  exhibition: "看展",
  music: "音乐",
  movement: "运动",
  reading: "阅读",
  conversation: "对话",
  dream: "梦境",
  other: "其他"
};

export const ENTRY_TYPE_OPTIONS = Object.entries(ENTRY_TYPE_LABELS).map(([value, label]) => ({
  value: value as EntryType,
  label
}));

export const SAMPLE_ENTRIES: Entry[] = [
  {
    id: "6c71220d-f69f-49b7-8dfd-83c6bc4e21b0",
    title: "反复出现的考试梦",
    entry_type: "dream",
    raw_text: "今天又梦到高中老师，醒来后发现自己还在为考试焦虑。也许我一直在用过度分析保护内心的无助。",
    summary: "梦境把考试焦虑和过度分析重新带回当下。",
    tags: ["梦境回放", "考试焦虑", "过度分析", "潜意识线索"],
    emotion: "negative",
    personality_indicators: {
      直觉整合: 0.78,
      焦虑水平: 0.88,
      过度分析: 0.81,
      孤儿原型: 0.62
    },
    context: {
      subject: "高中老师",
      body_state: "醒来时心跳偏快",
      energy: 2
    },
    source: "mobile-web",
    device: "iPhone",
    occurred_at: "2026-06-10T08:30:00.000Z",
    created_at: "2026-06-10T08:45:00.000Z",
    updated_at: "2026-06-10T08:45:00.000Z",
    needs_retry: false
  },
  {
    id: "895f456d-7f91-4c2b-9a86-1948381c310a",
    title: "预测编码那一集播客",
    entry_type: "podcast",
    raw_text: "听完一集关于预测编码的播客后，我突然理解了自己为什么总想提前预演关系冲突。知道原理以后，心里松了一点。",
    summary: "播客帮助我看见了关系预演背后的认知模型。",
    tags: ["播客启发", "认知模型", "依恋模式", "自我观察"],
    emotion: "positive",
    personality_indicators: {
      直觉整合: 0.72,
      结构分析: 0.66,
      依恋波动: 0.46,
      智者原型: 0.74
    },
    context: {
      subject: "预测编码",
      creator: "心理播客",
      location: "通勤路上",
      energy: 3
    },
    source: "desktop-web",
    device: "MacBook",
    occurred_at: "2026-06-12T13:00:00.000Z",
    created_at: "2026-06-12T13:20:00.000Z",
    updated_at: "2026-06-12T13:20:00.000Z",
    needs_retry: false
  }
];
