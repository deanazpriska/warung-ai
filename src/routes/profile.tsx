import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { ComponentType, InputHTMLAttributes, ReactNode } from "react";
import { MobileShell, PageHeader } from "@/components/MobileShell";
import { supabase } from "@/lib/supabase";
import {
  Bell,
  Globe,
  Sparkles,
  LogOut,
  Shield,
  HelpCircle,
  Store,
  Save,
  Pencil,
  Phone,
  Mail,
  X,
  Check,
} from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profil — WarungAI" }] }),
  component: ProfilePage,
});

type Profile = {
  id?: string;
  storeName: string;
  ownerName: string;
  category: string;
  phone: string;
  email: string;
};

type Settings = {
  language: "Indonesia" | "English";
  notification: boolean;
  aiPreference: "Bahasa santai" | "Profesional" | "Ringkas";
};

type SupabaseProfile = {
  id?: string;
  store_name?: string;
  owner_name?: string;
  category?: string;
  phone?: string;
  email?: string;
};

type Tx = {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
  created_at: string;
};

const SETTINGS_KEY = "warungai_settings";

const defaultProfile: Profile = {
  storeName: "deassert.co",
  ownerName: "Deanaz Priska",
  category: "Kafe & Minuman",
  phone: "085147232675",
  email: "deanazpriskaa@gmail.com",
};

const defaultSettings: Settings = {
  language: "Indonesia",
  notification: true,
  aiPreference: "Bahasa santai",
};

function mapProfile(row: SupabaseProfile): Profile {
  return {
    id: row.id,
    storeName: row.store_name || defaultProfile.storeName,
    ownerName: row.owner_name || defaultProfile.ownerName,
    category: row.category || defaultProfile.category,
    phone: row.phone || defaultProfile.phone,
    email: row.email || defaultProfile.email,
  };
}

