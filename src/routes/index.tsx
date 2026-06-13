import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WarungAI — Bisnis Jalan, AI yang Bantu" },
      {
        name: "description",
        content:
          "Asisten bisnis AI untuk UMKM Indonesia. Kelola pemasaran, penjualan, dan keputusan bisnis dengan mudah.",
      },
    ],
  }),
  component: Splash,
});

function Splash() {
  return (
    <main className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[image:var(--gradient-hero)] text-primary-foreground">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

      <div className="relative flex flex-1 flex-col items-center justify-center px-8 text-center">
        <Logo size={96} />

        <h1 className="mt-8 text-5xl font-extrabold tracking-tight">
          WarungAI
        </h1>

        <p className="mt-4 text-lg text-white/90">
          Bisnis Jalan, AI yang Bantu
        </p>

        <div className="mt-10 grid w-full max-w-md grid-cols-3 gap-3 text-sm text-white/90">
          {["AI Konten", "Analisis", "Mentor 24/7"].map((f) => (
            <div
              key={f}
              className="flex flex-col items-center gap-2 rounded-2xl bg-white/10 px-4 py-4 backdrop-blur"
            >
              <Sparkles className="h-5 w-5" />
              <span className="font-semibold">{f}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-5xl px-8 pb-12">
        <Link
          to="/login"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-5 text-lg font-bold text-primary shadow-[var(--shadow-card)] active:scale-[0.98]"
        >
          Mulai Sekarang
          <ArrowRight className="h-5 w-5" />
        </Link>

        <p className="mt-4 text-center text-sm text-white/75">
          Dibuat untuk UMKM Indonesia 🇮🇩
        </p>
      </div>
    </main>
  );
}