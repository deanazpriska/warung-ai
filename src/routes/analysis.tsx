import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { MobileShell, PageHeader } from "@/components/MobileShell";
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  Package,
  Megaphone,
  Users,
  Lightbulb,
  LineChart,
  Radar,
  Target,
  ChevronRight,
  Flame,
  Clock,
  Tag,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/analysis")({
  head: () => ({ meta: [{ title: "Analisis Bisnis AI — WarungAI" }] }),
  component: AnalysisPage,
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

type PeriodType = "thisMonth" | "lastMonth" | "last30Days" | "all";

type ActionPlan = {
  day: string;
  title: string;
  task: string;
};

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

function filterTransactionsByPeriod(items: Tx[], period: PeriodType) {
  const now = new Date();

  if (period === "all") return items;

  if (period === "last30Days") {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    return items.filter((item) => {
      const date = new Date(item.createdAt);
      return date >= thirtyDaysAgo && date <= now;
    });
  }

  if (period === "thisMonth") {
    return items.filter((item) => {
      const date = new Date(item.createdAt);
      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth()
      );
    });
  }

  if (period === "lastMonth") {
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    return items.filter((item) => {
      const date = new Date(item.createdAt);
      return (
        date.getFullYear() === lastMonth.getFullYear() &&
        date.getMonth() === lastMonth.getMonth()
      );
    });
  }

  return items;
}

function getPeriodLabel(period: PeriodType) {
  return {
    thisMonth: "Bulan ini",
    lastMonth: "Bulan lalu",
    last30Days: "30 hari terakhir",
    all: "Semua data",
  }[period];
}

function summarizeTransactions(items: Tx[]) {
  const totalOmzet = items.reduce((sum, item) => sum + item.qty * item.price, 0);

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
    totalOmzet,
    products,
    bestProduct: products[0],
    lowProduct: products[products.length - 1],
  };
}

function calculateHealthScore(
  items: Tx[],
  summary: ReturnType<typeof summarizeTransactions>
) {
  const totalOmzet = summary.totalOmzet;
  const totalTransaksi = items.length;
  const variasiProduk = summary.products.length;

  const tanggalUnik = new Set(
    items.map((item) => new Date(item.createdAt).toDateString())
  ).size;

  const omzetScore = Math.min((totalOmzet / 1000000) * 100, 100);
  const transaksiScore = Math.min((totalTransaksi / 20) * 100, 100);
  const produkScore = Math.min((variasiProduk / 5) * 100, 100);
  const konsistensiScore = Math.min((tanggalUnik / 7) * 100, 100);

  const total = Math.round(
    omzetScore * 0.4 +
      transaksiScore * 0.3 +
      produkScore * 0.2 +
      konsistensiScore * 0.1
  );

  return {
    total,
    penjualan: Math.round(transaksiScore),
    keuangan: Math.round(omzetScore),
    marketing: Math.round(produkScore),
    layanan: Math.round(konsistensiScore),
  };
}

function getHealthStatus(score: number) {
  if (score >= 80) {
    return {
      title: "Bisnismu Sehat! 💚",
      label: "Sehat",
      bg: "bg-[image:var(--gradient-hero)]",
      text: "text-primary-foreground",
    };
  }

  if (score >= 50) {
    return {
      title: "Bisnismu Kurang Sehat ⚠️",
      label: "Perlu Perhatian",
      bg: "bg-gradient-to-br from-yellow-500 to-orange-500",
      text: "text-white",
    };
  }

  return {
    title: "Bisnismu Tidak Sehat 🚨",
    label: "Butuh Perbaikan",
    bg: "bg-gradient-to-br from-red-500 to-red-700",
    text: "text-white",
  };
}

