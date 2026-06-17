import ReactECharts from "echarts-for-react";
import { useEffect, useMemo, useState } from "react";
import type { DashboardStats } from "../types";

interface ChartsPanelProps {
  stats: DashboardStats;
}

const chartColors = ["#f4d7a1", "#8daa91", "#b98fa1", "#7fa7c9", "#7d79b7", "#93b4d6"];
const panelClass = "rounded-[28px] border border-white/10 bg-white/6 p-4 shadow-soft backdrop-blur-xl";

function useMobileChartMode() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia("(max-width: 768px)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(media.matches);
    update();

    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isMobile;
}

export function ChartsPanel({ stats }: ChartsPanelProps) {
  const isMobile = useMobileChartMode();
  const timelineIndicators = Object.entries(stats.personality.data).slice(0, 6);
  const archetypeValues = Object.values(stats.archetypes);

  const chartOpts = useMemo(
    () => ({
      renderer: isMobile ? ("svg" as const) : ("canvas" as const)
    }),
    [isMobile]
  );

  const commonProps = useMemo(
    () => ({
      opts: chartOpts,
      notMerge: true,
      lazyUpdate: true,
      style: { width: "100%" }
    }),
    [chartOpts]
  );

  const lineOption = {
    color: chartColors,
    animationDuration: isMobile ? 400 : 700,
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(8, 20, 35, 0.92)",
      borderRadius: 16,
      borderColor: "rgba(255,255,255,0.08)",
      textStyle: { color: "#f8fafc" }
    },
    legend: {
      top: 8,
      textStyle: { color: "rgba(226,232,240,0.72)" }
    },
    grid: { left: 16, right: 12, top: 54, bottom: 16, containLabel: true },
    xAxis: {
      type: "category",
      data: stats.personality.timeline,
      boundaryGap: false,
      axisLine: { lineStyle: { color: "rgba(255,255,255,0.12)" } },
      axisLabel: { color: "rgba(226,232,240,0.62)" }
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 1,
      axisLabel: { color: "rgba(226,232,240,0.62)" },
      splitLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } }
    },
    series: timelineIndicators.map(([name, data], index) => ({
      name,
      type: "line",
      smooth: true,
      showSymbol: !isMobile,
      symbolSize: 7,
      data,
      lineStyle: { width: 2.4 },
      areaStyle: {
        opacity: 0.14,
        color: chartColors[index % chartColors.length]
      }
    }))
  };

  const radarOption = {
    animationDuration: isMobile ? 400 : 700,
    tooltip: {
      backgroundColor: "rgba(8, 20, 35, 0.92)",
      borderRadius: 16,
      borderColor: "rgba(255,255,255,0.08)",
      textStyle: { color: "#f8fafc" }
    },
    radar: {
      radius: isMobile ? "56%" : "62%",
      axisName: { color: "rgba(226,232,240,0.74)" },
      splitArea: {
        areaStyle: {
          color: ["rgba(255,255,255,0.03)", "rgba(255,255,255,0.01)"]
        }
      },
      splitLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
      indicator: Object.keys(stats.archetypes).map((key) => ({ name: key, max: 1 }))
    },
    series: [
      {
        type: "radar",
        data: [
          {
            value: archetypeValues,
            name: "叙事原型活跃度",
            areaStyle: { color: "rgba(244,215,161,0.24)" },
            lineStyle: { color: "#f4d7a1" },
            symbol: "circle",
            itemStyle: { color: "#f4d7a1" }
          }
        ]
      }
    ]
  };

  const emotionOption = {
    color: ["#8daa91", "#93b4d6", "#b98fa1"],
    animationDuration: isMobile ? 400 : 700,
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(8, 20, 35, 0.92)",
      borderRadius: 16,
      borderColor: "rgba(255,255,255,0.08)",
      textStyle: { color: "#f8fafc" }
    },
    legend: {
      top: 8,
      textStyle: { color: "rgba(226,232,240,0.72)" }
    },
    grid: { left: 16, right: 12, top: 48, bottom: 16, containLabel: true },
    xAxis: {
      type: "category",
      data: stats.emotions.map((item) => item.date),
      axisLabel: { color: "rgba(226,232,240,0.62)" }
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "rgba(226,232,240,0.62)" },
      splitLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } }
    },
    series: [
      { name: "积极", type: "bar", stack: "emotion", data: stats.emotions.map((item) => item.positive) },
      { name: "平静", type: "bar", stack: "emotion", data: stats.emotions.map((item) => item.neutral) },
      { name: "低落", type: "bar", stack: "emotion", data: stats.emotions.map((item) => item.negative) }
    ]
  };

  const graphOption = {
    animationDuration: isMobile ? 300 : 600,
    tooltip: {
      backgroundColor: "rgba(8, 20, 35, 0.92)",
      borderRadius: 16,
      borderColor: "rgba(255,255,255,0.08)",
      textStyle: { color: "#f8fafc" }
    },
    series: [
      {
        type: "graph",
        layout: "force",
        roam: true,
        force: {
          repulsion: isMobile ? 140 : 180,
          edgeLength: isMobile ? 72 : 90
        },
        label: {
          show: true,
          color: "#f8fafc",
          fontWeight: 600,
          fontSize: isMobile ? 10 : 12
        },
        lineStyle: {
          color: "rgba(255,255,255,0.26)",
          width: 1.2
        },
        data: stats.themeNetwork.nodes.map((node, index) => ({
          ...node,
          symbolSize: (isMobile ? 16 : 20) + node.value * (isMobile ? 6 : 8),
          itemStyle: {
            color: chartColors[index % chartColors.length]
          },
          label: {
            color: "#f8fafc",
            backgroundColor: "rgba(8,20,35,0.68)",
            borderRadius: 12,
            padding: [3, 6, 3, 6]
          }
        })),
        links: stats.themeNetwork.links.map((link, index) => ({
          ...link,
          lineStyle: {
            width: 1 + link.value * 0.6,
            color: chartColors[index % chartColors.length]
          }
        }))
      }
    ]
  };

  const typeOption = {
    color: chartColors,
    animationDuration: isMobile ? 400 : 700,
    tooltip: {
      trigger: "item",
      backgroundColor: "rgba(8, 20, 35, 0.92)",
      borderRadius: 16,
      borderColor: "rgba(255,255,255,0.08)",
      textStyle: { color: "#f8fafc" }
    },
    series: [
      {
        type: "pie",
        radius: ["42%", "72%"],
        center: ["50%", "54%"],
        label: {
          color: "rgba(226,232,240,0.76)",
          formatter: "{b}\n{c}"
        },
        data: stats.type_counts.map((item) => ({
          name: item.label,
          value: item.count
        }))
      }
    ]
  };

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <section className={`${panelClass} xl:col-span-2`}>
        <div className="mb-3">
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-300/60">Signal Drift</p>
          <h2 className="text-lg font-semibold text-white">连续维度变化曲线</h2>
        </div>
        <ReactECharts {...commonProps} option={lineOption} style={{ ...commonProps.style, height: isMobile ? 300 : 340 }} />
      </section>

      <section className={panelClass}>
        <div className="mb-3">
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-300/60">Narrative Field</p>
          <h2 className="text-lg font-semibold text-white">叙事原型活跃度</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300/72">
            这里显示的是叙事母题的平均活跃度，不是人格定论。它会参考主题、行动感、关系处理和恢复线索，而不是只看你有没有写出某个原型名字。
          </p>
        </div>
        <ReactECharts {...commonProps} option={radarOption} style={{ ...commonProps.style, height: isMobile ? 300 : 320 }} />
      </section>

      <section className={panelClass}>
        <div className="mb-3">
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-300/60">Source Constellation</p>
          <h2 className="text-lg font-semibold text-white">体验来源分布</h2>
        </div>
        <ReactECharts {...commonProps} option={typeOption} style={{ ...commonProps.style, height: isMobile ? 300 : 320 }} />
      </section>

      <section className={panelClass}>
        <div className="mb-3">
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-300/60">Emotion Tide</p>
          <h2 className="text-lg font-semibold text-white">情绪潮汐图</h2>
        </div>
        <ReactECharts {...commonProps} option={emotionOption} style={{ ...commonProps.style, height: isMobile ? 300 : 320 }} />
      </section>

      <section className={`${panelClass} xl:col-span-2`}>
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-300/60">Nebula Web</p>
            <h2 className="text-lg font-semibold text-white">主题共现网络</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-slate-300/72">{stats.weeklySummary}</p>
        </div>
        <ReactECharts {...commonProps} option={graphOption} style={{ ...commonProps.style, height: isMobile ? 340 : 360 }} />
      </section>
    </div>
  );
}
