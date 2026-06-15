import { Compass, PlusCircle, Telescope } from "lucide-react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "星云", icon: Compass },
  { to: "/insights", label: "观星", icon: Telescope },
  { to: "/new", label: "写下星星", icon: PlusCircle }
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#07111fcc]/90 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-2 rounded-[24px] border border-white/10 bg-white/8 px-2 py-2 shadow-[0_18px_40px_rgba(2,6,16,0.32)]">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex min-w-[96px] flex-1 flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs transition ${
                isActive ? "bg-white/14 text-white shadow-soft" : "text-slate-300/70"
              }`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
