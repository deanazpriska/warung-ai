import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect, useMemo } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { MobileShell } from "@/components/MobileShell";
import { ArrowLeft, Send, Sparkles, Bot } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/mentor")({
  head: () => ({ meta: [{ title: "Mentor AI UMKM — WarungAI" }] }),
  component: MentorPage,
});

type Msg = { role: "user" | "ai"; text: string };

type Tx = {
  id: string;
  name: string;
  qty: number;
  price: number;
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

const suggestions = [
  "Analisis bisnis saya",
  "Produk apa yang harus dipromosikan?",
  "Bundling seperti apa contohnya?",
  "Strategi diskon yang efektif?",
];

function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function mapSupabaseTx(row: SupabaseTx): Tx {
  return {
    id: row.id,
    name: row.product_name,
    qty: Number(row.quantity),
    price: Number(row.price),
    createdAt: row.created_at,
  };
}

function mapProfile(row: SupabaseProfile): Profile {
  return {
    storeName: row.store_name || defaultProfile.storeName,
    ownerName: row.owner_name || defaultProfile.ownerName,
    category: row.category || defaultProfile.category,
    phone: row.phone || defaultProfile.phone,
    email: row.email || defaultProfile.email,
  };
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

function fallbackReply(
  q: string,
  profile: Profile,
  summary: ReturnType<typeof summarizeTransactions>
) {
  const question = q.toLowerCase();
  const best = summary.bestProduct?.name || "produk terlaris";
  const low = summary.lowProduct?.name || "produk yang kurang laku";
  const omzet = formatRupiah(summary.totalOmzet);

  if (question.includes("analisis")) {
    return `Analisis singkat ${profile.storeName}:

1. Omzet saat ini tercatat ${omzet}.
2. Produk terkuat adalah ${best}.
3. Produk yang bisa didorong adalah ${low}.
4. Fokus strategi terbaik: promosikan ${best}, lalu buat bundling dengan ${low}.`;
  }

  if (question.includes("bundling") || question.includes("paket")) {
    return `Contoh bundling untuk ${profile.storeName}:

1. Paket Best Seller: ${best} + minuman favorit.
2. Paket Hemat: ${best} + ${low} dengan harga sedikit lebih murah.
3. Paket Sore: ${best} khusus jam 15.00–18.00.
4. Paket Couple: 2 produk ${best} untuk menaikkan nilai transaksi.`;
  }

  if (question.includes("diskon") || question.includes("promo")) {
    return `Strategi promo yang cocok:

1. Jangan langsung diskon besar.
2. Gunakan bundling ${best} + ${low}.
3. Buat promo terbatas di jam sepi.
4. Pastikan harga promo tetap memberi margin keuntungan.`;
  }

  if (question.includes("stok")) {
    return `Saran stok:

1. Tambah stok ${best} karena paling kuat.
2. Batasi stok ${low} sampai promosinya berjalan.
3. Catat jam produk cepat habis.
4. Siapkan stok ekstra sebelum jam ramai.`;
  }

  return `Berdasarkan data ${profile.storeName}, omzet saat ini ${omzet}. Produk paling kuat adalah ${best}, sedangkan ${low} bisa dijadikan produk bundling agar penjualannya ikut naik.`;
}

function MentorPage() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const summary = useMemo(
    () => summarizeTransactions(transactions),
    [transactions]
  );

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loadingData && messages.length === 0) {
      setMessages([
        {
          role: "ai",
          text: `Halo ${profile.ownerName}! 👋 Saya Mentor AI WarungAI. Saya bisa membaca data penjualan ${profile.storeName} dan memberi saran promosi, stok, harga, bundling, dan strategi penjualan.`,
        },
      ]);
    }
  }, [loadingData, profile.ownerName, profile.storeName, messages.length]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function loadData() {
    setLoadingData(true);

    const [txResult, profileResult] = await Promise.all([
      supabase.from("transactions").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").limit(1).maybeSingle(),
    ]);

    if (txResult.data) {
      setTransactions(txResult.data.map(mapSupabaseTx));
    }

    if (profileResult.data) {
      setProfile(mapProfile(profileResult.data as SupabaseProfile));
    }

    if (txResult.error) console.error(txResult.error);
    if (profileResult.error) console.error(profileResult.error);

    setLoadingData(false);
  }

  async function send(text: string) {
    if (!text.trim() || loading) return;

    const userMessage: Msg = { role: "user", text };
    const currentMessages = [...messages, userMessage];

    setMessages(currentMessages);
    setInput("");
    setLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      if (!apiKey) {
        throw new Error("VITE_GEMINI_API_KEY belum diisi");
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const productData =
        summary.products.length > 0
          ? summary.products
              .map(
                (p) =>
                  `- ${p.name}: ${p.qty} terjual, omzet ${formatRupiah(p.omzet)}`
              )
              .join("\n")
          : "- Belum ada transaksi";

      const chatHistory = currentMessages
        .slice(-6)
        .map((m) => `${m.role === "user" ? "User" : "Mentor"}: ${m.text}`)
        .join("\n");

      const prompt = `
Kamu adalah Mentor AI untuk UMKM Indonesia.
Jawab sebagai konsultan bisnis kecil yang praktis, tidak kaku, dan tidak mengulang jawaban sebelumnya.

Profil UMKM:
- Nama usaha: ${profile.storeName}
- Pemilik: ${profile.ownerName}
- Kategori: ${profile.category}
- Total omzet: ${formatRupiah(summary.totalOmzet)}
- Jumlah transaksi: ${transactions.length}
- Produk terbaik: ${summary.bestProduct?.name || "Belum ada"}
- Produk kurang laku: ${summary.lowProduct?.name || "Belum ada"}

Data produk:
${productData}

Riwayat chat:
${chatHistory}

Pertanyaan terbaru:
${text}

Aturan:
- Gunakan bahasa Indonesia.
- Jawaban harus spesifik sesuai pertanyaan terbaru.
- Jangan mengulang template yang sama.
- Maksimal 4 poin.
- Beri contoh konkret jika user bertanya "contoh", "bundling", "promo", atau "diskon".
`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();

      setMessages((m) => [...m, { role: "ai", text: response }]);
    } catch (error) {
      console.error(error);
      setMessages((m) => [
        ...m,
        { role: "ai", text: fallbackReply(text, profile, summary) },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <MobileShell>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
          <Link
            to="/dashboard"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground">
              <Bot className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-semibold">Mentor AI UMKM</p>
              <p className="flex items-center gap-1 text-[11px] text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                {loadingData ? "Mengambil data..." : "Online"}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 space-y-3 px-4 py-5">
          {messages.map((m, i) =>
            m.role === "ai" ? (
              <div key={i} className="flex gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>

                <div className="max-w-[78%] whitespace-pre-line rounded-2xl rounded-tl-md bg-card px-4 py-3 text-sm leading-relaxed shadow-[var(--shadow-soft)]">
                  {m.text}
                </div>
              </div>
            ) : (
              <div key={i} className="flex justify-end">
                <div className="max-w-[78%] whitespace-pre-line rounded-2xl rounded-tr-md bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground">
                  {m.text}
                </div>
              </div>
            )
          )}

          {loading && (
            <div className="flex gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>

              <div className="rounded-2xl rounded-tl-md bg-card px-4 py-3 text-sm text-muted-foreground shadow-[var(--shadow-soft)]">
                Mentor AI sedang mengetik...
              </div>
            </div>
          )}

          {messages.length <= 1 && (
            <div className="pt-2">
              <p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Pertanyaan populer
              </p>

              <div className="grid gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm text-foreground active:scale-[0.99]"
                  >
                    💡 {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="sticky bottom-0 flex items-center gap-2 border-t border-border bg-card/95 px-4 py-3 backdrop-blur"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanya apa saja..."
            className="flex-1 rounded-2xl border border-border bg-secondary/50 px-4 py-3 text-sm focus:border-primary focus:bg-card focus:outline-none"
          />

          <button
            type="submit"
            disabled={loading || loadingData}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-glow)] active:scale-95 disabled:opacity-60"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </MobileShell>
  );
}