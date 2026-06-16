import { useEffect, useMemo, useState } from "react";

const phaseNames = ["新月", "娥眉月", "上弦月", "盈凸月", "满月", "亏凸月", "下弦月", "残月"];
const synodicMonth = 29.53058867;
const knownNewMoon = Date.UTC(2024, 0, 11, 11, 57, 0);

function getMoonData(date: Date) {
  const days = (date.getTime() - knownNewMoon) / 86400000;
  const cycle = ((days % synodicMonth) + synodicMonth) % synodicMonth;
  const illumination = 0.5 * (1 - Math.cos((2 * Math.PI * cycle) / synodicMonth));
  const normalized = cycle / synodicMonth;
  const phaseIndex = Math.floor(((normalized * 8) + 0.5) % 8);

  return {
    illumination,
    cycle,
    phaseName: phaseNames[phaseIndex],
    waxing: normalized <= 0.5
  };
}

export function MoonPhase() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  const moon = useMemo(() => getMoonData(now), [now]);
  const shadowWidth = Math.max(6, Math.abs(1 - moon.illumination * 2) * 42);
  const shadowX = moon.waxing ? 50 + shadowWidth * 0.38 : 50 - shadowWidth * 0.38;

  return (
    <section className="pointer-events-auto rounded-[28px] border border-white/10 bg-[rgba(10,19,34,0.58)] p-4 shadow-[0_24px_60px_rgba(2,6,16,0.22)] backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-300/60">Moon Dial</p>
          <h2 className="mt-1 text-sm font-medium text-slate-100">今夜月相</h2>
        </div>
        <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-slate-200/82">
          {moon.phaseName}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0">
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(243,237,226,0.24),transparent_70%)] blur-xl" />
          <svg viewBox="0 0 100 100" className="relative h-20 w-20 animate-[spin_60s_linear_infinite]">
            <defs>
              <radialGradient id="moonSurface" cx="38%" cy="32%">
                <stop offset="0%" stopColor="#fffaf1" />
                <stop offset="70%" stopColor="#ddd4c8" />
                <stop offset="100%" stopColor="#b4ac9f" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="46" fill="url(#moonSurface)" />
            <circle cx="36" cy="34" r="7" fill="rgba(116,110,101,0.18)" />
            <circle cx="58" cy="58" r="10" fill="rgba(116,110,101,0.14)" />
            <circle cx="44" cy="68" r="5" fill="rgba(116,110,101,0.12)" />
            <ellipse cx={shadowX} cy="50" rx={shadowWidth} ry="44" fill="rgba(8,18,32,0.84)" />
          </svg>
        </div>

        <div className="space-y-1.5 text-sm leading-6 text-slate-300/78">
          <p>光照比例 {Math.round(moon.illumination * 100)}%</p>
          <p>它像一只缓慢转动的钟，替今天留下一点潮汐感。</p>
        </div>
      </div>
    </section>
  );
}
