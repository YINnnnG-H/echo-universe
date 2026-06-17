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
  const illuminationPercent = Math.round(moon.illumination * 100);

  return (
    <section className="pointer-events-auto moon-card relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(160deg,rgba(9,18,34,0.92),rgba(7,13,25,0.78))] p-5 shadow-[0_28px_90px_rgba(2,6,16,0.32)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute -right-10 top-0 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(244,215,161,0.18),rgba(244,215,161,0))] blur-3xl" />
      <div className="pointer-events-none absolute left-6 top-6 h-px w-24 bg-gradient-to-r from-white/50 to-transparent" />
      <div className="pointer-events-none moon-card__grain absolute inset-0 opacity-40" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-300/60">Moon Dial</p>
          <h2 className="mt-1 text-base font-medium text-slate-50">今夜月相</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300/72">它像一枚缓慢呼吸的天体装置，为今天保留一点潮汐感。</p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-slate-200/82">{moon.phaseName}</div>
      </div>

      <div className="relative mt-6 flex items-center gap-5">
        <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-white/10" />
          <div className="absolute inset-3 rounded-full border border-dashed border-white/10 animate-[spin_30s_linear_infinite]" />
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(243,237,226,0.22),transparent_72%)] blur-2xl" />

          <svg viewBox="0 0 100 100" className="relative h-24 w-24 animate-[spin_80s_linear_infinite]">
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
            <ellipse cx={shadowX} cy="50" rx={shadowWidth} ry="44" fill="rgba(8,18,32,0.82)" />
          </svg>
        </div>

        <div className="flex-1 space-y-3">
          <div className="rounded-[22px] border border-white/8 bg-white/6 p-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-200">光照比例</span>
              <span className="text-slate-100">{illuminationPercent}%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white/8">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-[#8fb0d6] via-[#ddd4c8] to-[#f4d7a1]"
                style={{ width: `${Math.max(illuminationPercent, 8)}%` }}
              />
            </div>
          </div>

          <div className="rounded-[22px] border border-white/8 bg-[rgba(255,255,255,0.04)] p-3 text-sm leading-6 text-slate-300/80">
            今晚的月亮不解释一切，只提醒你：有些体验适合被照亮，有些体验适合先悬在光边缘。
          </div>
        </div>
      </div>
    </section>
  );
}
