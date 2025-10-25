// app/reports/time/[projectId]/page.tsx
import Link from "next/link";
import { headers } from "next/headers";

type ApiResp = {
  project: { id: string; name: string; clientName: string };
  stats: {
    totalMin: number;
    entryCount: number;
    avgMin: number;
    range: { from: string | null; to: string | null };
  };
  entries: {
    id: string;
    description: string | null;
    start: string;
    end: string;
    durationMin: number | null;
  }[];
};

function fmtMin(min?: number | null) {
  if (!min || min <= 0) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

// Build an absolute base URL for server-side fetches
function getBaseUrl() {
  const h = headers();
  const proto =
    h.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");
  const host =
    h.get("x-forwarded-host") ??
    h.get("host") ??
    process.env.VERCEL_URL ??
    "localhost:3000";
  return `${proto}://${host}`;
}

export default async function ProjectTimeReport({
  params,
  searchParams,
}: {
  params: { projectId: string };
  searchParams: { from?: string; to?: string };
}) {
  const qs = new URLSearchParams();
  if (searchParams.from) qs.set("from", searchParams.from);
  if (searchParams.to) qs.set("to", searchParams.to);

  const base = getBaseUrl();
  const url = `${base}/api/time/by-project/${params.projectId}${
    qs.toString() ? `?${qs.toString()}` : ""
  }`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load time summary");
  const data: ApiResp = await res.json();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/time" className="text-sm text-gray-300 hover:underline">
          ← Back to Time
        </Link>
        <h1 className="text-2xl font-bold">Time Summary</h1>
      </div>

      {/* Header */}
      <div className="mb-6 rounded-lg border border-[#3f3f46] bg-[#111] p-5">
        <div className="text-sm text-gray-400">Project</div>
        <div className="text-lg font-semibold">
          {data.project.name}{" "}
          <span className="text-gray-400">— {data.project.clientName}</span>
        </div>
      </div>

      {/* Metric cards */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-[#3f3f46] bg-[#121317] p-4">
          <div className="text-sm text-gray-400">Total time</div>
          <div className="text-2xl font-semibold">{fmtMin(data.stats.totalMin)}</div>
        </div>
        <div className="rounded-lg border border-[#3f3f46] bg-[#121317] p-4">
          <div className="text-sm text-gray-400">Logs</div>
          <div className="text-2xl font-semibold">{data.stats.entryCount}</div>
        </div>
        <div className="rounded-lg border border-[#3f3f46] bg-[#121317] p-4">
          <div className="text-sm text-gray-400">Avg / log</div>
          <div className="text-2xl font-semibold">{fmtMin(data.stats.avgMin)}</div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-[#3f3f46] overflow-hidden">
        <div className="grid grid-cols-12 bg-[#17181d] text-sm font-medium">
          <div className="col-span-6 py-3 px-4">Description</div>
          <div className="col-span-2 py-3 px-4">Date</div>
          <div className="col-span-2 py-3 px-4">Start–End</div>
          <div className="col-span-2 py-3 px-4 text-right">Duration</div>
        </div>

        {data.entries.map((e) => {
          const d = new Date(e.start);
          const end = new Date(e.end);
          return (
            <div
              key={e.id}
              className="grid grid-cols-12 border-t border-[#2a2b30] bg-[#121317] hover:bg-[#16171c]"
            >
              <div className="col-span-6 py-3 px-4">
                <div className="font-medium">
                  {e.description?.trim() || "No description"}
                </div>
              </div>
              <div className="col-span-2 py-3 px-4 text-gray-300">
                {d.toLocaleDateString()}
              </div>
              <div className="col-span-2 py-3 px-4 text-gray-300">
                {d.toLocaleTimeString()} – {end.toLocaleTimeString()}
              </div>
              <div className="col-span-2 py-3 px-4 text-right font-semibold">
                {fmtMin(e.durationMin)}
              </div>
            </div>
          );
        })}

        {data.entries.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-400">
            No logs in this range.
          </div>
        )}
      </div>
    </div>
  );
}
