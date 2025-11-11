"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/** Backed by /api/settings (PUT/GET). Only fields we actually use. */
type Settings = {
  // Profile & Business
  businessName: string;
  displayName: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  country: string;

  // Invoicing
  currency: string;
  taxRate: number;
  terms: "NET_7" | "NET_15" | "NET_30";
  invoicePrefix: string;

  // Time tracking
  rounding: "NONE" | "NEAREST_5" | "NEAREST_15";
  defaultBilling: "HOURLY" | "FIXED";
  defaultRate: number;

  // Notifications
  notifyInvoiceOverdue: boolean;
  notifyProjectStatusChanged: boolean;

  // Appearance (kept for API compatibility, but unused in UI)
  theme: "LIGHT" | "DARK" | "SYSTEM";
};

type Selectable<T extends string> = T | "";
type SettingsFormState = Omit<
  Settings,
  "currency" | "terms" | "rounding" | "defaultBilling"
> & {
  currency: Selectable<Settings["currency"]>;
  terms: Selectable<Settings["terms"]>;
  rounding: Selectable<Settings["rounding"]>;
  defaultBilling: Selectable<Settings["defaultBilling"]>;
};

const CURRENCIES = ["USD", "CAD", "EUR", "GBP"] as const;
const TERMS: Settings["terms"][] = ["NET_7", "NET_15", "NET_30"];
const ROUNDING: Settings["rounding"][] = ["NONE", "NEAREST_5", "NEAREST_15"];

export default function SettingsPage() {
  const router = useRouter();
  const [s, setS] = useState<SettingsFormState>({
    businessName: "",
    displayName: "",
    email: "",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    country: "",

    currency: "",
    taxRate: 13,
    terms: "",
    invoicePrefix: "INV-",

    rounding: "",
    defaultBilling: "",
    defaultRate: 85,

    notifyInvoiceOverdue: true,
    notifyProjectStatusChanged: false,

    theme: "LIGHT",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/settings", { cache: "no-store" });
      if (r.ok) {
        const data = await r.json();
        setS((prev) => ({
          ...prev,
          ...data,
          theme: "LIGHT",
        })); // force LIGHT locally
      }
      setLoading(false);
    })();
  }, []);

  const set = <K extends keyof SettingsFormState>(k: K, v: SettingsFormState[K]) =>
    setS((p) => ({ ...p, [k]: v }));

  async function save() {
    setSaving(true);
    try {
      if (!s.currency || !s.terms || !s.rounding || !s.defaultBilling) {
        alert("Please select values for currency, payment terms, rounding, and default billing.");
        setSaving(false);
        return;
      }
      const r = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // send theme as LIGHT to keep backend happy
        body: JSON.stringify({ ...s, theme: "LIGHT" }),
      });
      if (!r.ok) alert(await r.text());
    } finally {
      setSaving(false);
    }
  }

  async function deleteAccount() {
    if (!confirm("This will permanently remove your account and all saved data. Continue?")) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch("/api/auth/delete-account", { method: "DELETE" });
      if (!res.ok) {
        alert(await res.text());
        return;
      }
      router.replace("/");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <div className="p-6 text-slate-500">Loading…</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-2xl font-semibold">Settings</h1>

        {/* Profile & Business */}
        <Card title="Profile & Business">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Business name" value={s.businessName} onChange={(v)=>set("businessName", v)} />
            <Field label="Display name" value={s.displayName} onChange={(v)=>set("displayName", v)} />
            <Field label="Email" value={s.email} onChange={(v)=>set("email", v)} />
            <Field label="Phone" value={s.phone} onChange={(v)=>set("phone", v)} />
            <Field label="Address line 1" value={s.address1} onChange={(v)=>set("address1", v)} />
            <Field label="Address line 2" value={s.address2} onChange={(v)=>set("address2", v)} />
            <Field label="City" value={s.city} onChange={(v)=>set("city", v)} />
            <Field label="Country" value={s.country} onChange={(v)=>set("country", v)} />
          </div>
        </Card>

        {/* Invoicing defaults */}
        <Card title="Invoicing defaults">
          <div className="grid gap-3 md:grid-cols-2">
            <Select
              label="Currency"
              value={s.currency}
              onChange={(v)=>set("currency", v as Settings["currency"])}
              options={CURRENCIES}
              placeholder="Select"
            />
            <NumberField
              label="Tax rate (%)"
              value={Number.isFinite(s.taxRate) ? s.taxRate : 0}
              onChange={(v)=>set("taxRate", v)}
            />
            <Select
              label="Payment terms"
              value={s.terms}
              onChange={(v)=>set("terms", v as Settings["terms"])}
              options={TERMS}
              mapLabel={(t)=>String(t).replace("_"," ")}
              placeholder="Select"
            />
            <Field
              label="Invoice prefix"
              value={s.invoicePrefix}
              onChange={(v)=>set("invoicePrefix", v)}
              placeholder="INV-"
            />
          </div>
        </Card>

        {/* Time tracking */}
        <Card title="Time tracking">
          <div className="grid gap-3 md:grid-cols-3">
            <Select
              label="Rounding"
              value={s.rounding}
              onChange={(v)=>set("rounding", v as Settings["rounding"])}
              options={ROUNDING}
              mapLabel={(r)=>String(r).replace("_"," ")}
              placeholder="Select"
            />
            <Select
              label="Default billing"
              value={s.defaultBilling}
              onChange={(v)=>set("defaultBilling", v as Settings["defaultBilling"])}
              options={["HOURLY","FIXED"]}
              placeholder="Select"
            />
            <NumberField
              label="Default hourly rate"
              value={Number.isFinite(s.defaultRate) ? s.defaultRate : 0}
              onChange={(v)=>set("defaultRate", v)}
            />
          </div>
        </Card>

        {/* Notifications */}
        <Card title="Notifications">
          <div className="space-y-2">
            <Toggle
              label="Invoice overdue"
              checked={s.notifyInvoiceOverdue}
              onChange={(v)=>set("notifyInvoiceOverdue", v)}
            />
            <Toggle
              label="Project status changed"
              checked={s.notifyProjectStatusChanged}
              onChange={(v)=>set("notifyProjectStatusChanged", v)}
            />
          </div>
        </Card>

        <Card title="Danger zone">
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Permanently delete your account and all clients, projects, invoices, and time entries.
              This action cannot be undone.
            </p>
            <button
              onClick={deleteAccount}
              disabled={deleting}
              className="w-full rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50 md:w-auto"
            >
              {deleting ? "Deleting…" : "Delete account"}
            </button>
          </div>
        </Card>

        <div className="flex justify-end">
          <button
            onClick={save}
            disabled={saving}
            className="rounded-xl border border-slate-300 bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- presentational bits ---------- */

function Card(props: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">{props.title}</h2>
      {props.children}
    </section>
  );
}

