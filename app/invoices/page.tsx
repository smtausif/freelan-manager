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
      DRAFT: "bg-[#34363c] text-gray-200 border border-[#3f3f46]",
      SENT: "bg-blue-600/20 text-blue-300 border border-blue-600/30",
      PAID: "bg-green-600/20 text-green-300 border border-green-600/30",
      OVERDUE: "bg-red-600/20 text-red-300 border border-red-600/30",
      VOID: "bg-gray-600/20 text-gray-300 border border-gray-600/30",
      PARTIAL: "bg-amber-600/20 text-amber-300 border border-amber-600/30",
    };
    return <span className={`text-xs px-2 py-1 rounded ${map[s]}`}>{s}</span>;
    // feel free to titlecase s if you want it prettier
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
      <h1 className="text-2xl font-semibold">Invoices</h1>

      {/* Generate invoice */}
      <form onSubmit={generateInvoice} className="grid gap-3 bg-white border rounded-lg p-4 max-w-4xl">
        <div className="font-medium">Generate from time</div>
        <div className="grid gap-3 md:grid-cols-4">
          <select
            className="bg-[#2e3035] border border-[#3f3f46] rounded-lg px-3 py-2"
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
            className="bg-[#2e3035] border border-[#3f3f46] rounded-lg px-3 py-2"
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
            className="bg-[#2e3035] border border-[#3f3f46] rounded-lg px-3 py-2"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            placeholder="Start date"
          />
          <input
            type="date"
            className="bg-[#2e3035] border border-[#3f3f46] rounded-lg px-3 py-2"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            placeholder="End date"
          />
        </div>
        <div>
          <button className="px-4 py-2">Generate Invoice</button>
        </div>
        <p className="text-xs text-gray-400">
          Tip: choose a project to create a dedicated project invoice. Leave dates empty to include all unbilled time.
        </p>
      </form>

      {/* Filter + CSV */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">Filter:</span>
        {(["ALL", "DRAFT", "SENT", "PAID", "OVERDUE", "VOID", "PARTIAL"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s as any)}
            className={`px-3 py-1.5 rounded border ${
              filter === s ? "bg-[#2a2b30] border-[#3f3f46]" : "bg-transparent border-[#3f3f46]"
            }`}
          >
            {s}
          </button>
        ))}

        <div className="flex-1" />
        <button
          onClick={downloadCsv}
          disabled={exporting || invoices.length === 0}
          className={`px-3 py-1.5 rounded border border-[#3f3f46] ${
            exporting || invoices.length === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-[#2a2b30]"
          }`}
          title={invoices.length === 0 ? "No invoices to export" : "Download CSV for this section"}
          aria-busy={exporting}
        >
          {exporting ? "Preparing..." : "Download CSV"}
        </button>
      </div>

      {/* List */}
      <div className="grid gap-3">
        {invoices.length === 0 && <div className="text-sm text-gray-400">No invoices yet.</div>}

        {invoices.map((inv) => {
          const balance = Math.max(0, inv.total - (inv.amountPaid ?? 0));
          return (
            <div key={inv.id} className="bg-white border rounded-lg p-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="text-lg font-semibold">Invoice #{inv.number}</div>
                  {statusChip(inv.status)}
                </div>
                <div className="text-sm text-gray-400">
                  {inv.client?.name || "Unknown client"}
                  {inv.project?.name ? ` · Project: ${inv.project.name}` : ""}
                  {" · Issued "}
                  {new Date(inv.issueDate).toLocaleDateString()}
                  {" · Due "}
                  {new Date(inv.dueDate).toLocaleDateString()}
                </div>
                <ul className="mt-2 text-sm text-gray-300 list-disc pl-5">
                  {inv.items.slice(0, 3).map((it) => (
                    <li key={it.id}>
                      {it.description} — {it.quantity} × ${it.unitPrice} = ${it.total}
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
                    className="px-3 py-1.5 rounded border border-[#3f3f46] hover:bg-[#2a2b30]"
                  >
                    Record Payment
                  </button>

                  <button
                    onClick={() => downloadPdfFor(inv.id, inv.number)}
                    className="px-3 py-1.5 rounded border border-[#3f3f46] hover:bg-[#2a2b30]"
                    title="Download PDF of this invoice"
                  >
                    PDF
                  </button>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-gray-400">Subtotal</div>
                <div className="font-medium">{dollars(inv.subtotal)}</div>
                <div className="text-xs text-gray-400 mt-1">Tax</div>
                <div className="font-medium">{dollars(inv.tax)}</div>
                <div className="text-xs text-gray-400 mt-1">Total</div>
                <div className="text-xl font-semibold">{dollars(inv.total)}</div>

                <div className="text-xs text-gray-400 mt-3">Paid</div>
                <div className="font-medium">{dollars(inv.amountPaid ?? 0)}</div>
                <div className="text-xs text-gray-400 mt-1">Balance</div>
                <div className="text-xl font-semibold">{dollars(balance)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
