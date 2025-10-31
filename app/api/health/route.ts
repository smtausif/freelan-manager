import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const users = await prisma.user.count();
    return new Response(JSON.stringify({ ok: true, users }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ ok: false, error: err?.message ?? "unknown" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
