import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import {
  Sparkles,
  Receipt,
  BarChart3,
  MessageCircle,
  Bell,
  TrendingUp,
  ShoppingBag,
  Users,
  Trophy,
  ArrowUpRight,
  Package,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Beranda — WarungAI" }] }),
  component: Dashboard,
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

type Profile = {
  storeName: string;
  ownerName: string;
  category: string;
  phone: string;
  email: string;
};

type SupabaseProfile = {
  id?: string;
  store_name?: string;
  owner_name?: string;
  category?: string;
  phone?: string;
  email?: string;
};

const defaultProfile: Profile = {
  storeName: "deassert.co",
  ownerName: "Deanaz Priska",
  category: "Kafe & Minuman",
  phone: "085147232675",
  email: "deanazpriskaa@gmail.com",
};

function mapProfile(row: SupabaseProfile): Profile {
  return {
    storeName: row.store_name || defaultProfile.storeName,
    ownerName: row.owner_name || defaultProfile.ownerName,
    category: row.category || defaultProfile.category,
    phone: row.phone || defaultProfile.phone,
    email: row.email || defaultProfile.email,
  };
}

function mapSupabaseTx(row: SupabaseTx): Tx {
  return {
    id: row.id,
    name: row.product_name,
    qty: Number(row.quantity),
    price: Number(row.price),
    createdAt: row.created_at,
    date: formatDateLabel(row.created_at),
  };
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isYesterday(date: Date) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
}

function formatDateLabel(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  const time = date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isSameDay(date, now)) return `Hari ini, ${time}`;
  if (isYesterday(date)) return `Kemarin, ${time}`;

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function shortRupiah(value: number) {
  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toFixed(1).replace(".", ",")}jt`;
  }
  if (value >= 1_000) {
    return `Rp ${Math.round(value / 1000)}rb`;
  }
  return formatRupiah(value);
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

  const bestProduct = products[0];
  const score = calculateScore(items, products, total);

  return { total, products, bestProduct, score };
}

function calculateScore(
  items: Tx[],
  products: { name: string; qty: number; omzet: number }[],
  total: number
) {
  const totalOmzet = total;
  const totalTransaksi = items.length;
  const variasiProduk = products.length;

  const tanggalUnik = new Set(
    items.map((item) => new Date(item.createdAt).toDateString())
  ).size;

  const omzetScore = Math.min((totalOmzet / 1000000) * 100, 100);
  const transaksiScore = Math.min((totalTransaksi / 20) * 100, 100);
  const produkScore = Math.min((variasiProduk / 5) * 100, 100);
  const konsistensiScore = Math.min((tanggalUnik / 7) * 100, 100);

  const score = Math.round(
    omzetScore * 0.4 +
      transaksiScore * 0.3 +
      produkScore * 0.2 +
      konsistensiScore * 0.1
  );

  return Math.min(score, 100);
}

function getHealthTitle(score: number) {
  if (score >= 80) return "Bisnismu Sehat";
  if (score >= 50) return "Kurang Sehat";
  return "Perlu Perbaikan";
}

function Dashboard() {
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [loading, setLoading] = useState(true);

  const data = summarize(transactions);

  useEffect(() => {
    loadTransactions();
    loadProfile();
  }, []);

  async function loadTransactions() {
    setLoading(true);

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert("Gagal mengambil data dashboard: " + error.message);
      setLoading(false);
      return;
    }

    setTransactions((data || []).map(mapSupabaseTx));
    setLoading(false);
  }

  async function loadProfile() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(error);
      return;
    }

    if (data) {
      setProfile(mapProfile(data as SupabaseProfile));
    }
  }

  const ownerFirstName = profile.ownerName.split(" ")[0] || "Pemilik";
  const initial = profile.storeName.charAt(0).toUpperCase() || "W";

  const todayRevenue = data.total;
  const weeklyRevenue = data.total * 4;
  const monthlyRevenue = data.total * 12;
  const predictedRevenue = Math.round(data.total * 1.18);

  const bestProduct = data.bestProduct?.name || "produk terlaris";
  const lowProduct =
    data.products[data.products.length - 1]?.name || "produk kurang laku";

  const strategyPreview = [
    `Buat konten promosi ${bestProduct}`,
    `Tambah stok ${bestProduct}`,
    `Bundling ${bestProduct} + ${lowProduct}`,
    `Follow up pelanggan lama dengan promo ${bestProduct}`,
  ];

  const chartBars =
    data.products.length > 0
      ? data.products.slice(0, 6).map((p) => ({
          label: p.name,
          value: p.omzet,
        }))
      : [{ label: "Belum ada data", value: 1 }];

  const maxChartValue = Math.max(...chartBars.map((b) => b.value), 1);

  const recentActivities = transactions.slice(0, 5).map((tx) => ({
    icon: ShoppingBag,
    bg: "bg-success/10",
    color: "text-success",
    title: `Penjualan ${tx.name} x${tx.qty}`,
    time: tx.date || "Baru saja",
    amount: `+${formatRupiah(tx.qty * tx.price)}`,
    amountColor: "text-success",
  }));

  const activities =
    recentActivities.length > 0
      ? recentActivities
      : [
          {
            icon: BarChart3,
            bg: "bg-chart-3/10",
            color: "text-chart-3",
            title: loading ? "Memuat data..." : "Belum ada transaksi",
            time: loading
              ? "Mengambil dari Supabase"
              : "Tambahkan data penjualan dulu",
            amount: loading ? "..." : "Mulai",
            amountColor: "text-primary",
          },
        ];

  return (
    <MobileShell>
      <div className="space-y-6 px-5 py-6 md:px-0">
        <section className="overflow-hidden rounded-3xl bg-[image:var(--gradient-hero)] p-6 text-primary-foreground shadow-[var(--shadow-glow)] md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-lg font-bold backdrop-blur">
                {initial}
              </div>

              <div>
                <p className="text-sm text-white/80">Selamat datang,</p>
                <h1 className="text-2xl font-extrabold tracking-tight">
                  Halo, {ownerFirstName} 👋
                </h1>
                <p className="mt-1 text-sm text-white/80">
                  {profile.storeName}
                </p>
              </div>
            </div>

            <Link
              to="/notifications"
              className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/20 backdrop-blur"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-warning" />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-3xl bg-white p-5 text-foreground shadow-[var(--shadow-card)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Pendapatan Hari Ini
                  </p>
                  <p className="mt-2 text-4xl font-extrabold tracking-tight">
                    {loading ? "Memuat..." : formatRupiah(todayRevenue)}
                  </p>
                </div>

                <span className="flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  +18%
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-5">
                <Mini label="Estimasi Minggu" value={shortRupiah(weeklyRevenue)} />
                <Mini label="Estimasi Bulan" value={shortRupiah(monthlyRevenue)} />
              </div>
            </div>

            <Link
              to="/analysis"
              className="rounded-3xl bg-white/15 p-5 text-primary-foreground backdrop-blur transition active:scale-[0.99]"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide">
                    <Sparkles className="h-3.5 w-3.5" />
                    Health Score
                  </span>
                  <h2 className="mt-3 text-xl font-bold">
                    {getHealthTitle(data.score)}
                  </h2>
                  <p className="mt-1 text-sm text-white/80">
                    Berdasarkan {transactions.length} transaksi tersimpan
                  </p>
                </div>

                <ScoreRing value={data.score} />
              </div>
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <QuickAction to="/ai-content" icon={Sparkles} label="AI Konten" desc="Buat caption & promo" tone="primary" />
          <QuickAction to="/sales" icon={Receipt} label="Penjualan" desc="Catat transaksi" tone="warning" />
          <QuickAction to="/analysis" icon={BarChart3} label="Analisis AI" desc="Lihat health score" tone="info" />
          <QuickAction to="/mentor" icon={MessageCircle} label="Mentor AI" desc="Tanya strategi" tone="success" />
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard icon={Receipt} label="Total Transaksi" value={`${transactions.length}`} tone="primary" />
          <StatCard icon={Trophy} label="Produk Terlaris" value={data.bestProduct?.name || "-"} tone="warning" />
          <StatCard icon={Users} label="Pelanggan Aktif" value={`${transactions.length}`} tone="info" />
          <StatCard icon={TrendingUp} label="Skor Bisnis" value={`${data.score}/100`} tone="success" />
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="rounded-3xl bg-card p-5 shadow-[var(--shadow-soft)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold">Grafik Penjualan Produk</h2>
                <p className="text-sm text-muted-foreground">
                  Berdasarkan omzet per produk
                </p>
              </div>
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>

            <div className="space-y-4">
              {chartBars.map((bar) => {
                const width = Math.max((bar.value / maxChartValue) * 100, 8);

                return (
                  <div key={bar.label}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium">{bar.label}</span>
                      <span className="text-muted-foreground">
                        {data.products.length > 0 ? formatRupiah(bar.value) : "-"}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl bg-card p-5 shadow-[var(--shadow-soft)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold">Prediksi AI</h2>
                <p className="text-sm text-muted-foreground">
                  Estimasi omzet berikutnya
                </p>
              </div>
              <Sparkles className="h-5 w-5 text-primary" />
            </div>

            <p className="text-3xl font-extrabold text-primary">
              {formatRupiah(predictedRevenue)}
            </p>

            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Jika pola transaksi stabil dan promosi rutin dijalankan, omzet
              berpotensi naik sekitar 18%.
            </p>

            <div className="mt-5 rounded-2xl bg-primary-soft/60 p-4">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Produk Prioritas</p>
                  <p className="text-sm text-muted-foreground">
                    {data.bestProduct?.name || "Belum ada produk"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <Link
            to="/strategy"
            className="rounded-3xl bg-[image:var(--gradient-primary)] p-6 text-white shadow-[var(--shadow-glow)] transition hover:scale-[1.01]"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                  AI COACH
                </span>

                <h3 className="mt-3 text-2xl font-bold">Strategi Minggu Ini</h3>

                <p className="mt-1 text-sm text-white/80">
                  Rekomendasi otomatis berdasarkan penjualan
                </p>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold">4</div>
                <div className="text-xs opacity-80">rekomendasi</div>
              </div>
            </div>

            <div className="space-y-3">
              {strategyPreview.map((item) => (
                <StrategyPreviewItem key={item} text={item} />
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between">
              <span className="font-semibold">Buka Strategi →</span>
            </div>
          </Link>

          <div className="rounded-3xl bg-card p-5 shadow-[var(--shadow-soft)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold">Aktivitas Terbaru</h2>
              <Link to="/sales" className="text-sm font-semibold text-primary">
                Lihat semua
              </Link>
            </div>

            <ul className="space-y-3">
              {activities.map((a, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-2xl bg-secondary/40 p-3"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${a.bg}`}
                  >
                    <a.icon className={`h-5 w-5 ${a.color}`} />
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.time}</p>
                  </div>

                  <span className={`text-sm font-semibold ${a.amountColor}`}>
                    {a.amount}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </MobileShell>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
      <p className="mt-1 flex items-center gap-1 text-xs font-medium text-success">
        <ArrowUpRight className="h-3.5 w-3.5" />
        naik otomatis
      </p>
    </div>
  );
}

