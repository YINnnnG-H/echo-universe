import { ENTRY_TYPE_LABELS } from "./constants";
import type { EntryType } from "../types";

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function formatDateInput(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
}

export function emotionLabel(emotion: "positive" | "neutral" | "negative") {
  switch (emotion) {
    case "positive":
      return "积极";
    case "negative":
      return "低落";
    default:
      return "平静";
  }
}

export function typeLabel(type: EntryType) {
  return ENTRY_TYPE_LABELS[type];
}