/* ---------- input components (light-only) ---------- */

function Field(props: { label: string; value: string; onChange: (v: string)=>void; placeholder?: string }) {
  const { label, value, onChange, placeholder } = props;
  return (
    <label className="block">
      <div className="mb-1 text-xs text-slate-600">{label}</div>
      <input
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2
                   text-slate-900 placeholder-slate-500
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15"
        value={value}
        placeholder={placeholder}
        onChange={(e)=>onChange(e.target.value)}
      />
    </label>
  );
}

function NumberField(props: { label: string; value: number; onChange: (v: number)=>void }) {
  const { label, value, onChange } = props;
  return (
    <label className="block">
      <div className="mb-1 text-xs text-slate-600">{label}</div>
      <input
        type="number"
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2
                   text-slate-900 placeholder-slate-500
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e)=>onChange(Number(e.target.value || 0))}
      />
    </label>
  );
}

function Select<T extends string>(props: {
  label: string;
  value: T | "";
  onChange: (v: T)=>void;
  options: readonly T[] | string[];
  mapLabel?: (v: string)=>string;
  placeholder?: string;
}) {
  const { label, value, onChange, options, mapLabel, placeholder } = props;
  return (
    <label className="block">
      <div className="mb-1 text-xs text-slate-600">{label}</div>
      <select
        className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 py-2
                   text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15"
        value={value ?? ""}
        onChange={(e)=>onChange(e.target.value as T)}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((o) => (
          <option key={String(o)} value={String(o)}>
            {mapLabel ? mapLabel(String(o)) : String(o)}
          </option>
        ))}
      </select>
    </label>
  );
}

function Toggle(props: { label: string; checked: boolean; onChange:(v:boolean)=>void }) {
  const { label, checked, onChange } = props;
  return (
    <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
      <span className="text-sm text-slate-700">{label}</span>
      <input
        type="checkbox"
        className="h-5 w-5 accent-slate-800"
        checked={checked}
        onChange={(e)=>onChange(e.target.checked)}
      />
    </label>
  );
}
