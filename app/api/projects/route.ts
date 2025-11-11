// app/api/projects/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId, UnauthorizedError } from "@/lib/auth/requireUser";

export async function GET() {
  try {
    const userId = await requireUserId();
    const projects = await prisma.project.findMany({
      where: { userId },
      include: { client: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(projects);
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("GET /api/projects", e);
    return NextResponse.json({ error: "Failed to load projects" }, { status: 500 });
  }
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
  try {
    const userId = await requireUserId();
  const body = (await req.json()) as CreateProjectBody;

  if (!body?.clientId || !body?.name) {
    return NextResponse.json(
      { error: "clientId and name are required" },
      { status: 400 }
    );
  }

  // Read defaults via the User -> settings relation (avoid prisma.userSettings)
  const userWithSettings = await prisma.user.findUnique({
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
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("POST /api/projects", e);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
