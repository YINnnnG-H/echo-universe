import type { Entry, EntryType } from "../types.js";

export const PERSONALITY_LIBRARY = [
  "Ni",
  "Ne",
  "Ti",
  "Te",
  "Fi",
  "Fe",
  "Si",
  "Se",
  "向下兼容",
  "过度分析",
  "投射识别",
  "他者中心化",
  "边界感",
  "内耗",
  "焦虑",
  "满足",
  "释然",
  "割裂",
  "孤儿",
  "战士",
  "疗愈者",
  "女王",
  "智者",
  "寻找者",
  "清醒",
  "意义感",
  "恢复力",
  "依恋波动"
];

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
    id: "e1",
    title: "反复出现的考试梦",
    entry_type: "dream",
    raw_text:
      "今天又梦到高中老师，醒来后发现自己还在为考试焦虑。也许我一直在用过度分析保护内心的无助。",
    summary: "梦境把考试焦虑和过度分析重新带回了当下。",
    tags: ["梦境回放", "考试焦虑", "过度分析", "无助感"],
    emotion: "negative",
    personality_indicators: {
      Ni: 0.82,
      焦虑: 0.9,
      过度分析: 0.84,
      孤儿: 0.58
    },
    context: {
      subject: "高中老师",
      location: "家里",
      body_state: "醒来时心跳很快",
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
    id: "e2",
    title: "预测编码那一集播客",
    entry_type: "podcast",
    raw_text:
      "听完一集关于预测编码的播客后，我突然理解了自己为什么总想提前预演关系冲突。知道原理以后，心里松了一点。",
    summary: "播客帮我看见了关系预演背后的认知模型。",
    tags: ["播客启发", "认知模型", "依恋模式", "自我观察"],
    emotion: "positive",
    personality_indicators: {
      Ni: 0.74,
      Ti: 0.69,
      释然: 0.66,
      他者中心化: 0.36
    },
    context: {
      subject: "预测编码",
      creator: "某心理学播客",
      location: "通勤路上",
      companions: "独处",
      energy: 3
    },
    source: "desktop-web",
    device: "MacBook",
    occurred_at: "2026-06-12T13:00:00.000Z",
    created_at: "2026-06-12T13:20:00.000Z",
    updated_at: "2026-06-12T13:20:00.000Z",
    needs_retry: false
  },
  {
    id: "e3",
    title: "第一次没有再向下兼容",
    entry_type: "conversation",
    raw_text:
      "和朋友聊完以后，我第一次没有立刻向下兼容，而是坦白说出自己的边界。那一刻很像战士原型终于醒了一下。",
    summary: "说出边界的时刻，让战士原型变得更清晰。",
    tags: ["关系修复", "边界练习", "战士原型", "自我整合"],
    emotion: "positive",
    personality_indicators: {
      Fe: 0.62,
      向下兼容: 0.14,
      战士: 0.86,
      边界感: 0.93
    },
    context: {
      companions: "朋友",
      location: "咖啡馆",
      body_state: "说完以后肩膀松开了",
      energy: 4
    },
    source: "mobile-web",
    device: "Android",
    occurred_at: "2026-06-14T18:00:00.000Z",
    created_at: "2026-06-14T18:12:00.000Z",
    updated_at: "2026-06-14T18:12:00.000Z",
    needs_retry: false
  },
  {
    id: "e4",
    title: "展览里的镜面装置",
    entry_type: "exhibition",
    raw_text:
      "看展时在镜面装置前停了很久，感觉自己像被迫看见了平时习惯躲开的那部分。那种不舒服里又有一点清醒。",
    summary: "镜面装置触发了对自我回避模式的观看。",
    tags: ["展览观看", "投射识别", "自我观察", "清醒时刻"],
    emotion: "neutral",
    personality_indicators: {
      Fi: 0.63,
      Ni: 0.61,
      投射识别: 0.56,
      智者: 0.3
    },
    context: {
      subject: "镜面装置",
      location: "美术馆",
      companions: "独处",
      energy: 3
    },
    source: "mobile-web",
    device: "iPhone",
    occurred_at: "2026-06-15T15:20:00.000Z",
    created_at: "2026-06-15T16:00:00.000Z",
    updated_at: "2026-06-15T16:00:00.000Z",
    needs_retry: false
  }
];
