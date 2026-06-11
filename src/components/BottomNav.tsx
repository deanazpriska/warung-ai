import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Sparkles, Receipt, BarChart3, User } from "lucide-react";

const items = [
  { to: "/dashboard", label: "Beranda", icon: Home },
  { to: "/ai-content", label: "AI Konten", icon: Sparkles },
  { to: "/sales", label: "Penjualan", icon: Receipt },
  { to: "/analysis", label: "Analisis", icon: BarChart3 },
  { to: "/profile", label: "Profil", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-border bg-card/95 backdrop-blur-md">
      <ul className="grid grid-cols-5 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {items.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <li key={item.to} className="flex">
              <Link
                to={item.to}
                className="flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5"
              >
                <span
                  className={`flex h-9 w-12 items-center justify-center rounded-xl transition-all ${
                    active
                      ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]"
                      : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span
                  className={`text-[10px] font-medium ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
