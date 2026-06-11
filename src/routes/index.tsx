import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { MobileShell } from "@/components/MobileShell";
import { ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WarungAI — Bisnis Jalan, AI yang Bantu" },
      { name: "description", content: "Asisten bisnis AI untuk UMKM Indonesia. Kelola pemasaran, penjualan, dan keputusan bisnis dengan mudah." },
    ],
  }),
  component: Splash,
});

function Splash() {
  return (
    <MobileShell withNav={false}>
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-[image:var(--gradient-hero)] text-primary-foreground">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex flex-1 flex-col items-center justify-center px-8 text-center">
          <Logo size={96} />
          <h1 className="mt-8 text-4xl font-extrabold tracking-tight">WarungAI</h1>
          <p className="mt-3 max-w-xs text-base/relaxed text-white/90">
            Bisnis Jalan, AI yang Bantu
          </p>

          <div className="mt-10 grid w-full max-w-xs grid-cols-3 gap-2 text-xs text-white/85">
            {["AI Konten", "Analisis", "Mentor 24/7"].map((f) => (
              <div key={f} className="flex flex-col items-center gap-1 rounded-2xl bg-white/10 px-2 py-3 backdrop-blur">
                <Sparkles className="h-4 w-4" />
                <span className="font-medium">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative px-6 pb-10">
          <Link
            to="/login"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-base font-semibold text-primary shadow-[var(--shadow-card)] active:scale-[0.98]"
          >
            Mulai Sekarang
            <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="mt-3 text-center text-xs text-white/70">
            Dibuat untuk UMKM Indonesia 🇮🇩
          </p>
        </div>
      </div>
    </MobileShell>
  );
}
