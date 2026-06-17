import { Compass, LoaderCircle, LogOut, Search, Sparkles, Telescope } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

interface HeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  resultCount?: number;
  userEmail?: string;
  onSignOut: () => Promise<void> | void;
  isSigningOut?: boolean;
}

const navItems = [
  { to: "/", label: "回声宇宙", icon: Compass },
  { to: "/insights", label: "观测台", icon: Telescope }
];

export function Header({
  search,
  onSearchChange,
  resultCount = 0,
  userEmail,
  onSignOut,
  isSigningOut = false
}: HeaderProps) {
  const location = useLocation();
  const isTimeline = location.pathname === "/";
  const [isCondensed, setIsCondensed] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsCondensed(window.scrollY > 18);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[rgba(4,9,20,0.88)] via-[rgba(4,9,20,0.46)] to-transparent" />
      <div className="mx-auto flex max-w-7xl flex-col px-4 pt-4 md:px-6">
        <div
          className={`origin-top overflow-hidden transition-all duration-500 ${
            isCondensed ? "pointer-events-none max-h-0 -translate-y-5 opacity-0" : "max-h-48 translate-y-0 opacity-100"
          }`}
        >
          <div className="mb-3 flex flex-col gap-3 rounded-[28px] border border-white/10 bg-[rgba(10,19,34,0.34)] px-4 py-4 shadow-[0_18px_50px_rgba(2,6,16,0.18)] backdrop-blur-xl md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.34em] text-slate-300/72">EchoLand Observatory</p>
              <h1 className="mt-1 text-xl font-semibold text-slate-50 md:text-2xl">回声宇宙</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300/74">
                每一段记录都会在这里长成自己的星群。往下滑时，入口卡片会退场，只留下始终可见的搜索与导航。
              </p>
            </div>

            <div className="hidden items-center gap-2 md:flex">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm transition ${
                      isActive ? "bg-white/16 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`
                  }
                >
                  <Icon size={15} />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-[26px] border border-white/10 bg-[rgba(7,17,31,0.72)] px-3 py-3 shadow-[0_18px_50px_rgba(2,6,16,0.22)] backdrop-blur-2xl">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 flex-col gap-2 md:max-w-xl">
                <label className="relative overflow-hidden rounded-full border border-white/10 bg-[rgba(10,19,34,0.46)] backdrop-blur-xl">
                  <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-300/70" size={18} />
                  <input
                    value={search}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder="搜索一颗星、一个主题、一个作者，或一种感觉"
                    className="h-12 w-full bg-transparent pl-11 pr-4 text-sm text-slate-50 outline-none placeholder:text-slate-300/55"
                    disabled={!isTimeline}
                  />
                </label>

                {isTimeline && search.trim() ? (
                  <div className="flex items-center gap-2 text-xs text-slate-300/74">
                    <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1">
                      命中 {resultCount} 颗星
                    </span>
                    <span>支持搜索标题、标签、摘要、上下文与分析维度。</span>
                  </div>
                ) : null}
              </div>

              <div className="flex w-full flex-wrap items-center justify-end gap-2 md:w-auto">
                <div className="flex items-center gap-2 md:hidden">
                  {navItems.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      className={({ isActive }) =>
                        `inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm transition ${
                          isActive ? "bg-white/16 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
                        }`
                      }
                    >
                      <Icon size={15} />
                      {label}
                    </NavLink>
                  ))}
                </div>

                {userEmail ? (
                  <div className="rounded-full border border-white/10 bg-[rgba(10,19,34,0.46)] px-4 py-2 text-xs text-slate-200/82 backdrop-blur-xl">
                    {userEmail}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={onSignOut}
                  disabled={isSigningOut}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2.5 text-sm text-slate-100 transition hover:bg-white/12 disabled:opacity-70"
                >
                  {isSigningOut ? <LoaderCircle size={16} className="animate-spin" /> : <LogOut size={16} />}
                  退出
                </button>

                <Link
                  to="/new"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-[#f1d6a4]/16 px-4 py-2.5 text-sm font-medium text-[#f6e8ca] backdrop-blur-xl transition hover:scale-[1.02] hover:bg-[#f1d6a4]/22"
                >
                  <Sparkles size={16} />
                  写下一颗星
                </Link>
              </div>
            </div>
          </div>
          <div className="pointer-events-none h-12 bg-gradient-to-b from-[rgba(7,17,31,0.48)] via-[rgba(7,17,31,0.18)] to-transparent backdrop-blur-xl [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        </div>
      </div>
    </header>
  );
}
