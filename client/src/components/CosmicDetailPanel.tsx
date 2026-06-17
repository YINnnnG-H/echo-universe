import type { Entry } from "../types";
import { emotionLabel, formatDate, typeLabel } from "../utils/format";

interface CosmicDetailPanelProps {
  entry?: Entry;
  isDeleting?: boolean;
  onDelete?: (entry: Entry) => void | Promise<void>;
}

const archetypeKeys = new Set(["孤儿原型", "战士原型", "疗愈者原型", "女王原型", "智者原型", "寻找者原型"]);

function normalizeValue(value: number | boolean) {
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
}

export function CosmicDetailPanel({ entry, isDeleting = false, onDelete }: CosmicDetailPanelProps) {
  if (!entry) {
    return (
      <section className="rounded-[32px] border border-white/10 bg-white/6 p-5 backdrop-blur-xl">
        <p className="text-[11px] uppercase tracking-[0.3em] text-slate-300/60">Stellar Insight</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">选中一颗星</h2>
        <p className="mt-3 text-sm leading-7 text-slate-300/76">
          点击宇宙里的恒星或卫星，这里会展开它的摘要、原文、标签，以及更稳定的连续分析维度。
        </p>
      </section>
    );
  }

  const indicators = Object.entries(entry.personality_indicators)
    .filter(([key]) => !archetypeKeys.has(key))
    .map(([key, value]) => ({ key, value: normalizeValue(value) }))
    .sort((left, right) => right.value - left.value);

  const archetypes = Object.entries(entry.personality_indicators)
    .filter(([key]) => archetypeKeys.has(key))
    .map(([key, value]) => ({ key, value: normalizeValue(value) }))
    .filter((item) => item.value >= 0.2)
    .sort((left, right) => right.value - left.value);

  return (
    <section className="rounded-[32px] border border-white/10 bg-white/6 p-5 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-300/60">Stellar Insight</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>{typeLabel(entry.entry_type)}</span>
            <span>·</span>
            <span>{formatDate(entry.occurred_at)}</span>
            <span>·</span>
            <span>{emotionLabel(entry.emotion)}</span>
          </div>
        </div>

        {onDelete ? (
          <button
            type="button"
            onClick={() => void onDelete(entry)}
            disabled={isDeleting}
            className="rounded-full border border-rose-300/16 bg-rose-200/10 px-3 py-1.5 text-xs text-rose-100 transition hover:bg-rose-200/16 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? "删除中..." : "删除这颗星"}
          </button>
        ) : null}
      </div>

      <h2 className="mt-3 text-2xl font-semibold text-white">{entry.title || entry.summary}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-200/86">{entry.summary}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {entry.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-white/8 px-3 py-1 text-xs text-slate-300/82">
            #{tag}
          </span>
        ))}
      </div>

      {archetypes.length > 0 ? (
        <div className="mt-5 rounded-[24px] border border-white/8 bg-[#0b1728]/88 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">叙事母题</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {archetypes.map((item) => (
              <span key={item.key} className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-slate-200/86">
                {item.key} {item.value.toFixed(2)}
              </span>
            ))}
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-300/72">
            原型在这里被当作叙事母题，而不是人格定论。只有证据足够明显时，它才会出现。
          </p>
        </div>
      ) : null}

      <div className="mt-5 rounded-[24px] border border-white/8 bg-[#0b1728]/88 p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">原始记录</p>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-200/84">{entry.raw_text}</p>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className="rounded-[24px] border border-white/8 bg-[#0b1728]/88 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">上下文</p>
          <div className="mt-3 space-y-2 text-sm text-slate-200/82">
            {entry.context.subject ? <p>主题: {entry.context.subject}</p> : null}
            {entry.context.creator ? <p>作者 / 主播 / 艺术家: {entry.context.creator}</p> : null}
            {entry.context.location ? <p>地点: {entry.context.location}</p> : null}
            {entry.context.companions ? <p>同行者 / 对话对象: {entry.context.companions}</p> : null}
            {entry.context.body_state ? <p>身体感受: {entry.context.body_state}</p> : null}
            {entry.context.energy !== undefined ? <p>能量值: {entry.context.energy}/5</p> : null}
            <p>来源: {entry.source}</p>
          </div>
        </div>

        <div className="rounded-[24px] border border-white/8 bg-[#0b1728]/88 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">连续分析维度</p>
          <div className="mt-3 grid gap-3">
            {indicators.map((indicator) => (
              <div key={indicator.key} className="rounded-2xl bg-white/6 p-3">
                <div className="mb-2 flex items-center justify-between gap-2 text-sm">
                  <span className="text-slate-200">{indicator.key}</span>
                  <span className="text-slate-300/80">{indicator.value.toFixed(2)}</span>
                </div>
                <div className="h-2 rounded-full bg-white/8">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-[#8fb0d6] via-[#b98fa1] to-[#f4d7a1]"
                    style={{ width: `${Math.max(indicator.value * 100, 6)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
