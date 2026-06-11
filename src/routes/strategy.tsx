import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileShell, PageHeader } from "@/components/MobileShell";
import {
  Sparkles,
  Megaphone,
  Package,
  TrendingUp,
  Users,
  CheckCircle2,
  Circle,
  Target,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/strategy")({
  head: () => ({ meta: [{ title: "Strategi AI — WarungAI" }] }),
  component: StrategyPage,
});

type Tx = {
  id: string;
  name: string;
  qty: number;
  price: number;
  date: string;
  createdAt: string;
};

type SupabaseTx = {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
  created_at: string;
};

function mapSupabaseTx(row: SupabaseTx): Tx {
  return {
    id: row.id,
    name: row.product_name,
    qty: Number(row.quantity),
    price: Number(row.price),
    createdAt: row.created_at,
    date: row.created_at,
  };
}

function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function summarize(items: Tx[]) {
  const total = items.reduce((sum, item) => sum + item.qty * item.price, 0);

  const grouped = items.reduce<Record<string, { qty: number; omzet: number }>>(
    (acc, item) => {
      if (!acc[item.name]) acc[item.name] = { qty: 0, omzet: 0 };
      acc[item.name].qty += item.qty;
      acc[item.name].omzet += item.qty * item.price;
      return acc;
    },
    {}
  );

  const products = Object.entries(grouped)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.omzet - a.omzet);

  return {
    total,
    products,
    bestProduct: products[0],
    lowProduct: products[products.length - 1],
  };
}

function buildStrategy(summary: ReturnType<typeof summarize>) {
  const best = summary.bestProduct?.name || "produk terlaris";
  const low = summary.lowProduct?.name || "produk kurang laku";
  const omzet = summary.total;

  return {
    tasks: [
      `Buat konten promosi ${best} untuk Instagram/TikTok`,
      `Tambah stok ${best} sebelum jam ramai`,
      `Buat promo bundling ${best} + ${low}`,
      `Follow up pelanggan lama dengan promo ${best}`,
    ],
    pemasaran: `Fokus promosi ${best} karena menjadi produk dengan omzet tertinggi. Buat konten pendek yang menampilkan keunggulan produk dan ajakan membeli.`,
    stok: `Prioritaskan stok ${best}. Jangan terlalu banyak menambah stok ${low} sebelum promonya berjalan.`,
    penjualan: `Gunakan strategi bundling ${best} + ${low} agar produk yang lebih lambat terjual ikut terdorong.`,
    pelanggan: `Kirim pesan promo ke pelanggan lama melalui WhatsApp atau Instagram, terutama untuk menawarkan ${best}.`,
    tambahanOmzet:
      omzet > 0
        ? `+${formatRupiah(Math.round(omzet * 0.18))}/minggu`
        : "+Rp 0/minggu",
    peluangKenaikan: omzet > 0 ? "78%" : "0%",
    risikoStok: omzet > 100000 ? "Sedang" : "Rendah",
  };
}

