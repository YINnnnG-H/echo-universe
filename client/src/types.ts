export type Emotion = "positive" | "neutral" | "negative";

export type EntryType =
  | "reflection"
  | "podcast"
  | "exhibition"
  | "music"
  | "movement"
  | "reading"
  | "conversation"
  | "dream"
  | "other";

export type PersonalityIndicators = Record<string, number | boolean>;

export interface EntryContext {
  subject?: string;
  creator?: string;
  location?: string;
  companions?: string;
  body_state?: string;
  energy?: number;
}

export interface Entry {
  id: string;
  title: string;
  entry_type: EntryType;
  raw_text: string;
  summary: string;
  tags: string[];
  emotion: Emotion;
  personality_indicators: PersonalityIndicators;
  context: EntryContext;
  source: string;
  device: string;
  occurred_at: string;
  created_at: string;
  updated_at: string;
  needs_retry: boolean;
}

export interface EntryDraft {
  title?: string;
  entry_type?: EntryType;
  raw_text: string;
  context?: EntryContext;
  source?: string;
  device?: string;
  occurred_at?: string;
}

export interface TagStat {
  tag: string;
  count: number;
}

export interface TypeStat {
  type: EntryType;
  label: string;
  count: number;
}

export interface PersonalityTimeline {
  timeline: string[];
  data: Record<string, number[]>;
}

export interface EmotionPoint {
  date: string;
  positive: number;
  neutral: number;
  negative: number;
}

export interface DashboardStats {
  tags: TagStat[];
  type_counts: TypeStat[];
  personality: PersonalityTimeline;
  emotions: EmotionPoint[];
  archetypes: Record<string, number>;
  themeNetwork: {
    nodes: Array<{ name: string; value: number }>;
    links: Array<{ source: string; target: string; value: number }>;
  };
  weeklySummary: string;
}

export interface AdminUserStat {
  user_id: string;
  email: string;
  created_at?: string;
  last_sign_in_at?: string;
  entry_count: number;
  latest_entry_at?: string;
  top_tags: TagStat[];
}

export interface AdminUsersResponse {
  users: AdminUserStat[];
}
