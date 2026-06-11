import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { BottomNav } from "./BottomNav";
import {
  Home,
  Sparkles,
  Receipt,
  BarChart3,
  User,
} from "lucide-react";

export function MobileShell({
  children,
  withNav = true,
}: {
  children: ReactNode;
  withNav?: boolean;
}) {
  return (
    <div className="min-h-screen bg-secondary">
      <div className="flex min-h-screen">
        {withNav && (
          <aside className="hidden w-64 border-r border-border bg-card px-5 py-6 md:block">
            <h1 className="mb-8 text-2xl font-extrabold text-primary">
              WarungAI
            </h1>

            <nav className="space-y-2">
              <SideLink to="/dashboard" icon={Home} label="Beranda" />
              <SideLink to="/ai-content" icon={Sparkles} label="AI Konten" />
              <SideLink to="/sales" icon={Receipt} label="Penjualan" />
              <SideLink to="/analysis" icon={BarChart3} label="Analisis" />
              <SideLink to="/profile" icon={User} label="Profil" />
            </nav>
          </aside>
        )}

        <main className="min-h-screen flex-1 bg-background">
          <div className="mx-auto w-full max-w-6xl px-0 md:px-6 lg:px-8">
            <div className={withNav ? "pb-28 md:pb-8" : ""}>{children}</div>
          </div>
        </main>

        {withNav && (
          <div className="md:hidden">
            <BottomNav />
          </div>
        )}
      </div>
    </div>
  );
}

function SideLink({
  to,
  icon: Icon,
  label,
}: {
  to: "/dashboard" | "/ai-content" | "/sales" | "/analysis" | "/profile";
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-muted-foreground hover:bg-primary/10 hover:text-primary"
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-3 px-5 pb-4 pt-6 md:px-0">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-sm text-muted-foreground md:text-base">
            {subtitle}
          </p>
        )}
      </div>
      {right}
    </header>
  );
}