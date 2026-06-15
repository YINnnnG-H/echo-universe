import { motion } from "framer-motion";
import { Pencil, Trash2 } from "lucide-react";
import type { Entry } from "../types";
import { emotionLabel, formatDate, typeLabel } from "../utils/format";

interface EntryCardProps {
  entry: Entry;
  onEdit: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
}

export function EntryCard({ entry, onEdit, onDelete }: EntryCardProps) {
  const topIndicators = Object.entries(entry.personality_indicators).slice(0, 4);

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="rounded-[28px] border border-white/60 bg-white/90 p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-stone-400">
            <span>{formatDate(entry.occurred_at)}</span>
            <span className="rounded-full bg-shell px-2 py-1 text-[11px] tracking-[0.08em] text-stone-600">
              {typeLabel(entry.entry_type)}
            </span>
          </div>
          <h3 className="mt-2 text-lg font-semibold text-ink">{entry.title || entry.summary}</h3>
          <p className="mt-1 text-sm text-stone-500">{entry.summary}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(entry)}
            className="rounded-full bg-mist p-2 text-stone-600 transition hover:scale-[1.02]"
            aria-label="编辑笔记"
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(entry)}
            className="rounded-full bg-mist p-2 text-stone-600 transition hover:scale-[1.02]"
            aria-label="删除笔记"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <p className="line-clamp-4 text-[15px] leading-7 text-stone-600">{entry.raw_text}</p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-3xl bg-mist/70 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-stone-500">记录上下文</p>
          <div className="mt-3 space-y-1.5 text-sm text-stone-600">
            {entry.context.subject ? <p>主题: {entry.context.subject}</p> : null}
            {entry.context.creator ? <p>创作者: {entry.context.creator}</p> : null}
            {entry.context.location ? <p>地点: {entry.context.location}</p> : null}
            {entry.context.companions ? <p>同行/对话对象: {entry.context.companions}</p> : null}
            {entry.context.body_state ? <p>身体感受: {entry.context.body_state}</p> : null}
            {entry.context.energy !== undefined ? <p>能量值: {entry.context.energy}/5</p> : null}
          </div>
        </div>

        <div className="rounded-3xl bg-mist/80 p-4">
          <p className="text-sm font-medium text-ink">人格指标</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {topIndicators.map(([key, value]) => (
              <span key={key} className="rounded-pill bg-white px-3 py-1.5 text-xs text-stone-600 shadow-sm">
                {key}: {typeof value === "boolean" ? (value ? "是" : "否") : value.toFixed(2)}
              </span>
            ))}
            {entry.needs_retry ? (
              <span className="rounded-pill bg-amber-100 px-3 py-1.5 text-xs text-amber-700">待重试分析</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {entry.tags.map((tag) => (
          <span key={tag} className="rounded-pill bg-fog px-3 py-1.5 text-sm text-stone-600">
            #{tag}
          </span>
        ))}
        <span className="rounded-pill bg-shell px-3 py-1.5 text-sm text-stone-700">
          情绪: {emotionLabel(entry.emotion)}
        </span>
      </div>
    </motion.article>
  );
}