function QuickAction({
  to,
  icon: Icon,
  label,
  desc,
  tone,
}: {
  to: "/ai-content" | "/sales" | "/analysis" | "/mentor";
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
  tone: "primary" | "warning" | "info" | "success";
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    warning: "bg-warning/10 text-warning",
    info: "bg-chart-3/10 text-chart-3",
    success: "bg-success/10 text-success",
  };

  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-3xl bg-card p-4 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 active:scale-[0.99]"
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tones[tone]}`}>
        <Icon className="h-6 w-6" />
      </div>

      <div>
        <p className="text-sm font-bold">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </Link>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: "primary" | "warning" | "info" | "success";
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    warning: "bg-warning/10 text-warning",
    info: "bg-chart-3/10 text-chart-3",
    success: "bg-success/10 text-success",
  };

  return (
    <div className="rounded-3xl bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-4 text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-extrabold">{value}</p>
    </div>
  );
}

function StrategyPreviewItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3">
      <span className="flex h-4 w-4 shrink-0 rounded-full border-2 border-white/80" />
      <span>{text}</span>
    </div>
  );
}

function ScoreRing({ value }: { value: number }) {
  const r = 28;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;

  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90">
        <circle cx="36" cy="36" r={r} className="fill-none stroke-white/25" strokeWidth="6" />
        <circle
          cx="36"
          cy="36"
          r={r}
          className="fill-none stroke-white"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-extrabold leading-none">{value}</span>
        <span className="text-[9px] opacity-80">/ 100</span>
      </div>
    </div>
  );
}