import { NavLink, useLocation } from "react-router-dom";

const navItems = [
  {
    to: "/",
    label: "Home",
    icon: (active: boolean) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path
          d="M3 12L12 4l9 8M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9"
          stroke={active ? "#1E3A5F" : "#94A3B8"}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    to: "/map",
    label: "Map",
    icon: (active: boolean) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6-3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 8V9M9 7l6 2"
          stroke={active ? "#1E3A5F" : "#94A3B8"}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    to: "/report",
    label: "Report",
    icon: (active: boolean) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path
          d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          stroke={active ? "#DC2626" : "#94A3B8"}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    to: "/authority",
    label: "Authority",
    icon: (active: boolean) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          stroke={active ? "#1E3A5F" : "#94A3B8"}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 flex">
      {navItems.map(({ to, label, icon }) => {
        const active =
          to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
        return (
          <NavLink
            key={to}
            to={to}
            className="flex-1 flex flex-col items-center gap-0.5 py-2.5 px-1"
          >
            {icon(active)}
            <span
              className={`text-[10px] font-medium tracking-wide ${
                active ? "text-[#1E3A5F]" : "text-slate-400"
              }`}
            >
              {label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}