function StrategyPage() {
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState<boolean[]>([false, false, false, false]);

  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    setLoading(true);

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert("Gagal mengambil data strategi: " + error.message);
      setLoading(false);
      return;
    }

    setTransactions((data || []).map(mapSupabaseTx));
    setLoading(false);
  }

  const summary = summarize(transactions);
  const strategy = buildStrategy(summary);

  const completed = done.filter(Boolean).length;
  const pct = Math.round((completed / strategy.tasks.length) * 100);

  return (
    <MobileShell>
      <PageHeader
        title="Strategi AI"
        subtitle="Rencana cerdas berdasarkan data penjualan"
      />

      <section className="mb-5 px-5 md:px-0">
        <div className="rounded-3xl bg-card p-5 shadow-[var(--shadow-soft)]">
          <p className="text-sm text-muted-foreground">Ringkasan data</p>
          <h2 className="mt-1 text-xl font-bold">
            Produk Prioritas:{" "}
            {loading
              ? "Memuat..."
              : summary.bestProduct?.name || "Belum ada data"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading
              ? "Mengambil data dari Supabase..."
              : `Total omzet tercatat ${formatRupiah(summary.total)} dari ${transactions.length} transaksi.`}
          </p>
        </div>
      </section>

      <section className="px-5 md:px-0">
        <div className="overflow-hidden rounded-3xl bg-[image:var(--gradient-hero)] p-5 text-primary-foreground shadow-[var(--shadow-glow)]">
          <div className="flex items-center justify-between">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                <Sparkles className="h-3 w-3" /> AI Coach
              </span>
              <h2 className="mt-2 text-lg font-bold">Prioritas Hari Ini</h2>
              <p className="mt-0.5 text-xs text-white/85">
                {completed}/{strategy.tasks.length} selesai • {pct}%
              </p>
            </div>

            <div className="text-right">
              <p className="text-3xl font-extrabold leading-none">{pct}%</p>
              <p className="text-[10px] opacity-80">progres</p>
            </div>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>

          <ul className="mt-4 space-y-2">
            {strategy.tasks.map((task, i) => {
              const isDone = done[i];

              return (
                <li key={i}>
                  <button
                    onClick={() =>
                      setDone((current) =>
                        current.map((value, idx) =>
                          idx === i ? !value : value
                        )
                      )
                    }
                    className="flex w-full items-center gap-3 rounded-2xl bg-white/15 p-3 text-left backdrop-blur active:scale-[0.99]"
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 shrink-0 opacity-80" />
                    )}

                    <span
                      className={`text-sm font-medium ${
                        isDone ? "line-through opacity-70" : ""
                      }`}
                    >
                      {task}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="mt-6 px-5 md:px-0">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Target className="h-4 w-4 text-primary" /> Rencana Minggu Ini
        </h3>

        <div className="grid gap-3 md:grid-cols-2">
          <PlanCard
            icon={Megaphone}
            tone="primary"
            title="Pemasaran"
            text={strategy.pemasaran}
          />
          <PlanCard
            icon={Package}
            tone="warning"
            title="Stok"
            text={strategy.stok}
          />
          <PlanCard
            icon={TrendingUp}
            tone="success"
            title="Penjualan"
            text={strategy.penjualan}
          />
          <PlanCard
            icon={Users}
            tone="info"
            title="Pelanggan"
            text={strategy.pelanggan}
          />
        </div>
      </section>

      <section className="mt-6 px-5 pb-4 md:px-0">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-primary" /> Estimasi Dampak
        </h3>

        <div className="rounded-3xl border border-primary/15 bg-primary-soft/40 p-5">
          <Impact
            label="Potensi tambahan omzet"
            value={strategy.tambahanOmzet}
            highlight
          />

          <div className="my-3 h-px bg-border" />

          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Peluang kenaikan penjualan
              </span>
              <span className="text-sm font-bold text-success">
                {strategy.peluangKenaikan}
              </span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-success"
                style={{ width: strategy.peluangKenaikan }}
              />
            </div>
          </div>

          <div className="my-3 h-px bg-border" />

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5 text-warning" /> Risiko
              stok habis
            </span>

            <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-[11px] font-semibold text-warning">
              {strategy.risikoStok}
            </span>
          </div>
        </div>
      </section>
    </MobileShell>
  );
}

function PlanCard({
  icon: Icon,
  tone,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "warning" | "success" | "info";
  title: string;
  text: string;
}) {
  const map: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    warning: "bg-warning/10 text-warning",
    success: "bg-success/10 text-success",
    info: "bg-chart-3/10 text-chart-3",
  };

  return (
    <div className="flex gap-3 rounded-2xl bg-card p-3.5 shadow-[var(--shadow-soft)]">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${map[tone]}`}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {text}
        </p>
      </div>
    </div>
  );
}

function Impact({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span
        className={`text-sm font-bold ${
          highlight ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}