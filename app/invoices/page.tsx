// app/invoices/page.tsx
"use client";

import { useEffect, useState } from "react";

type Client = { id: string; name: string };
type Project = { id: string; name: string; clientId: string };
type Invoice = {
  id: string;
  number: number;
  issueDate: string;
  dueDate: string;
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "VOID" | "PARTIAL";
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  client: { name: string } | null;
  project: { name: string } | null;
  items: { id: string; description: string; quantity: number; unitPrice: number; total: number }[];
  payments: { id: string; amount: number; paidAt: string }[];
};

export default function InvoicesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filter, setFilter] = useState<Invoice["status"] | "ALL">("ALL");

  // generator form
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  // UI niceties
  const [exporting, setExporting] = useState(false);

  async function loadInvoices() {
    const url = filter === "ALL" ? "/api/invoices" : `/api/invoices?status=${filter}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error("Failed to load invoices");
      setInvoices([]);
      return;
    }
    setInvoices(await res.json());
  }

  useEffect(() => {
    fetch("/api/clients").then((r) => r.json()).then(setClients);
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [filter]);

  // when client changes, show only their projects
  useEffect(() => {
    setProjectId("");
    if (!clientId) {
      setProjects([]);
      return;
    }
    fetch("/api/projects")
      .then((r) => r.json())
      .then((all) => setProjects(all.filter((p: Project) => p.clientId === clientId)));
  }, [clientId]);

  async function generateInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) {
      alert("Pick a client");
      return;
    }

    const dateBits: Record<string, string> = {};
    if (start) dateBits.start = new Date(start).toISOString();
    if (end) dateBits.end = new Date(end).toISOString();

    let r: Response;
    if (projectId) {
      // per-project
      r = await fetch("/api/invoices/generate-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, ...dateBits }),
      });
    } else {
      // per-client (all projects combined)
      r = await fetch("/api/invoices/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, ...dateBits }),
      });
    }

    if (!r.ok) {
      alert(await r.text());
      return;
    }

    setClientId("");
    setProjectId("");
    setStart("");
    setEnd("");
    await loadInvoices();
  }

  const statusChip = (s: Invoice["status"]) => {
    const map: Record<Invoice["status"], string> = {
      DRAFT: "bg-slate-100 text-slate-700 border border-slate-200",
      SENT: "bg-blue-50 text-blue-700 border border-blue-200",
      PAID: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      OVERDUE: "bg-rose-50 text-rose-700 border border-rose-200",
      VOID: "bg-slate-50 text-slate-500 border border-slate-200",
      PARTIAL: "bg-amber-50 text-amber-700 border border-amber-200",
    };
    const label = s.replace("_", " ").toUpperCase();
    return <span className={`text-xs px-2 py-1 rounded-full ${map[s]}`}>{label}</span>;
  };

  function dollars(n: number) {
    return `$${n.toFixed(2)}`;
  }

  // Download CSV for the current section/filter
  async function downloadCsv() {
    try {
      setExporting(true);
      const url =
        filter === "ALL"
          ? "/api/invoices/export"
          : `/api/invoices/export?status=${encodeURIComponent(filter)}`;

      const res = await fetch(url);
      if (!res.ok) {
        alert("Failed to export CSV");
        return;
      }
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      const today = new Date().toISOString().slice(0, 10);
      a.download = `invoices_${filter}_${today}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } finally {
      setExporting(false);
    }
  }

  // Download PDF for a specific invoice
  async function downloadPdfFor(invId: string, invNumber: number) {
    const res = await fetch(`/api/invoices/${invId}/pdf`);
    if (!res.ok) {
      alert("Failed to generate PDF");
      return;
    }
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `invoice_${invNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Invoices</h1>

      {/* Generate invoice */}
      <form
        onSubmit={generateInvoice}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm max-w-4xl"
      >
        <div className="text-slate-900 font-medium">Generate from time</div>

        <div className="grid gap-3 md:grid-cols-4">
          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="">Select client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none disabled:opacity-60"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            disabled={!clientId}
          >
            <option value="">All projects for this client</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            placeholder="Start date"
          />
          <input
            type="date"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            placeholder="End date"
          />
        </div>

        <div>
          <button className="rounded-full bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">
            Generate Invoice
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Tip: choose a project to create a dedicated project invoice. Leave dates empty to include all unbilled time.
        </p>
      </form>

      {/* Filter + CSV */}
<div className="flex flex-col gap-3 md:flex-row md:items-center">
  <div className="flex items-center gap-2">
    <span className="shrink-0 text-sm text-slate-500">Filter:</span>

    {/* make chips wrap on small screens and scroll smoothly if needed */}
    <div className="flex flex-wrap gap-2 overflow-x-auto md:overflow-visible">
      {(["ALL", "DRAFT", "SENT", "PAID", "OVERDUE", "VOID", "PARTIAL"] as const).map((s) => (
        <button
          key={s}
          onClick={() => setFilter(s)}
          className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
            filter === s
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  </div>

  {/* push CSV right on md+, stack under chips on mobile */}
  <div className="md:ml-auto">
    <button
      onClick={downloadCsv}
      disabled={exporting || invoices.length === 0}
      className={`w-full md:w-auto rounded-full border px-3 py-1.5 text-sm font-medium ${
        exporting || invoices.length === 0
          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
      }`}
      title={invoices.length === 0 ? "No invoices to export" : "Download CSV for this section"}
      aria-busy={exporting}
    >
      {exporting ? "Preparing..." : "Download CSV"}
    </button>
  </div>
</div>

      {/* List */}
      <div className="grid gap-3">
        {invoices.length === 0 && <div className="text-sm text-slate-500">No invoices yet.</div>}

        {invoices.map((inv) => {
          const balance = Math.max(0, inv.total - (inv.amountPaid ?? 0));
          return (
            <div
              key={inv.id}
              className="flex items-start justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div>
                <div className="flex items-center gap-3">
                  <div className="text-lg font-semibold text-slate-900">Invoice #{inv.number}</div>
                  {statusChip(inv.status)}
                </div>
                <div className="text-sm text-slate-500">
                  {inv.client?.name || "Unknown client"}
                  {inv.project?.name ? ` · Project: ${inv.project.name}` : ""}
                  {" · Issued "}
                  {new Date(inv.issueDate).toLocaleDateString()}
                  {" · Due "}
                  {new Date(inv.dueDate).toLocaleDateString()}
                </div>

                <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
                  {inv.items.slice(0, 3).map((it) => (
                    <li key={it.id}>
                      {it.description} — {it.quantity} × {dollars(it.unitPrice)} = {dollars(it.total)}
                    </li>
                  ))}
                  {inv.items.length > 3 && <li>…and {inv.items.length - 3} more items</li>}
                </ul>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={async () => {
                      const v = prompt("Payment amount (e.g., 500):");
                      const amt = v ? Number(v) : 0;
                      if (!amt || amt <= 0) return;
                      const r = await fetch(`/api/invoices/${inv.id}/pay`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ amount: amt, method: "Manual" }),
                      });
                      if (r.ok) loadInvoices();
                      else alert(await r.text());
                    }}
                    className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Record Payment
                  </button>

                  <button
                    onClick={() => downloadPdfFor(inv.id, inv.number)}
                    className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    title="Download PDF of this invoice"
                  >
                    PDF
                  </button>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-500">Subtotal</div>
                <div className="font-medium text-slate-900">{dollars(inv.subtotal)}</div>
                <div className="mt-1 text-xs text-slate-500">Tax</div>
                <div className="font-medium text-slate-900">{dollars(inv.tax)}</div>
                <div className="mt-1 text-xs text-slate-500">Total</div>
                <div className="text-xl font-semibold text-slate-900">{dollars(inv.total)}</div>

                <div className="mt-3 text-xs text-slate-500">Paid</div>
                <div className="font-medium text-slate-900">{dollars(inv.amountPaid ?? 0)}</div>
                <div className="mt-1 text-xs text-slate-500">Balance</div>
                <div className="text-xl font-semibold text-slate-900">{dollars(balance)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
