import type { DashboardStats, Entry } from "../types";

interface ObservationDeckProps {
  stats: DashboardStats | null;
  entries: Entry[];
}

const archetypeKeys = new Set(["孤儿原型", "战士原型", "疗愈者原型", "女王原型", "智者原型", "寻找者原型"]);

export function ObservationDeck({ stats, entries }: ObservationDeckProps) {
  const latest = entries[0];
  const topIndicators = latest
    ? Object.entries(latest.personality_indicators)
        .filter(([key]) => !archetypeKeys.has(key))
        .map(([key, value]) => ({
          key,
          value: typeof value === "boolean" ? (value ? 1 : 0) : value
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 4)
    : [];

  return (
    <section className="rounded-[32px] border border-white/10 bg-white/6 p-5 backdrop-blur-xl">
      <p className="text-[11px] uppercase tracking-[0.3em] text-slate-300/60">Observation Deck</p>
      <h2 className="mt-2 text-2xl font-semibold text-white">观星摘要</h2>
      <p className="mt-3 text-sm leading-7 text-slate-300/76">
        这里优先展示更稳定的连续维度，比如反思、身体觉察、意义感和恢复弹性。原型会保留在更高层的叙事解释里，而不是直接当成定论。
      </p>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className="rounded-[24px] border border-white/8 bg-[#0b1728]/88 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">高频主题</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(stats?.tags || []).slice(0, 8).map((tag) => (
              <span key={tag.tag} className="rounded-full bg-white/8 px-3 py-1 text-xs text-slate-300/82">
                #{tag.tag} {tag.count}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-white/8 bg-[#0b1728]/88 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">记录类型</p>
          <div className="mt-3 grid gap-2">
            {(stats?.type_counts || []).slice(0, 6).map((item) => (
              <div key={item.type} className="flex items-center justify-between text-sm text-slate-200/82">
                <span>{item.label}</span>
                <span>{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-white/8 bg-[#0b1728]/88 p-4 xl:col-span-2">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">最近一颗星的主信号</p>
          <p className="mt-2 text-sm leading-6 text-slate-300/72">
            这里优先展示连续维度，让你更容易比较不同记录之间的细微差异，而不是看到一整排相同的满分。
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {topIndicators.map((indicator) => (
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
