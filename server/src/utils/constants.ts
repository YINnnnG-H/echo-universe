import type { Entry, EntryType } from "../types.js";

export const ARCHETYPE_KEYS = [
  "孤儿原型",
  "战士原型",
  "疗愈者原型",
  "女王原型",
  "智者原型",
  "寻找者原型"
] as const;

export const CORE_INDICATOR_KEYS = [
  "反思深度",
  "结构整合",
  "身体觉察",
  "情绪唤醒",
  "情绪效价",
  "自主感",
  "联结感",
  "胜任感",
  "意义感",
  "探索驱动",
  "恢复弹性",
  "过度分析",
  "关系敏感"
] as const;

export const PERSONALITY_LIBRARY = [...CORE_INDICATOR_KEYS, ...ARCHETYPE_KEYS] as const;

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
    raw_text: "今天又梦见高中老师。醒来以后我意识到，自己依然会在压力到来时回到考试焦虑和过度分析里。",
    summary: "梦境把考试焦虑和过度分析重新带回眼前。",
    tags: ["梦境回放", "考试焦虑", "过度分析", "潜意识线索"],
    emotion: "negative",
    personality_indicators: {
      反思深度: 0.68,
      情绪唤醒: 0.72,
      过度分析: 0.78,
      孤儿原型: 0.58
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
    raw_text: "听完关于预测编码的播客后，我突然更理解自己为什么总会提前预演关系冲突。知道原理以后，心里松了一点。",
    summary: "播客帮我看见关系预演背后的认知模型。",
    tags: ["播客启发", "认知模型", "依恋模式", "自我观察"],
    emotion: "positive",
    personality_indicators: {
      结构整合: 0.74,
      意义感: 0.6,
      过度分析: 0.46,
      智者原型: 0.66
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
