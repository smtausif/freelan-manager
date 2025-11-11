import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { validateRequest } from "@/lib/auth/session";
import NavTabs from "@/components/NavTabs";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { session, user } = await validateRequest();
  if (!session) {
    redirect("/login");
  }

  const initial =
    user?.name?.charAt(0)?.toUpperCase() ??
    user?.email?.charAt(0)?.toUpperCase() ??
    "N";

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text)]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="text-2xl font-semibold tracking-tight text-slate-900 shrink-0">
              TRACKwo
            </div>
            <div className="flex items-center gap-2">
              <form action="/api/auth/logout" method="post">
                <button
                  type="submit"
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-slate-100"
                >
                  Sign out
                </button>
              </form>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white shrink-0">
                {initial}
              </div>
            </div>
          </div>

          <div className="mt-3 md:mt-4 md:flex md:items-center">
            <div className="basis-0 flex-1 min-w-0">
              <NavTabs />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
