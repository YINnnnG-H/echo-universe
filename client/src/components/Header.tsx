import { Compass, LoaderCircle, LogOut, Search, Sparkles, Telescope } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";

interface HeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  userEmail?: string;
  onSignOut: () => Promise<void> | void;
  isSigningOut?: boolean;
}

const navItems = [
  { to: "/", label: "回声宇宙", icon: Compass },
  { to: "/insights", label: "观测台", icon: Telescope }
];

export function Header({ search, onSearchChange, userEmail, onSignOut, isSigningOut = false }: HeaderProps) {
  const location = useLocation();
  const isTimeline = location.pathname === "/";

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 pt-4 md:flex-row md:items-start md:justify-between md:px-6">
        <div className="rounded-[26px] border border-white/10 bg-[rgba(10,19,34,0.3)] px-4 py-3 shadow-[0_18px_50px_rgba(2,6,16,0.18)] backdrop-blur-xl">
          <p className="text-[11px] uppercase tracking-[0.34em] text-slate-300/72">EchoLand Observatory</p>
          <h1 className="mt-1 text-xl font-semibold text-slate-50 md:text-2xl">回声宇宙</h1>
          <div className="mt-3 hidden items-center gap-2 md:flex">
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

        <div className="flex w-full flex-col gap-3 md:max-w-xl md:items-end">
          <label className="relative w-full overflow-hidden rounded-full border border-white/10 bg-[rgba(10,19,34,0.46)] backdrop-blur-xl md:max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-300/70" size={18} />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="搜索一颗星、一个主题或一句回声"
              className="h-12 w-full bg-transparent pl-11 pr-4 text-sm text-slate-50 outline-none placeholder:text-slate-300/55"
              disabled={!isTimeline}
            />
          </label>

          <div className="flex w-full flex-wrap items-center justify-end gap-2">
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
    </header>
  );
}
