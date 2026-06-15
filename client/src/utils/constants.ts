import type { EntryType } from "../types";

export const ENTRY_TYPE_OPTIONS: Array<{ value: EntryType; label: string; hint: string }> = [
  { value: "reflection", label: "个人反思", hint: "适合复盘念头、情绪、关系和自我观察" },
  { value: "podcast", label: "播客", hint: "记录听后感、观点、模型和被触发的地方" },
  { value: "exhibition", label: "看展", hint: "记录作品、空间、感官和现场印象" },
  { value: "music", label: "音乐", hint: "记录旋律、歌词、氛围和身体反应" },
  { value: "movement", label: "运动", hint: "记录训练状态、恢复节律和身体信号" },
  { value: "reading", label: "阅读", hint: "记录段落、概念、联想和思考脉络" },
  { value: "conversation", label: "对话", hint: "记录聊天、冲突、边界和关系波动" },
  { value: "dream", label: "梦境", hint: "记录意象、情绪残留和醒后的身体感受" },
  { value: "other", label: "其他", hint: "任何暂时不想被归类，但值得留住的体验" }
];

export const ENTRY_TYPE_LABELS: Record<EntryType, string> = Object.fromEntries(
  ENTRY_TYPE_OPTIONS.map((option) => [option.value, option.label])
) as Record<EntryType, string>;