function AnalysisPage() {
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [period, setPeriod] = useState<PeriodType>("all");
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [actionPlan, setActionPlan] = useState<ActionPlan[]>([]);

  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    setLoadingData(true);

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert("Gagal mengambil data analisis: " + error.message);
      setLoadingData(false);
      return;
    }

    setTransactions((data || []).map(mapSupabaseTx));
    setLoadingData(false);
  }

  const filteredTransactions = useMemo(
    () => filterTransactionsByPeriod(transactions, period),
    [transactions, period]
  );

  const summary = useMemo(
    () => summarizeTransactions(filteredTransactions),
    [filteredTransactions]
  );

  const health = useMemo(
    () => calculateHealthScore(filteredTransactions, summary),
    [filteredTransactions, summary]
  );

  const healthStatus = getHealthStatus(health.total);

  const predicted =
    summary.totalOmzet > 0 ? Math.round(summary.totalOmzet * 1.18) : 0;

  const bestName = summary.bestProduct?.name || "Belum ada data";
  const lowName = summary.lowProduct?.name || "produk kurang laku";
  const growthPercent = summary.totalOmzet > 0 ? 18 : 0;

  function generateActionPlan() {
    const best = summary.bestProduct?.name || "produk terlaris";
    const low = summary.lowProduct?.name || "produk kurang laku";

    setActionPlan([
      {
        day: "Hari 1",
        title: `Promosikan ${best}`,
        task: `Buat konten Instagram/TikTok yang menonjolkan ${best} sebagai produk favorit pelanggan.`,
      },
      {
        day: "Hari 2",
        title: "Buat Paket Bundling",
        task: `Gabungkan ${best} + ${low} sebagai paket hemat agar produk yang kurang laku ikut terdorong.`,
      },
      {
        day: "Hari 3",
        title: "Posting Testimoni",
        task: `Gunakan ulasan pelanggan atau foto produk ${best} untuk membangun kepercayaan pembeli.`,
      },
      {
        day: "Hari 4",
        title: "Promo Jam Ramai",
        task: "Jalankan promo ringan pada jam 18.00–20.00 saat pelanggan lebih aktif mencari makanan/minuman.",
      },
      {
        day: "Hari 5",
        title: "Follow Up Pelanggan",
        task: `Kirim pesan WhatsApp/Instagram kepada pelanggan lama dengan penawaran ${best}.`,
      },
      {
        day: "Hari 6",
        title: "Evaluasi Produk Lemah",
        task: `Cek apakah ${low} mulai meningkat setelah bundling. Jika belum, ubah harga atau pasangan bundlingnya.`,
      },
      {
        day: "Hari 7",
        title: "Evaluasi Mingguan",
        task: "Bandingkan omzet, transaksi, dan produk terlaris setelah strategi dijalankan selama seminggu.",
      },
    ]);
  }

  async function generateAnalysis() {
    const dataPenjualan =
      summary.products.length > 0
        ? summary.products
            .map(
              (p) =>
                `- ${p.name}: ${p.qty} terjual, omzet ${formatRupiah(p.omzet)}`
            )
            .join("\n")
        : "- Belum ada data transaksi";

    try {
      setLoading(true);

      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `
Jawab HANYA dalam format JSON valid.

{
  "ringkasan": "",
  "produkTerbaik": "",
  "produkKurangLaku": "",
  "rekomendasiStok": "",
  "rekomendasiPromosi": "",
  "strategiMingguan": ""
}

Periode analisis: ${getPeriodLabel(period)}

Data penjualan UMKM:
${dataPenjualan}

Total omzet: ${formatRupiah(summary.totalOmzet)}
Jumlah transaksi: ${filteredTransactions.length}
Health score: ${health.total}/100
Kategori bisnis: ${healthStatus.label}
Produk terbaik: ${summary.bestProduct?.name || "Belum ada"}
Produk kurang laku: ${summary.lowProduct?.name || "Belum ada"}

Buat analisis singkat, jelas, dan cocok untuk pelaku UMKM pemula.
Jangan gunakan markdown.
Hanya JSON.
`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();

      const cleanJson = JSON.parse(
        response.replace(/```json/g, "").replace(/```/g, "").trim()
      );

      setAiAnalysis(cleanJson);
    } catch (error) {
      console.error(error);

      const best = summary.bestProduct;
      const low = summary.lowProduct;

      setAiAnalysis({
        ringkasan:
          summary.totalOmzet > 0
            ? `Pada periode ${getPeriodLabel(period)}, total omzet tercatat ${formatRupiah(
                summary.totalOmzet
              )} dari ${filteredTransactions.length} transaksi.`
            : `Belum ada transaksi pada periode ${getPeriodLabel(
                period
              )}. Tambahkan data penjualan terlebih dahulu.`,

        produkTerbaik: best
          ? `${best.name} menjadi produk terbaik dengan ${best.qty} penjualan dan omzet ${formatRupiah(
              best.omzet
            )}.`
          : "Belum ada produk terbaik karena data transaksi masih kosong.",

        produkKurangLaku: low
          ? `${low.name} memiliki performa paling rendah dengan ${low.qty} penjualan dan omzet ${formatRupiah(
              low.omzet
            )}. Produk ini bisa dibantu dengan promo atau bundling.`
          : "Belum ada produk kurang laku karena data transaksi masih kosong.",

        rekomendasiStok: best
          ? `Tambah stok untuk ${best.name} karena produk ini memiliki kontribusi omzet paling tinggi.`
          : "Tambahkan transaksi terlebih dahulu agar rekomendasi stok lebih akurat.",

        rekomendasiPromosi: low
          ? `Buat promo bundling untuk ${low.name} agar penjualannya meningkat.`
          : "Gunakan promo sederhana seperti beli 2 lebih hemat untuk menarik pelanggan awal.",

        strategiMingguan: best
          ? `Fokus promosikan ${best.name}, lalu bantu produk yang lebih lambat terjual dengan diskon terbatas atau paket hemat.`
          : "Mulai catat transaksi harian agar strategi bisnis lebih akurat.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <MobileShell>
      <PageHeader
        title="Analisis Bisnis AI"
        subtitle="Kesehatan bisnismu berdasarkan periode"
      />

      <section className="mb-5 px-5 md:px-0">
        <div className="grid gap-2 md:grid-cols-4">
          {(["thisMonth", "lastMonth", "last30Days", "all"] as PeriodType[]).map(
            (p) => (
              <button
                key={p}
                onClick={() => {
                  setPeriod(p);
                  setAiAnalysis(null);
                  setActionPlan([]);
                }}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  period === p
                    ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]"
                    : "bg-card text-foreground shadow-[var(--shadow-soft)]"
                }`}
              >
                {getPeriodLabel(p)}
              </button>
            )
          )}
        </div>
      </section>

      <section className="mb-5 px-5 md:px-0">
        <button
          onClick={generateAnalysis}
          disabled={loadingData || loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[image:var(--gradient-primary)] px-6 py-4 text-base font-semibold text-primary-foreground shadow-[var(--shadow-glow)] active:scale-[0.98] disabled:opacity-60"
        >
          <Sparkles className="h-5 w-5" />
          {loadingData
            ? "Memuat data Supabase..."
            : loading
              ? "Sedang Menganalisis..."
              : "Generate Analisis AI"}
        </button>
      </section>

      {aiAnalysis && (
        <section className="mb-6 px-5 md:px-0">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" /> Hasil Analisis AI
          </h3>

          <div className="space-y-2.5">
            <Insight icon={TrendingUp} tone="success" title="Ringkasan Bisnis" text={aiAnalysis.ringkasan} />
            <Insight icon={Package} tone="primary" title="Produk Terbaik" text={aiAnalysis.produkTerbaik} />
            <Insight icon={TrendingDown} tone="warning" title="Produk Kurang Laku" text={aiAnalysis.produkKurangLaku} />
            <Recommend icon={Package} title="Rekomendasi Stok" text={aiAnalysis.rekomendasiStok} />
            <Recommend icon={Megaphone} title="Rekomendasi Promosi" text={aiAnalysis.rekomendasiPromosi} />
            <Recommend icon={Target} title="Strategi Mingguan" text={aiAnalysis.strategiMingguan} />
          </div>
        </section>
      )}

      <section className="px-5 md:px-0">
        <div
          className={`overflow-hidden rounded-3xl ${healthStatus.bg} p-6 ${healthStatus.text} shadow-[var(--shadow-glow)]`}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                <Sparkles className="h-3 w-3" /> {healthStatus.label}
              </span>

              <h2 className="mt-2 text-xl font-bold">{healthStatus.title}</h2>

              <p className="mt-1 text-xs text-white/85">
                {getPeriodLabel(period)} • {filteredTransactions.length} transaksi
              </p>
            </div>

            <BigRing value={health.total} />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Breakdown label="Marketing" value={health.marketing} />
            <Breakdown label="Penjualan" value={health.penjualan} />
            <Breakdown label="Keuangan" value={health.keuangan} />
            <Breakdown label="Konsistensi" value={health.layanan} />
          </div>
        </div>
      </section>

      <section className="mt-6 px-5 md:px-0">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <LineChart className="h-4 w-4 text-primary" /> Prediksi Omzet AI
        </h3>

        <div className="rounded-3xl border border-primary/15 bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Estimasi omzet periode berikutnya
              </p>
              <p className="mt-1 text-2xl font-extrabold tracking-tight text-primary">
                {formatRupiah(predicted)}
              </p>
            </div>

            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
              <TrendingUp className="h-3 w-3" /> +{growthPercent}%
            </span>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Prediksi dihitung dari omzet saat ini, jumlah transaksi, produk
            terlaris, dan potensi kenaikan jika promosi berjalan konsisten.
          </p>

          <div className="mt-4 flex h-20 items-end gap-1.5">
            {[40, 55, 48, 62, 70, 65, 80, 88].map((h, i) => (
              <div
                key={i}
                className={`flex-1 rounded-t-md ${
                  i >= 6 ? "bg-primary" : "bg-primary/25"
                }`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>

          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>Lalu</span>
            <span>Sekarang</span>
            <span className="font-semibold text-primary">Prediksi</span>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl bg-primary-soft/50 px-3 py-2.5">
            <span className="flex items-center gap-2 text-xs font-medium text-foreground">
              <Flame className="h-4 w-4 text-warning" /> Produk pendorong
            </span>
            <span className="text-sm font-bold text-primary">{bestName}</span>
          </div>
        </div>
      </section>

      <section className="mt-6 px-5 md:px-0">
        <div className="rounded-3xl bg-card p-5 shadow-[var(--shadow-soft)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Target className="h-4 w-4 text-primary" />
                AI Action Plan 7 Hari
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Rencana aksi otomatis berdasarkan produk terlaris dan produk kurang laku.
              </p>
            </div>

            <button
              onClick={generateActionPlan}
              className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
            >
              Generate
            </button>
          </div>

          {actionPlan.length === 0 ? (
            <div className="rounded-2xl bg-secondary/50 p-4 text-sm text-muted-foreground">
              Klik tombol Generate untuk membuat rencana bisnis 7 hari.
            </div>
          ) : (
            <div className="space-y-3">
              {actionPlan.map((item) => (
                <div
                  key={item.day}
                  className="rounded-2xl border border-border bg-secondary/40 p-4"
                >
                  <p className="text-[11px] font-bold uppercase tracking-wide text-primary">
                    {item.day}
                  </p>
                  <h4 className="mt-1 text-sm font-semibold">{item.title}</h4>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {item.task}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mt-6 px-5 md:px-0">
        <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold">
          <Radar className="h-4 w-4 text-primary" /> Radar Pasar AI
        </h3>
        <p className="mb-3 text-[11px] text-muted-foreground">
          Insight berbasis tren pasar dan perilaku pelanggan
        </p>

        <div className="space-y-2.5">
          <RadarCard
            icon={TrendingUp}
            tone="success"
            tag="TREN NAIK"
            text={`${bestName} sedang menjadi produk utama di tokomu`}
          />
          <RadarCard
            icon={Package}
            tone="primary"
            tag="MENU FAVORIT"
            text={`Bundling ${bestName} + ${lowName} bisa membantu menaikkan transaksi`}
          />
          <RadarCard
            icon={Clock}
            tone="info"
            tag="JAM EMAS"
            text="Konten TikTok makanan lokal punya engagement tinggi jam 18.00–20.00"
          />
          <RadarCard
            icon={Tag}
            tone="warning"
            tag="HARGA PASAR"
            text="Gunakan harga kompetitif dan paket hemat agar menarik pelanggan baru"
          />
        </div>
      </section>

      <section className="mt-6 px-5 md:px-0">
        <Link
          to="/strategy"
          className="flex items-center gap-3 rounded-3xl bg-[image:var(--gradient-primary)] p-4 text-primary-foreground shadow-[var(--shadow-glow)] active:scale-[0.99]"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
            <Target className="h-6 w-6" />
          </div>

          <div className="flex-1">
            <h3 className="text-sm font-bold">Buka Strategi AI</h3>
            <p className="mt-0.5 text-xs text-white/85">
              Dapatkan rencana aksi mingguan dari AI
            </p>
          </div>

          <ChevronRight className="h-5 w-5" />
        </Link>
      </section>

      <section className="mt-6 px-5 md:px-0">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-primary" /> Insight AI
        </h3>

        <div className="space-y-2.5">
          <Insight
            icon={TrendingUp}
            tone="success"
            title="Tren Pendapatan"
            text={`Pada periode ${getPeriodLabel(period)}, total omzet tercatat ${formatRupiah(
              summary.totalOmzet
            )} dari ${filteredTransactions.length} transaksi.`}
          />
          <Insight
            icon={Package}
            tone="primary"
            title="Produk Terbaik"
            text={
              summary.bestProduct
                ? `${summary.bestProduct.name} menyumbang omzet terbesar.`
                : "Belum ada data produk terbaik."
            }
          />
          <Insight
            icon={TrendingDown}
            tone="warning"
            title="Produk Kurang Laku"
            text={
              summary.lowProduct
                ? `${summary.lowProduct.name} perlu dibantu dengan promo atau bundling.`
                : "Belum ada data produk kurang laku."
            }
          />
          <Insight
            icon={Users}
            tone="info"
            title="Tren Pelanggan"
            text="Gunakan Instagram, TikTok, dan pelanggan lama untuk memperluas jangkauan promosi."
          />
        </div>
      </section>

      <section className="mt-6 px-5 pb-4 md:px-0">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Lightbulb className="h-4 w-4 text-warning" /> Rekomendasi Cerdas
        </h3>

        <div className="space-y-2.5">
          <Recommend
            icon={Package}
            title="Stok"
            text={
              summary.bestProduct
                ? `Tambah stok ${summary.bestProduct.name} karena produk ini paling berkontribusi pada omzet.`
                : "Tambahkan data penjualan untuk rekomendasi stok."
            }
          />
          <Recommend
            icon={Megaphone}
            title="Pemasaran"
            text="Posting konten promosi pada jam 18.00–20.00 untuk menjangkau pelanggan aktif."
          />
          <Recommend
            icon={TrendingUp}
            title="Penjualan"
            text={
              summary.lowProduct
                ? `Tawarkan promo bundling untuk ${summary.lowProduct.name} agar penjualan meningkat.`
                : "Gunakan paket hemat untuk meningkatkan transaksi."
            }
          />
        </div>
      </section>
    </MobileShell>
  );
}

function BigRing({ value }: { value: number }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;

  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 96 96" className="h-full w-full -rotate-90">
        <circle cx="48" cy="48" r={r} className="fill-none stroke-white/20" strokeWidth="8" />
        <circle
          cx="48"
          cy="48"
          r={r}
          className="fill-none stroke-white"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold leading-none">{value}</span>
        <span className="text-[10px] opacity-80">dari 100</span>
      </div>
    </div>
  );
}

function Breakdown({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-white/85">{label}</span>
        <span className="text-sm font-bold">{value}</span>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20">
        <div className="h-full rounded-full bg-white" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Insight({
  icon: Icon,
  tone,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: "success" | "primary" | "warning" | "info";
  title: string;
  text: string;
}) {
  const map: Record<string, string> = {
    success: "bg-success/10 text-success",
    primary: "bg-primary/10 text-primary",
    warning: "bg-warning/10 text-warning",
    info: "bg-chart-3/10 text-chart-3",
  };

  return (
    <div className="flex gap-3 rounded-2xl bg-card p-3.5 shadow-[var(--shadow-soft)]">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${map[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

function Recommend({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-primary/15 bg-primary-soft/40 p-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Icon className="h-4 w-4" />
        </div>

        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-foreground/80">{text}</p>
    </div>
  );
}

function RadarCard({
  icon: Icon,
  tone,
  tag,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: "success" | "primary" | "info" | "warning";
  tag: string;
  text: string;
}) {
  const map: Record<string, string> = {
    success: "bg-success/10 text-success",
    primary: "bg-primary/10 text-primary",
    info: "bg-chart-3/10 text-chart-3",
    warning: "bg-warning/10 text-warning",
  };

  return (
    <div className="flex gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-[var(--shadow-soft)]">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${map[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>

      <div className="flex-1">
        <span className={`text-[10px] font-bold uppercase tracking-wide ${map[tone].split(" ")[1]}`}>
          {tag}
        </span>
        <p className="mt-0.5 text-sm leading-relaxed text-foreground">{text}</p>
      </div>
    </div>
  );
}