// app/api/settings/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

async function ensureDevUserId() {
  const email = "demo@fcc.app";
  const u = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "Demo User" },
  });
  return u.id;
}

const ALLOWED_KEYS = new Set([
  "currency","taxRate","terms","invoicePrefix","nextNumber","invoiceNotes","allowPartial",
  "rounding","minEntry","weekStartsOn","dayStart",
  "defaultBilling","defaultRate","autoArchiveOnHandover",
  "nOverdue","nPayment","nProjectChange","nWeeklySummary",
  "theme","accent",
  "businessName","displayName","email","phone","address1","address2","city","country","logoUrl",
]);

export async function GET() {
  try {
    const userId = await ensureDevUserId();

    // read via relation (no prisma.userSettings)
    let user = await (prisma as any).user.findUnique({
      where: { id: userId },
      include: { settings: true },              // if your relation is userSettings, rename both lines
    });

    if (!user?.settings) {
      user = await (prisma as any).user.update({
        where: { id: userId },
        data: { settings: { create: {} } },
        include: { settings: true },
      });
    }

    return NextResponse.json(user.settings);
  } catch (e) {
    console.error("GET /api/settings", e);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const userId = await ensureDevUserId();
    const raw = await req.json().catch(() => ({} as Record<string, unknown>));

    // whitelist & light coercion
    const data: Record<string, any> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (!ALLOWED_KEYS.has(k)) continue;
      if (k === "taxRate" || k === "defaultRate") data[k] = Number(v);
      else if (k === "nextNumber" || k === "minEntry") data[k] = Number(v);
      else if (k.startsWith("n") || k.startsWith("allow") || k.startsWith("auto"))
        data[k] = Boolean(v);
      else data[k] = v;
    }

    // upsert via relation (no prisma.userSettings)
    const updatedUser = await (prisma as any).user.update({
      where: { id: userId },
      data: {
        settings: {
          upsert: {
            update: data,
            create: data,
          },
        },
      },
      include: { settings: true },
    });

    return NextResponse.json(updatedUser.settings);
  } catch (e) {
    console.error("PATCH /api/settings", e);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
