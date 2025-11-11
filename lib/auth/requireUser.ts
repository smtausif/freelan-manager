import { validateRequest } from "./session";

export class UnauthorizedError extends Error {
  status = 401;
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function requireUserId() {
  const { session } = await validateRequest();
  if (!session) {
    throw new UnauthorizedError();
  }
  return session.userId;
}
