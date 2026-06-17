import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { Entry } from "../types";
import { emotionLabel } from "../utils/format";

const quoteBank = {
  positive: [
    {
      quote: "我步入丛林，因为我希望生活得有意义。",
      source: "梭罗《瓦尔登湖》"
    },
    {
      quote: "一切都在生长，连沉默也有自己的方向。",
      source: "里尔克《给青年诗人的信》"
    }
  ],
  neutral: [
    {
      quote: "我们生活在时间之中，同时也被时间静静注视。",
      source: "普鲁斯特《追忆似水年华》"
    },
    {
      quote: "事物不会说话，但它们会留下光。",
      source: "伍尔夫《到灯塔去》"
    }
  ],
  negative: [
    {
      quote: "黑夜给了我黑色的眼睛，我却用它寻找光明。",
      source: "顾城《一代人》"
    },
    {
      quote: "痛苦不是终点，它只是灵魂改写自己的方式。",
      source: "陀思妥耶夫斯基《地下室手记》"
    }
  ]
};

interface QuoteCardProps {
  latestEntry?: Entry;
}

export function QuoteCard({ latestEntry }: QuoteCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const emotion = latestEntry?.emotion || "neutral";

  const quote = useMemo(() => {
    const quotes = quoteBank[emotion];
    if (!latestEntry) {
      return quotes[0];
    }
    return quotes[(latestEntry.summary.length + latestEntry.tags.length) % quotes.length];
  }, [emotion, latestEntry]);

  const weatherLine = latestEntry
    ? `${latestEntry.tags.slice(0, 2).map((tag) => `#${tag}`).join(" · ")} 正在今晚的天空里发亮。`
    : "今晚的宇宙还很安静，等第一颗新星点亮。";

  return (
    <motion.aside
      animate={{ width: collapsed ? 102 : 332 }}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
      className="pointer-events-auto relative z-40 w-full max-w-[332px] overflow-hidden rounded-[28px] border border-white/10 bg-[rgba(8,20,35,0.72)] shadow-[0_24px_70px_rgba(2,6,16,0.3)] backdrop-blur-2xl"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-r from-[rgba(143,176,214,0.14)] via-transparent to-[rgba(244,215,161,0.12)]" />

      <div className="relative flex items-center justify-between gap-3 px-4 py-3">
        <div className={collapsed ? "hidden" : "block"}>
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-300/60">Today Card</p>
          <h2 className="mt-1 text-sm font-medium text-slate-100">今日心情卡</h2>
        </div>
        <div className={collapsed ? "text-xs tracking-[0.22em] text-slate-300/70" : "hidden"}>心情卡</div>

        <button
          type="button"
          onClick={() => setCollapsed((current) => !current)}
          className="rounded-full border border-white/10 bg-white/6 p-2 text-slate-200/82 transition hover:bg-white/10"
          aria-label={collapsed ? "展开今日心情卡" : "收起今日心情卡"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {!collapsed ? (
          <motion.div
            key="card-content"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.24 }}
            className="px-4 pb-4"
          >
            <div className="rounded-[24px] border border-white/8 bg-[rgba(247,240,223,0.08)] p-4">
              <p className="text-sm leading-7 text-slate-100/92">“{quote.quote}”</p>
              <p className="mt-3 text-xs tracking-[0.12em] text-slate-300/68">{quote.source}</p>
            </div>

            <div className="mt-4 space-y-2 text-sm leading-6 text-slate-300/84">
              <p>今日主情绪：{emotionLabel(emotion)}</p>
              <p>{weatherLine}</p>
              {latestEntry ? <p className="text-slate-400/78">{latestEntry.summary}</p> : null}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="card-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-3 pb-4"
          >
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="flex w-full flex-col items-center gap-2 rounded-[18px] border border-white/10 bg-white/6 px-3 py-4 text-center text-xs text-slate-200/84"
            >
              <ChevronRight size={16} />
              <span>展开</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
