// app/dashboard/page.tsx
export default function DashboardPage() {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
  
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border bg-white p-4">Unpaid Total: $0</div>
          <div className="rounded-lg border bg-white p-4">Overdue: 0</div>
          <div className="rounded-lg border bg-white p-4">This Month: $0</div>
          <div className="rounded-lg border bg-white p-4">Hours Tracked: 0</div>
        </div>
      </div>
    );
  }
  