function getInitialSettings(): Settings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? JSON.parse(saved) : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [draft, setDraft] = useState<Profile>(defaultProfile);
  const [settings, setSettings] = useState<Settings>(getInitialSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [transactions, setTransactions] = useState<Tx[]>([]);

  const [editing, setEditing] = useState(false);
  const [activePanel, setActivePanel] = useState<
    null | "language" | "notification" | "ai" | "help" | "logout"
  >(null);

  useEffect(() => {
  loadProfile();
  loadTransactions();
}, []);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  async function loadProfile() {
    setLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    if (data) {
      const mapped = mapProfile(data as SupabaseProfile);
      setProfile(mapped);
      setDraft(mapped);
    }

    setLoading(false);
  }

  async function saveProfile() {
    setSaving(true);

    const payload = {
      store_name: draft.storeName,
      owner_name: draft.ownerName,
      category: draft.category,
      phone: draft.phone,
      email: draft.email,
    };

    const result = profile.id
      ? await supabase.from("profiles").update(payload).eq("id", profile.id)
      : await supabase.from("profiles").insert(payload).select().single();

    if (result.error) {
      alert("Gagal menyimpan profil: " + result.error.message);
      setSaving(false);
      return;
    }

    setProfile(draft);
    setEditing(false);
    setSaving(false);
    loadProfile();
  }

  async function loadTransactions() {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  setTransactions(data || []);
}

  function cancelEdit() {
    setDraft(profile);
    setEditing(false);
  }

  const initial = profile.storeName.charAt(0).toUpperCase() || "W";

  const totalOmzet = transactions.reduce(
  (sum, item) => sum + Number(item.quantity) * Number(item.price),
  0
);

const productCount = new Set(transactions.map((item) => item.product_name)).size;

const activeDays = new Set(
  transactions.map((item) => new Date(item.created_at).toDateString())
).size;

const omzetScore = Math.min((totalOmzet / 1000000) * 100, 100);
const transaksiScore = Math.min((transactions.length / 20) * 100, 100);
const produkScore = Math.min((productCount / 5) * 100, 100);
const konsistensiScore = Math.min((activeDays / 7) * 100, 100);

const healthScore = Math.round(
  omzetScore * 0.4 +
    transaksiScore * 0.3 +
    produkScore * 0.2 +
    konsistensiScore * 0.1
);

const customerEstimate = transactions.length;

  return (
    <MobileShell>
      <PageHeader title="Profil Bisnis" subtitle="Atur informasi & preferensimu" />

      <section className="px-5 md:px-0">
        <div className="overflow-hidden rounded-3xl bg-[image:var(--gradient-primary)] p-5 text-primary-foreground shadow-[var(--shadow-glow)]">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-2xl font-extrabold backdrop-blur">
              {initial}
            </div>

            <div className="flex-1">
              <p className="text-xs text-white/80">Profil</p>
              <h2 className="text-lg font-bold">
                {loading ? "Memuat..." : profile.storeName}
              </h2>
              <p className="text-xs text-white/85">{profile.category}</p>
            </div>

            <button
              onClick={() => setEditing(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur active:scale-95"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/20 pt-4 text-center">
            <Stat label="Skor" value={String(healthScore)} />
            <Stat label="Produk" value={String(productCount)} />
            <Stat label="Pelanggan" value={String(customerEstimate)} />
          </div>
        </div>
      </section>

      {editing && (
        <section className="mx-5 mt-5 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] md:mx-0">
          <h3 className="mb-3 text-sm font-semibold">Edit Profil Bisnis</h3>

          <div className="space-y-3">
            <Input
              label="Nama Toko"
              value={draft.storeName}
              onChange={(e) => setDraft({ ...draft, storeName: e.target.value })}
            />

            <Input
              label="Nama Pemilik"
              value={draft.ownerName}
              onChange={(e) => setDraft({ ...draft, ownerName: e.target.value })}
            />

            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-muted-foreground">
                Kategori
              </span>
              <select
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2.5 text-sm focus:border-primary focus:bg-card focus:outline-none"
              >
                <option>Makanan & Minuman</option>
                <option>Kafe & Minuman</option>
                <option>Fashion</option>
                <option>Kerajinan</option>
                <option>Jasa</option>
                <option>Lainnya</option>
              </select>
            </label>

            <Input
              label="No. HP"
              value={draft.phone}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
            />

            <Input
              label="Email"
              type="email"
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              onClick={cancelEdit}
              className="rounded-xl border border-border bg-secondary/60 py-3 text-sm font-semibold"
            >
              Batal
            </button>

            <button
              onClick={saveProfile}
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </section>
      )}

      <section className="mt-5 px-5 md:px-0">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Informasi Toko
        </h3>

        <div className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-soft)]">
          <InfoRow icon={Store} label="Nama Toko" value={profile.storeName} />
          <InfoRow icon={Shield} label="Pemilik" value={profile.ownerName} />
          <InfoRow icon={Sparkles} label="Kategori" value={profile.category} />
          <InfoRow icon={Phone} label="No. HP" value={profile.phone} />
          <InfoRow icon={Mail} label="Email" value={profile.email} last />
        </div>
      </section>

      <section className="mt-5 px-5 md:px-0">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Pengaturan
        </h3>

        <div className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-soft)]">
          <InfoRow
            icon={Globe}
            label="Bahasa"
            value={settings.language}
            clickable
            onClick={() => setActivePanel("language")}
          />
          <InfoRow
            icon={Bell}
            label="Notifikasi"
            value={settings.notification ? "Aktif" : "Nonaktif"}
            clickable
            onClick={() => setActivePanel("notification")}
          />
          <InfoRow
            icon={Sparkles}
            label="Preferensi AI"
            value={settings.aiPreference}
            clickable
            onClick={() => setActivePanel("ai")}
          />
          <InfoRow
            icon={HelpCircle}
            label="Bantuan"
            value="Pusat bantuan WarungAI"
            clickable
            onClick={() => setActivePanel("help")}
            last
          />
        </div>
      </section>

      <section className="mt-5 px-5 pb-4 md:px-0">
        <button
          onClick={() => setActivePanel("logout")}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-danger/30 bg-danger/5 px-6 py-3.5 text-sm font-semibold text-danger active:scale-[0.99]"
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </button>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          WarungAI v1.0 • Made with 💚 in Indonesia
        </p>
      </section>

      {activePanel && (
        <Panel title={getPanelTitle(activePanel)} onClose={() => setActivePanel(null)}>
          {activePanel === "language" && (
            <div className="space-y-2">
              {(["Indonesia", "English"] as Settings["language"][]).map((lang) => (
                <OptionButton
                  key={lang}
                  active={settings.language === lang}
                  label={lang}
                  onClick={() => {
                    setSettings({ ...settings, language: lang });
                    setActivePanel(null);
                  }}
                />
              ))}
            </div>
          )}

          {activePanel === "notification" && (
            <div className="space-y-2">
              <OptionButton
                active={settings.notification}
                label="Aktif"
                onClick={() => {
                  setSettings({ ...settings, notification: true });
                  setActivePanel(null);
                }}
              />
              <OptionButton
                active={!settings.notification}
                label="Nonaktif"
                onClick={() => {
                  setSettings({ ...settings, notification: false });
                  setActivePanel(null);
                }}
              />
            </div>
          )}

          {activePanel === "ai" && (
            <div className="space-y-2">
              {(["Bahasa santai", "Profesional", "Ringkas"] as Settings["aiPreference"][]).map((pref) => (
                <OptionButton
                  key={pref}
                  active={settings.aiPreference === pref}
                  label={pref}
                  onClick={() => {
                    setSettings({ ...settings, aiPreference: pref });
                    setActivePanel(null);
                  }}
                />
              ))}
            </div>
          )}

          {activePanel === "help" && (
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                WarungAI membantu UMKM membuat konten promosi, mencatat penjualan,
                menganalisis bisnis, dan menyusun strategi mingguan.
              </p>
              <div className="rounded-2xl bg-secondary/60 p-3">
                <p className="font-semibold text-foreground">Cara memakai:</p>
                <p>1. Catat transaksi di menu Penjualan.</p>
                <p>2. Buka Analisis untuk melihat health score.</p>
                <p>3. Gunakan AI Konten untuk membuat caption promosi.</p>
                <p>4. Tanya Mentor AI untuk strategi bisnis.</p>
              </div>
            </div>
          )}

          {activePanel === "logout" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Apakah kamu yakin ingin keluar dari WarungAI?
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setActivePanel(null)}
                  className="rounded-xl border border-border bg-secondary/60 py-3 text-sm font-semibold"
                >
                  Batal
                </button>

                <Link
                  to="/"
                  className="flex items-center justify-center rounded-xl bg-danger py-3 text-sm font-semibold text-white"
                >
                  Keluar
                </Link>
              </div>
            </div>
          )}
        </Panel>
      )}
    </MobileShell>
  );
}

