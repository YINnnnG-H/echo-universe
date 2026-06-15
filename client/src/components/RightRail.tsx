import ReactECharts from "echarts-for-react";
import type { DashboardStats } from "../types";

interface RightRailProps {
  stats: DashboardStats | null;
  activeTag: string;
  onSelectTag: (tag: string) => void;
}

export function RightRail({ stats, activeTag, onSelectTag }: RightRailProps) {
  const networkOption = stats
    ? {
        tooltip: {
          backgroundColor: "rgba(28, 28, 28, 0.78)",
          borderRadius: 14,
          textStyle: { color: "#fff" }
        },
        series: [
          {
            type: "graph",
            layout: "force",
            roam: false,
            force: {
              repulsion: 150,
              edgeLength: [54, 108]
            },
            label: {
              show: true,
              color: "#4d443d",
              fontSize: 12
            },
            lineStyle: {
              color: "rgba(122,122,122,0.32)",
              width: 1.4,
              curveness: 0.12
            },
            itemStyle: {
              color: "#D4A373",
              shadowBlur: 12,
              shadowColor: "rgba(212,163,115,0.18)"
            },
            data: stats.themeNetwork.nodes.slice(0, 10).map((node) => ({
              ...node,
              symbolSize: 16 + node.value * 7
            })),
            links: stats.themeNetwork.links.slice(0, 16).map((link) => ({
              ...link,
              lineStyle: {
                width: 1 + link.value * 0.6
              }
            }))
          }
        ]
      }
    : null;

  const trendEntries = stats
    ? Object.entries(stats.personality.data)
        .map(([name, values]) => ({
          name,
          latest: values.at(-1) || 0,
          delta: (values.at(-1) || 0) - (values.at(-2) || 0)
        }))
        .sort((a, b) => b.latest - a.latest)
        .slice(0, 5)
    : [];

  return (
    <aside className="space-y-5">
      <div className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-soft">
        <p className="text-xs uppercase tracking-[0.22em] text-stone-500">本周概览</p>
        <h2 className="mt-2 text-lg font-semibold text-ink">回声回看</h2>
        <p className="mt-3 text-sm leading-7 text-stone-600">
          {stats?.weeklySummary || "正在整理你的笔记趋势..."}
        </p>
      </div>

      <section className="rounded-[28px] border border-white/60 bg-white/85 p-4 shadow-soft">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">标签云</h2>
          <span className="text-xs text-stone-500">{stats?.tags.length || 0} 个主题</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(stats?.tags || []).map((tag) => (
            <button
              key={tag.tag}
              type="button"
              onClick={() => onSelectTag(tag.tag)}
              className={`rounded-pill px-3 py-2 text-sm transition hover:scale-[1.02] ${
                activeTag === tag.tag ? "bg-sage text-ink shadow-soft" : "bg-fog text-stone-600 hover:bg-shell"
              }`}
              style={{ fontSize: `${0.88 + Math.min(tag.count, 5) * 0.08}rem` }}
            >
              #{tag.tag} <span className="opacity-70">{tag.count}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-white/60 bg-white/85 p-4 shadow-soft">
        <div className="mb-3">
          <p className="text-xs uppercase tracking-[0.22em] text-stone-500">连接图</p>
          <h2 className="text-sm font-semibold text-ink">主题关系</h2>
        </div>
        {networkOption ? (
          <ReactECharts option={networkOption} style={{ height: 260 }} />
        ) : (
          <p className="text-sm text-stone-500">写几条记录之后，这里会长出带权重的主题网络。</p>
        )}
      </section>

      <section className="rounded-[28px] border border-white/60 bg-white/85 p-4 shadow-soft">
        <div className="mb-3">
          <p className="text-xs uppercase tracking-[0.22em] text-stone-500">高频信号</p>
          <h2 className="text-sm font-semibold text-ink">近期人格脉络</h2>
        </div>
        <div className="space-y-3">
          {trendEntries.map((item) => (
            <div key={item.name} className="rounded-2xl bg-mist/80 p-3">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-ink">{item.name}</span>
                <span className={`${item.delta >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                  {item.delta >= 0 ? "+" : ""}
                  {item.delta.toFixed(2)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-white">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-sage to-clay"
                  style={{ width: `${Math.max(item.latest * 100, 8)}%` }}
                />
              </div>
            </div>
          ))}
          {trendEntries.length === 0 ? <p className="text-sm text-stone-500">还没有足够的数据。</p> : null}
        </div>
      </section>
    </aside>
  );
}
