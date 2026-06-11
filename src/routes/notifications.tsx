import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileShell, PageHeader } from "@/components/MobileShell";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Sparkles,
  Package,
  TrendingUp,
  Clock,
  Megaphone,
  AlertTriangle,
  Receipt,
} from "lucide-react";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifikasi AI — WarungAI" }] }),
  component: NotificationsPage,
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

type Tone = "primary" | "success" | "info" | "warning";

type NotificationItem = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
  tone: Tone;
};

function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function isToday(dateString?: string) {
  if (!dateString) return false;

  const date = new Date(dateString);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

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

function summarize(items: Tx[]) {
  const total = items.reduce((sum, item) => sum + item.qty * item.price, 0);

  const todayItems = items.filter((item) => isToday(item.createdAt));
  const todayTotal = todayItems.reduce(
    (sum, item) => sum + item.qty * item.price,
    0
  );

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
    todayTotal,
    todayCount: todayItems.length,
    products,
    bestProduct: products[0],
    lowProduct: products[products.length - 1],
  };
}

function buildNotifications(summary: ReturnType<typeof summarize>): NotificationItem[] {
  const items: NotificationItem[] = [];

  const bestProduct = summary.bestProduct?.name;
  const lowProduct = summary.lowProduct?.name;
  const predictedRevenue = Math.round(summary.total * 1.18);

  if (summary.total === 0 || summary.products.length === 0) {
    return [
      {
        icon: Receipt,
        title: "Belum Ada Data Penjualan",
        text: "Tambahkan transaksi pertama di menu Penjualan agar AI bisa membuat insight bisnis yang lebih akurat.",
        tone: "info",
      },
      {
        icon: Sparkles,
        title: "Mulai dari Produk Utama",
        text: "Catat nama produk, jumlah terjual, dan harga. Data ini akan dipakai untuk analisis, strategi, dan rekomendasi AI.",
        tone: "primary",
      },
    ];
  }

  if (bestProduct) {
    items.push({
      icon: Package,
      title: "Produk Terlaris",
      text: `${bestProduct} menjadi produk dengan performa terbaik. Pastikan stoknya tersedia sebelum jam ramai.`,
      tone: "success",
    });
  }

  if (bestProduct && lowProduct && bestProduct !== lowProduct) {
    items.push({
      icon: Megaphone,
      title: "Rekomendasi Bundling",
      text: `Gabungkan ${bestProduct} + ${lowProduct} sebagai paket hemat agar produk yang kurang laku ikut terdorong.`,
      tone: "primary",
    });
  }

  if (summary.todayCount > 0) {
    items.push({
      icon: TrendingUp,
      title: "Performa Hari Ini",
      text: `Hari ini sudah ada ${summary.todayCount} transaksi dengan omzet ${formatRupiah(summary.todayTotal)}.`,
      tone: "success",
    });
  } else {
    items.push({
      icon: AlertTriangle,
      title: "Belum Ada Transaksi Hari Ini",
      text: "Belum ada penjualan yang tercatat hari ini. Coba mulai promosi ringan di media sosial atau tawarkan produk terlaris.",
      tone: "warning",
    });
  }

  if (summary.total < 100000) {
    items.push({
      icon: Megaphone,
      title: "Omzet Masih Perlu Didorong",
      text: "Omzet masih di bawah Rp100.000. Coba gunakan promo terbatas, bundling, atau diskon kecil untuk menarik pembeli.",
      tone: "warning",
    });
  } else {
    items.push({
      icon: TrendingUp,
      title: "Prediksi Omzet",
      text: `Jika pola transaksi stabil dan promosi rutin dijalankan, omzet berikutnya diperkirakan mencapai ${formatRupiah(predictedRevenue)}.`,
      tone: "info",
    });
  }

  items.push({
    icon: Clock,
    title: "Jam Promosi Terbaik",
    text: "Waktu promosi yang disarankan adalah sore hari sekitar pukul 18.00–20.00 saat pelanggan mulai mencari makanan atau minuman.",
    tone: "warning",
  });

  return items;
}

function NotificationsPage() {
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

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
      alert("Gagal mengambil notifikasi: " + error.message);
      setLoading(false);
      return;
    }

    setTransactions((data || []).map(mapSupabaseTx));
    setLoading(false);
  }

  const summary = summarize(transactions);
  const notifications = loading
    ? [
        {
          icon: Sparkles,
          title: "Memuat Notifikasi",
          text: "Sedang mengambil data terbaru dari Supabase.",
          tone: "info" as const,
        },
      ]
    : buildNotifications(summary);

  return (
    <MobileShell>
      <PageHeader
        title="Notifikasi AI"
        subtitle="Insight otomatis dari data bisnismu"
        right={
          <Link
            to="/dashboard"
            className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-sm font-semibold text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
        }
      />

      <section className="px-5 pb-6 md:px-0">
        <div className="space-y-3">
          {notifications.map((item) => (
            <NotificationRow key={item.title} {...item} />
          ))}
        </div>
      </section>
    </MobileShell>
  );
}

function NotificationRow({
  icon: Icon,
  title,
  text,
  tone,
}: NotificationItem) {
  const tones: Record<Tone, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    info: "bg-chart-3/10 text-chart-3",
    warning: "bg-warning/10 text-warning",
  };

  return (
    <div className="flex items-start gap-4 rounded-3xl bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tones[tone]}`}>
        <Icon className="h-6 w-6" />
      </div>

      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold">{title}</h3>
          <Sparkles className="h-4 w-4 text-primary" />
        </div>

        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {text}
        </p>
      </div>
    </div>
  );
}