function getPanelTitle(panel: "language" | "notification" | "ai" | "help" | "logout") {
  return {
    language: "Pilih Bahasa",
    notification: "Atur Notifikasi",
    ai: "Preferensi AI",
    help: "Bantuan",
    logout: "Keluar",
  }[panel];
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-lg font-extrabold">{value}</p>
      <p className="text-[10px] uppercase tracking-wide opacity-80">{label}</p>
    </div>
  );
}

function Input({
  label,
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
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

function InfoRow({
  icon: Icon,
  label,
  value,
  last,
  clickable,
  onClick,
}: {
  icon?: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  last?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}) {
  const Wrapper = clickable ? "button" : "div";

  return (
    <Wrapper
      onClick={onClick as never}
      className={`flex w-full items-center gap-3 px-4 py-3.5 text-left ${
        last ? "" : "border-b border-border"
      } ${clickable ? "active:bg-secondary/60" : ""}`}
    >
      {Icon && (
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      )}

      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {value && <p className="text-xs text-muted-foreground">{value}</p>}
      </div>

      {clickable && <span className="text-muted-foreground">›</span>}
    </Wrapper>
  );
}

function Panel({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 px-4 pb-4">
      <div className="w-full rounded-3xl bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function OptionButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-secondary/60 text-foreground"
      }`}
    >
      {label}
      {active && <Check className="h-4 w-4" />}
    </button>
  );
}