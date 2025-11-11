import { cookies } from "next/headers";
import { lucia } from "./lucia";

export async function validateRequest() {
  const sessionCookie = cookies().get(lucia.sessionCookieName);
  if (!sessionCookie) {
    return { session: null, user: null } as const;
  }

  try {
    const result = await lucia.validateSession(sessionCookie.value);
    if (!result.session || !result.user) {
      const blank = lucia.createBlankSessionCookie();
      cookies().set(blank.name, blank.value, blank.attributes);
      return { session: null, user: null } as const;
    }

    if (result.session.fresh) {
      const newSessionCookie = lucia.createSessionCookie(result.session.id);
      cookies().set(
        newSessionCookie.name,
        newSessionCookie.value,
        newSessionCookie.attributes
      );
    }

    return result;
  } catch {
    const blank = lucia.createBlankSessionCookie();
    cookies().set(blank.name, blank.value, blank.attributes);
    return { session: null, user: null } as const;
  }
}
