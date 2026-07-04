import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { MobileShell, PageHeader } from "@/components/MobileShell";
import {
  Sparkles,
  Copy,
  Check,
  Wand2,
  ScanLine,
  Camera,
  Download,
} from "lucide-react";

export const Route = createFileRoute("/ai-content")({
  head: () => ({ meta: [{ title: "Buat Konten AI — WarungAI" }] }),
  component: AIContentPage,
});

function AIContentPage() {
  const [generated, setGenerated] = useState(false);
  const [scanned, setScanned] = useState(false);

  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("Makanan & Minuman");
  const [description, setDescription] = useState("");
  const [advantages, setAdvantages] = useState("");
  const [targetMarket, setTargetMarket] = useState("");

  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  const [imagePreview, setImagePreview] = useState("");
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  const [bestProduct, setBestProduct] = useState("");
  const [lowProduct, setLowProduct] = useState("");
  const [totalSales, setTotalSales] = useState(0);
  const [bestProductSales, setBestProductSales] = useState(0);
  const [bestProductQty, setBestProductQty] = useState(0);

  useEffect(() => {
    loadBestProduct();
  }, []);

  function parseJsonResponse(text: string) {
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    return JSON.parse(match ? match[0] : cleaned);
  }

  function formatRupiah(value: number) {
    return `Rp ${value.toLocaleString("id-ID")}`;
  }

  function fileToGenerativePart(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64Data = (reader.result as string).split(",")[1];

        resolve({
          inlineData: {
            data: base64Data,
            mimeType: file.type,
          },
        });
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function buildAllContent() {
    if (!aiResult) return "";

    return `
AI CONTENT WARUNGAI

AI INSIGHT
${aiResult.insight || ""}

CAPTION INSTAGRAM
${aiResult.instagram || ""}

CAPTION WHATSAPP
${aiResult.whatsapp || ""}

CAPTION TIKTOK
${aiResult.tiktok || ""}

DESKRIPSI PRODUK
${aiResult.deskripsi || ""}

MARKETING COPY
${aiResult.marketing || ""}

HASHTAG
${aiResult.hashtag || ""}

IDE PROMOSI
${aiResult.promosi || ""}
`.trim();
  }

  function copyAll() {
    navigator.clipboard?.writeText(buildAllContent());
    alert("Semua hasil AI berhasil disalin.");
  }

  function downloadTxt() {
    const blob = new Blob([buildAllContent()], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `konten-${productName || "warungai"}.txt`;
    a.click();

    URL.revokeObjectURL(url);
  }

  async function scanProductImage(file: File) {
    try {
      setScanLoading(true);
      setScanned(false);
      setScanResult(null);

      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
      });

      const imagePart = await fileToGenerativePart(file);

      const prompt = `
Kamu adalah AI visual analyst untuk produk UMKM makanan, minuman, fashion, dan kerajinan.

Analisis gambar produk yang diberikan.
Identifikasi produk seakurat mungkin berdasarkan bentuk, warna, tekstur, dan konteks visual.

Jika gambar menunjukkan makanan seperti dimsum, siomay, bakpao, kue, minuman, dessert, camilan, roti, nasi, atau lauk, sebutkan nama produk yang paling mungkin.
Jangan menjawab "Produk UMKM Lokal" kecuali gambar benar-benar tidak bisa dikenali.

Jawab HANYA dalam JSON valid berikut:

{
  "namaProduk": "",
  "deskripsi": "",
  "captionPromosi": "",
  "hashtag": "",
  "promo": "",
  "harga": "",
  "targetPembeli": ""
}

Aturan:
- Gunakan bahasa Indonesia.
- Jangan gunakan markdown.
- Jangan gunakan code block.
- Jangan menulis penjelasan di luar JSON.
- Nama produk harus spesifik, misalnya "Dimsum Ayam", "Siomay", "Choco Lava Cake", bukan nama generik.
- Jika tidak yakin, tulis estimasi terbaik, misalnya "Dimsum" atau "Camilan Kukus".
- Hashtag maksimal 8 hashtag.
`;

      const result = await model.generateContent([prompt, imagePart]);
      const response = result.response.text();

      console.log("SCAN RAW RESPONSE:", response);

      const cleanJson = parseJsonResponse(response);

      setScanResult({
        namaProduk: cleanJson.namaProduk || "Produk belum teridentifikasi",
        deskripsi: cleanJson.deskripsi || "",
        captionPromosi: cleanJson.captionPromosi || "",
        hashtag: cleanJson.hashtag || "",
        promo: cleanJson.promo || "",
        harga: cleanJson.harga || "",
        targetPembeli: cleanJson.targetPembeli || "",
      });

      setScanned(true);
    } catch (error) {
      console.error("SCAN ERROR:", error);

      setScanResult({
        namaProduk: "Produk belum berhasil dikenali",
        deskripsi:
          "AI belum berhasil membaca gambar produk dengan akurat. Coba gunakan foto yang lebih jelas, terang, dan menampilkan produk dari jarak dekat.",
        captionPromosi:
          "Produk pilihan siap menemani harimu. Yuk coba sekarang dan dukung UMKM lokal!",
        hashtag:
          "#UMKMIndonesia #ProdukLokal #KulinerLokal #DukungUMKM #WarungAI",
        promo:
          "Gunakan promo bundling atau diskon terbatas untuk menarik minat pelanggan.",
        harga:
          "Sesuaikan dengan modal, ukuran porsi, dan harga kompetitor.",
        targetPembeli:
          "Pelanggan lokal, anak muda, mahasiswa, pekerja, dan pengguna media sosial.",
      });

      setScanned(true);
    } finally {
      setScanLoading(false);
    }
  }

  async function loadBestProduct() {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    const grouped: Record<string, { qty: number; omzet: number }> = {};
    let total = 0;

    (data || []).forEach((item) => {
      const name = item.product_name;
      const qty = Number(item.quantity);
      const price = Number(item.price);
      const omzet = qty * price;

      if (!grouped[name]) {
        grouped[name] = { qty: 0, omzet: 0 };
      }

      grouped[name].qty += qty;
      grouped[name].omzet += omzet;
      total += omzet;
    });

    const products = Object.entries(grouped)
      .map(([name, value]) => ({
        name,
        qty: value.qty,
        omzet: value.omzet,
      }))
      .sort((a, b) => b.omzet - a.omzet);

    if (products[0]) {
      setBestProduct(products[0].name);
      setBestProductSales(products[0].omzet);
      setBestProductQty(products[0].qty);
      setTotalSales(total);
      setLowProduct(products[products.length - 1]?.name || "");

      if (!productName) {
        setProductName(products[0].name);
        setDescription(
          `${products[0].name} adalah produk terlaris berdasarkan data penjualan.`
        );
        setAdvantages("Produk favorit pelanggan dan memiliki omzet tertinggi.");
        setTargetMarket("Pelanggan yang menyukai produk populer dan promo menarik.");
      }
    }
  }

  async function generateContent() {
  try {
    setLoading(true);

    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
      },
    });

    const contribution =
      totalSales > 0 ? Math.round((bestProductSales / totalSales) * 100) : 0;

    const styles = [
      "soft selling",
      "storytelling",
      "FOMO",
      "ceria dan santai",
      "premium dan elegan",
      "ramah seperti admin UMKM",
    ];

    const style = styles[Math.floor(Math.random() * styles.length)];
    const todaySeed = Date.now();

    const prompt = `
Kamu adalah copywriter kreatif untuk UMKM Indonesia.

Buat konten marketing yang BERBEDA, natural, dan tidak terasa seperti template.
Gunakan gaya: ${style}
Seed variasi: ${todaySeed}

Data produk:
Nama Produk: ${productName}
Kategori: ${category}
Deskripsi: ${description}
Keunggulan: ${advantages}
Target Pasar: ${targetMarket}

Data penjualan:
Produk terlaris: ${bestProduct || "Belum ada data"}
Produk kurang laku: ${lowProduct || "Belum ada data"}
Omzet produk terlaris: ${formatRupiah(bestProductSales)}
Jumlah terjual produk terlaris: ${bestProductQty}
Total omzet semua produk: ${formatRupiah(totalSales)}
Kontribusi produk terlaris: ${contribution}%

Tugas:
Buat output dalam JSON valid berikut:

{
  "insight": "",
  "instagram": "",
  "whatsapp": "",
  "tiktok": "",
  "deskripsi": "",
  "marketing": "",
  "hashtag": "",
  "promosi": ""
}

Aturan penting:
- Jangan gunakan pola kalimat yang sama seperti "dipilih karena menjadi produk dengan omzet terbaik".
- Buat insight yang lebih spesifik berdasarkan produk, kategori, keunggulan, target pasar, dan data omzet.
- Caption Instagram minimal 2 kalimat dan punya hook menarik.
- Caption WhatsApp harus terasa seperti pesan admin toko.
- Caption TikTok harus berupa ide konten singkat yang catchy.
- Promosi harus praktis dan cocok untuk UMKM.
- Gunakan bahasa Indonesia.
- Emoji secukupnya.
- Jangan pakai markdown.
- Jawab hanya JSON valid.
`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const cleanJson = parseJsonResponse(response);

    setAiResult(cleanJson);
    setGenerated(true);
  } catch (error) {
    console.error("GENERATE CONTENT ERROR:", error);

    const fallbackStyles = [
      {
        insight: `${productName || "Produk ini"} punya peluang besar untuk dipromosikan karena sesuai dengan minat ${targetMarket || "pelanggan"} dan memiliki daya tarik utama pada ${advantages || "keunggulan produknya"}.`,
        instagram: `Lagi cari ${category.toLowerCase()} yang cocok buat menemani harimu? Coba ${productName || "produk favorit kami"} ✨ ${description || "Produk ini dibuat untuk pelanggan yang suka pilihan praktis dan menarik."}`,
        whatsapp: `Halo kak 😊 Hari ini kami punya ${productName || "produk pilihan"} yang cocok banget buat dicoba. Keunggulannya: ${advantages || "rasanya enak dan disukai pelanggan"}. Mau pesan sekarang?`,
        tiktok: `Ide video: tunjukkan proses penyajian ${productName || "produk ini"}, lalu tambahkan teks "sekali coba, langsung pengen repeat order!"`,
      },
      {
        insight: `${productName || "Produk ini"} bisa dijadikan produk unggulan karena memiliki nilai jual yang mudah dipahami pelanggan dan cocok untuk dibuat promo bundling.`,
        instagram: `${productName || "Produk lokal"} siap jadi pilihan baru buat kamu yang suka produk UMKM berkualitas. Cocok untuk ${targetMarket || "pelanggan lokal"} yang ingin sesuatu yang praktis, enak, dan menarik.`,
        whatsapp: `Kak, ada rekomendasi hari ini nih 🙌 ${productName || "Produk favorit"} cocok buat kamu yang suka ${category.toLowerCase()}. Stok terbatas, boleh langsung order ya.`,
        tiktok: `POV: nemu ${productName || "produk UMKM"} yang ternyata seenak itu 😍 Cocok buat konten before-after atau first reaction.`,
      },
    ];

    const selected =
      fallbackStyles[Math.floor(Math.random() * fallbackStyles.length)];

    setAiResult({
      insight: selected.insight,
      instagram: selected.instagram,
      whatsapp: selected.whatsapp,
      tiktok: selected.tiktok,
      deskripsi:
        `${productName || "Produk UMKM"} merupakan produk ${category.toLowerCase()} yang memiliki keunggulan ${advantages || "menarik untuk pelanggan"}. Cocok untuk ${targetMarket || "pasar lokal"}.`,
      marketing:
        `Tonjolkan keunggulan ${productName || "produk"} melalui konten visual, testimoni pelanggan, dan promo terbatas agar lebih menarik.`,
      hashtag:
        `#${(productName || "ProdukUMKM").replace(/\s+/g, "")} #UMKMIndonesia #ProdukLokal #KulinerUMKM #WarungAI`,
      promosi:
        `Buat promo bundling ${productName || "produk utama"} dengan ${lowProduct || "produk lain"} agar pelanggan tertarik membeli lebih dari satu item.`,
    });

    setGenerated(true);
  } finally {
    setLoading(false);
  }
}``

  return (
    <MobileShell>
      <PageHeader
        title="Buat Konten AI ✨"
        subtitle="Bikin caption & promosi berdasarkan data penjualan"
      />

      <section className="mb-4 px-5">
        <div className="overflow-hidden rounded-3xl bg-[image:var(--gradient-hero)] p-5 text-primary-foreground shadow-[var(--shadow-glow)]">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
            <ScanLine className="h-3 w-3" /> Baru
          </span>

          <h2 className="mt-2 text-lg font-bold leading-snug">
            Foto Produk Jadi Konten Siap Posting
          </h2>

          <p className="mt-1 text-xs text-white/85">
            AI bisa scan foto produk dan membuat konten promosi otomatis.
          </p>

          <label className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-primary active:scale-[0.98]">
            <Camera className="h-4 w-4" />
            {scanLoading ? "Sedang Scan Produk..." : "Scan Produk"}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) scanProductImage(file);
              }}
            />
          </label>
        </div>
      </section>

      {imagePreview && (
        <section className="mb-4 px-5">
          <img
            src={imagePreview}
            alt="Preview produk"
            className="max-h-[420px] w-full rounded-3xl object-contain bg-white shadow-[var(--shadow-soft)]"
          />
        </section>
      )}

      {scanned && scanResult && (
        <section className="mb-2 px-5 pb-2">
          <div className="mb-3 flex items-center gap-2">
            <ScanLine className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Hasil Scan Produk AI</h2>
          </div>

          <div className="space-y-3">
            <ResultCard title="🏷️ Nama Produk AI" text={scanResult.namaProduk || ""} />
            <ResultCard title="📝 Deskripsi Produk" text={scanResult.deskripsi || ""} />
            <ResultCard title="📣 Caption Promosi" text={scanResult.captionPromosi || ""} />
            <ResultCard title="🔖 Hashtag" text={scanResult.hashtag || ""} />
            <ResultCard title="🎁 Ide Promo" text={scanResult.promo || ""} />
            <ResultCard title="💰 Rekomendasi Harga" text={scanResult.harga || ""} />
            <ResultCard title="👥 Target Pembeli" text={scanResult.targetPembeli || ""} />
          </div>
        </section>
      )}

      <div className="space-y-3 px-5">
        <Field label="Nama Produk" value={productName} onChange={(e) => setProductName(e.target.value)} />
        <Select
          label="Kategori"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={["Makanan & Minuman", "Fashion", "Kerajinan", "Jasa", "Lainnya"]}
        />
        <Field label="Deskripsi Produk" multiline value={description} onChange={(e) => setDescription(e.target.value)} />
        <Field label="Keunggulan Produk" value={advantages} onChange={(e) => setAdvantages(e.target.value)} />
        <Field label="Target Pasar" value={targetMarket} onChange={(e) => setTargetMarket(e.target.value)} />

        <button
          onClick={generateContent}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[image:var(--gradient-primary)] px-6 py-4 text-base font-semibold text-primary-foreground shadow-[var(--shadow-glow)] active:scale-[0.98]"
        >
          <Wand2 className="h-5 w-5" />
          {loading ? "Sedang Membuat Konten..." : "Generate Konten AI"}
        </button>
      </div>

      {generated && aiResult && (
        <section className="mt-6 px-5 pb-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Hasil AI Berbasis Data</h2>
            </div>

            <div className="flex gap-2">
              <button
                onClick={copyAll}
                className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary"
              >
                <Copy className="h-3 w-3" />
                Copy All
              </button>

              <button
                onClick={downloadTxt}
                className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground"
              >
                <Download className="h-3 w-3" />
                TXT
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <ResultCard title="📊 AI Insight" text={aiResult.insight || ""} />
            <ResultCard title="📸 Caption Instagram" text={aiResult.instagram || ""} />
            <ResultCard title="💬 Caption WhatsApp" text={aiResult.whatsapp || ""} />
            <ResultCard title="🎥 Caption TikTok" text={aiResult.tiktok || ""} />
            <ResultCard title="📝 Deskripsi Produk" text={aiResult.deskripsi || ""} />
            <ResultCard title="📢 Marketing Copy" text={aiResult.marketing || ""} />
            <ResultCard title="🏷️ Hashtag" text={aiResult.hashtag || ""} />
            <ResultCard title="🎁 Ide Promosi" text={aiResult.promosi || ""} />
          </div>
        </section>
      )}
    </MobileShell>
  );
}

function Field({
  label,
  multiline,
  ...props
}: { label: string; multiline?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  const cls =
    "w-full rounded-2xl border border-border bg-secondary/50 px-4 py-3.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:outline-none";

  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </span>

      {multiline ? (
        <textarea
          rows={3}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          className={cls}
        />
      ) : (
        <input {...props} className={cls} />
      )}
    </label>
  );
}

function Select({
  label,
  options,
  ...props
}: {
  label: string;
  options: string[];
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </span>

      <select
        {...props}
        className="w-full appearance-none rounded-2xl border border-border bg-secondary/50 px-4 py-3.5 text-sm focus:border-primary focus:bg-card focus:outline-none"
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function ResultCard({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-primary">
          {title}
        </h3>

        <button
          onClick={() => {
            navigator.clipboard?.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Disalin" : "Salin"}
        </button>
      </div>

      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground">
        {text}
      </p>
    </div>
  );
}