// app/api/projects/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// TEMP dev helper: replace with your real auth
async function getUserId() {
  const u = await prisma.user.findFirst({ where: { email: "demo@fcc.app" } });
  if (!u) throw new Error("Dev user not found. Seed a demo user or wire auth.");
  return u.id;
}

export async function GET() {
  const userId = await getUserId();
  const projects = await prisma.project.findMany({
    where: { userId },
    include: { client: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(projects);
}

type CreateProjectBody = {
  clientId: string;
  name: string;
  billingType?: "HOURLY" | "FIXED";
  hourlyRate?: number | null;
  fixedFee?: number | null;
  status?:
    | "ACTIVE"
    | "ON_HOLD"
    | "CANCELLED"
    | "CANCELLED_BY_CLIENT"
    | "CANCELLED_BY_FREELANCER"
    | "HANDED_OVER"
    | "COMPLETED";
};

export async function POST(req: Request) {
  const userId = await getUserId();
  const body = (await req.json()) as CreateProjectBody;

  if (!body?.clientId || !body?.name) {
    return NextResponse.json(
      { error: "clientId and name are required" },
      { status: 400 }
    );
  }

  // Read defaults via the User -> settings relation (avoid prisma.userSettings)
  const userWithSettings = await (prisma as any).user.findUnique({
    where: { id: userId },
    include: { settings: true }, // if your generated client exposes userSettings, change to { userSettings: true }
  });
  const st = userWithSettings?.settings ?? null;

  const project = await prisma.project.create({
    data: {
      userId,
      clientId: body.clientId,
      name: body.name,
      billingType: body.billingType ?? (st?.defaultBilling ?? "HOURLY"),
      hourlyRate: body.hourlyRate ?? (st?.defaultRate ?? null),
      fixedFee: body.fixedFee ?? null,
      status: body.status ?? "ACTIVE",
    },
    include: { client: true },
  });

  return NextResponse.json(project, { status: 201 });
}
