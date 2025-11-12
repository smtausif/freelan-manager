import { NextRequest, NextResponse } from "next/server";
import { lucia } from "@/lib/auth/lucia";
import { validateRequest } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const { session } = await validateRequest();
  if (session) {
    await lucia.invalidateSession(session.id).catch(() => null);
  }

  const blank = lucia.createBlankSessionCookie();
  const wantsJson =
    request.headers.get("accept")?.includes("application/json") ??
    request.headers.get("x-requested-with") === "XMLHttpRequest";

  const response = wantsJson
    ? NextResponse.json({ ok: true })
    : NextResponse.redirect(`${request.nextUrl.origin}/`);

  response.cookies.set(blank.name, blank.value, blank.attributes);
  return response;
}
