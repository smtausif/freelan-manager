// app/api/projects/route.ts
import { NextResponse } from "next/server";
//import { prisma } from "@/lib/db";
import { prisma } from "../../../lib/db";

async function getUserId() {
  const u = await prisma.user.findFirst({ where: { email: "demo@fcc.app" } });
  return u!.id;
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

export async function POST(req: Request) {
  const userId = await getUserId();
  const body = await req.json();
  const st = await prisma.userSettings.findUnique({ where: { userId } });

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

