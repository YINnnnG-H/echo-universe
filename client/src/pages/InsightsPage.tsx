import { ChartsPanel } from "../components/ChartsPanel";
import type { DashboardStats } from "../types";

interface InsightsPageProps {
  stats: DashboardStats | null;
}

export function InsightsPage({ stats }: InsightsPageProps) {
  if (!stats) {
    return (
      <section className="rounded-[28px] border border-white/10 bg-white/6 p-6 text-slate-200 backdrop-blur-xl">
        <p className="text-sm text-slate-300/75">正在整理星图观测数据...</p>
      </section>
    );
  }

  return (
    <div className="space-y-6 pt-24">
      <section className="rounded-[32px] border border-white/10 bg-white/6 p-6 shadow-soft backdrop-blur-xl">
        <p className="text-[11px] uppercase tracking-[0.3em] text-slate-300/60">Starmap Observatory</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">星图观测站</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300/78">
          这里是宇宙背后的结构层。你可以看见人格特质的波动、原型的明灭、情绪的潮汐，以及不同内容类型如何共同参与这片星空的生成。
        </p>
      </section>
      <ChartsPanel stats={stats} />
    </div>
  );
}
