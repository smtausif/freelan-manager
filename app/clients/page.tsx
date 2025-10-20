// app/clients/page.tsx
"use client";

import { useEffect, useState } from "react";

type Client = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  notes?: string | null;
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    notes: "",
  });

  async function load() {
    const res = await fetch("/api/clients");
    const data = await res.json();
    setClients(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function createClient(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "", email: "", phone: "", company: "", notes: "" });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/clients/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Clients</h1>

      {/* Add Client Form */}
      <form
        onSubmit={createClient}
        className="grid gap-2 bg-white border rounded-lg p-4 md:grid-cols-2"
      >
        <input
          className="border rounded px-3 py-2"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))}
          required
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))}
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm((v) => ({ ...v, phone: e.target.value }))}
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Company"
          value={form.company}
          onChange={(e) => setForm((v) => ({ ...v, company: e.target.value }))}
        />
        <input
          className="border rounded px-3 py-2 md:col-span-2"
          placeholder="Notes"
          value={form.notes}
          onChange={(e) => setForm((v) => ({ ...v, notes: e.target.value }))}
        />
        <button className="mt-2 w-max bg-black text-white px-4 py-2 rounded">
          Add Client
        </button>
      </form>

      {/* List */}
      <div className="grid gap-3">
        {clients.map((c) => (
          <div
            key={c.id}
            className="bg-white border rounded-lg p-4 flex items-center justify-between"
          >
            <div>
              <div className="font-medium">{c.name}</div>
              <div className="text-sm text-gray-600">
                {c.email || "—"} · {c.phone || "—"} · {c.company || "—"}
              </div>
              {c.notes && (
                <div className="text-sm text-gray-500 mt-1">{c.notes}</div>
              )}
            </div>
            <button
              onClick={() => remove(c.id)}
              className="text-red-600 hover:underline"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
