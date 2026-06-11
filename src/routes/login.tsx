import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Logo } from "@/components/Logo";
import { Mail, Lock, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Masuk — WarungAI" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  return (
    <MobileShell withNav={false}>
      <div className="flex min-h-screen flex-col px-6 pb-10 pt-6">
        <Link to="/" className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div className="mt-6 flex flex-col items-center text-center">
          <Logo size={64} />
          <h1 className="mt-5 text-2xl font-bold">Selamat Datang Kembali 👋</h1>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Masuk untuk lanjutkan kelola bisnismu bareng AI
          </p>
        </div>

        <form
          className="mt-8 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/dashboard" });
          }}
        >
          <Field icon={<Mail className="h-5 w-5" />} type="email" placeholder="email@warung.id" label="Email" />
          <Field icon={<Lock className="h-5 w-5" />} type="password" placeholder="••••••••" label="Kata Sandi" />

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-muted-foreground">
              <input type="checkbox" className="h-4 w-4 rounded border-border accent-[var(--color-primary)]" />
              Ingat saya
            </label>
            <button type="button" className="font-medium text-primary">Lupa sandi?</button>
          </div>

          <button
            type="submit"
            className="mt-2 rounded-2xl bg-primary px-6 py-4 text-base font-semibold text-primary-foreground shadow-[var(--shadow-glow)] active:scale-[0.98]"
          >
            Masuk
          </button>

          <div className="my-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            atau
            <span className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            onClick={() => navigate({ to: "/dashboard" })}
            className="flex items-center justify-center gap-3 rounded-2xl border border-border bg-card px-6 py-3.5 text-sm font-medium text-foreground active:scale-[0.98]"
          >
            <GoogleIcon /> Lanjutkan dengan Google
          </button>
        </form>

        <p className="mt-auto pt-8 text-center text-sm text-muted-foreground">
          Belum punya akun?{" "}
          <button className="font-semibold text-primary">Daftar gratis</button>
        </p>
      </div>
    </MobileShell>
  );
}

function Field({
  icon, label, ...props
}: { icon: React.ReactNode; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/50 px-4 py-3.5 focus-within:border-primary focus-within:bg-card">
        <span className="text-muted-foreground">{icon}</span>
        <input {...props} className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
      </div>
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.3 0-11.5-5.1-11.5-11.5S17.7 12.5 24 12.5c2.9 0 5.6 1.1 7.7 2.9l5.7-5.7C33.6 6.3 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.8 0 19.5-8.7 19.5-19.5 0-1.2-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.7 2.9l5.7-5.7C33.6 6.3 29 4.5 24 4.5 16.3 4.5 9.6 8.9 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 43.5c5 0 9.5-1.7 13-4.7l-6-5c-2 1.4-4.4 2.2-7 2.2-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.5 39 16.2 43.5 24 43.5z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.7 2-2 3.7-3.6 5l6 5c-.4.4 6.6-4.8 6.6-14 0-1.2-.1-2.3-.4-3.5z"/>
    </svg>
  );
}
