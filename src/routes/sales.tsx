import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileShell, PageHeader } from "@/components/MobileShell";
import { Plus, Search, Filter, Receipt, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/sales")({
  head: () => ({ meta: [{ title: "Catatan Penjualan — WarungAI" }] }),
  component: SalesPage,
});

type Tx = {
  id: string;
  name: string;
  qty: number;
  price: number;
  date: string;
  createdAt: string;
};

type FilterType = "all" | "today" | "yesterday" | "week" | "month" | "custom";

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

function isThisWeek(date: Date) {
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);
  return date >= sevenDaysAgo && date <= now;
}

function isThisMonth(date: Date) {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
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

function filterByDate(items: Tx[], filter: FilterType, selectedDate = "") {
  if (filter === "all") return items;

  return items.filter((item) => {
    const date = new Date(item.createdAt);

    if (filter === "today") return isSameDay(date, new Date());
    if (filter === "yesterday") return isYesterday(date);
    if (filter === "week") return isThisWeek(date);
    if (filter === "month") return isThisMonth(date);

    if (filter === "custom" && selectedDate) {
      const pickedDate = new Date(selectedDate);
      return isSameDay(date, pickedDate);
    }

    return true;
  });
}

function SalesPage() {
  const [items, setItems] = useState<Tx[]>([]);
  const [open, setOpen] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [form, setForm] = useState({ name: "", qty: "", price: "" });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      alert("Gagal mengambil data Supabase: " + error.message);
      setLoading(false);
      return;
    }

    setItems((data || []).map(mapSupabaseTx));
    setLoading(false);
  }

  const dateFilteredItems = filterByDate(items, filter, selectedDate);

  const filteredItems = dateFilteredItems.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const todayItems = filterByDate(items, "today");
  const todayTotal = todayItems.reduce((s, i) => s + i.qty * i.price, 0);
  const total = items.reduce((s, i) => s + i.qty * i.price, 0);
  const filteredTotal = filteredItems.reduce((s, i) => s + i.qty * i.price, 0);

  async function addTransaction() {
    if (!form.name || !form.qty || !form.price || saving) return;

    setSaving(true);

    const qty = Number(form.qty);
    const price = Number(form.price);

    const { data, error } = await supabase
      .from("transactions")
      .insert({
        product_name: form.name,
        quantity: qty,
        price,
        total: qty * price,
      })
      .select()
      .single();

    if (error) {
      alert("Gagal menyimpan ke Supabase: " + error.message);
      setSaving(false);
      return;
    }

    setItems((arr) => [mapSupabaseTx(data), ...arr]);
    setForm({ name: "", qty: "", price: "" });
    setOpen(false);
    setSaving(false);
  }

  async function deleteTransaction(id: string) {
    const confirmDelete = confirm("Hapus transaksi ini?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("transactions").delete().eq("id", id);

    if (error) {
      alert("Gagal menghapus data Supabase: " + error.message);
      return;
    }

    setItems((arr) => arr.filter((item) => item.id !== id));
  }

  const filterLabel: Record<FilterType, string> = {
    all: "Semua",
    today: "Hari ini",
    yesterday: "Kemarin",
    week: "7 hari",
    month: "Bulan ini",
    custom: "Pilih tanggal",
  };

  return (
    <MobileShell>
      <PageHeader
        title="Catatan Penjualan"
        subtitle="Kelola transaksi harianmu"
        right={
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-glow)]"
          >
            <Plus className="h-5 w-5" />
          </button>
        }
      />

      <div className="grid grid-cols-3 gap-2 px-5 md:px-0">
        <Summary
          label="Hari Ini"
          value={`Rp ${todayTotal.toLocaleString("id-ID")}`}
          tone="primary"
        />
        <Summary
          label="Total Omzet"
          value={`Rp ${total.toLocaleString("id-ID")}`}
          tone="warning"
        />
        <Summary label="Transaksi" value={`${items.length}`} tone="success" />
      </div>

      {open && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addTransaction();
          }}
          className="mx-5 mt-4 space-y-3 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] md:mx-0"
        >
          <h3 className="text-sm font-semibold">Tambah Penjualan</h3>

          <Input
            label="Nama Produk"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Jumlah"
              type="number"
              value={form.qty}
              onChange={(e) => setForm({ ...form, qty: e.target.value })}
            />

            <Input
              label="Harga (Rp)"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>

          <button
            disabled={saving}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </form>
      )}

      <div className="mt-5 flex items-center gap-2 px-5 md:px-0">
        <div className="flex flex-1 items-center gap-2 rounded-2xl border border-border bg-secondary/50 px-3.5 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Cari transaksi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm focus:outline-none"
          />
        </div>

        <button
          onClick={() => setShowFilter((v) => !v)}
          className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card"
        >
          <Filter className="h-4 w-4" />
          {filter !== "all" && (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
          )}
        </button>
      </div>

      {showFilter && (
        <section className="mx-5 mt-3 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)] md:mx-0">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Filter Transaksi</h3>
            <button onClick={() => setShowFilter(false)}>
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
            {(
              ["all", "today", "yesterday", "week", "month", "custom"] as FilterType[]
            ).map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                  if (f !== "custom") setShowFilter(false);
                }}
                className={`rounded-xl px-3 py-2 text-sm font-medium ${
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/60 text-foreground"
                }`}
              >
                {filterLabel[f]}
              </button>
            ))}
          </div>

          {filter === "custom" && (
            <div className="mt-3 rounded-xl bg-secondary/50 p-3">
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-muted-foreground">
                  Pilih tanggal transaksi
                </span>

                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setShowFilter(false);
                  }}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
                />
              </label>
            </div>
          )}
        </section>
      )}

      <section className="mt-4 px-5 pb-4 md:px-0">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            Riwayat {filter !== "all" ? `• ${filterLabel[filter]}` : ""}
          </h2>

          <span className="text-xs text-muted-foreground">
            Total: Rp {filteredTotal.toLocaleString("id-ID")}
          </span>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-card p-4 text-center text-sm text-muted-foreground shadow-[var(--shadow-soft)]">
            Memuat data dari Supabase...
          </div>
        ) : (
          <ul className="space-y-2.5">
            {filteredItems.length === 0 && (
              <li className="rounded-2xl bg-card p-4 text-center text-sm text-muted-foreground shadow-[var(--shadow-soft)]">
                Tidak ada transaksi pada filter ini.
              </li>
            )}

            {filteredItems.map((tx) => (
              <li
                key={tx.id}
                className="flex items-center gap-3 rounded-2xl bg-card p-3.5 shadow-[var(--shadow-soft)]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Receipt className="h-5 w-5" />
                </div>

                <div className="flex-1">
                  <p className="text-sm font-medium">{tx.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {tx.qty} × Rp {tx.price.toLocaleString("id-ID")} •{" "}
                    {formatDateLabel(tx.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-success">
                    +Rp {(tx.qty * tx.price).toLocaleString("id-ID")}
                  </span>

                  <button
                    onClick={() => deleteTransaction(tx.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </MobileShell>
  );
}

function Summary({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "primary" | "warning" | "success";
}) {
  const map = {
    primary: "from-primary/15 to-primary/5 text-primary",
    warning: "from-warning/20 to-warning/5 text-warning",
    success: "from-success/15 to-success/5 text-success",
  };

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${map[tone]} p-3`}>
      <p className="text-[10px] font-medium uppercase tracking-wide opacity-80">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

function Input({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-muted-foreground">
        {label}
      </span>
      <input
        {...props}
        className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2.5 text-sm focus:border-primary focus:bg-card focus:outline-none"
      />
    </label>
  );
}