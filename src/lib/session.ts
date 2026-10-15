import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const COOKIE = "cw_session";
const MAX_AGE = 60 * 60 * 24 * 30;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("SESSION_SECRET nao configurado");
  return new TextEncoder().encode(value);
}

export type SessionUser = { id: string; username: string };

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ username: user.username })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { id: payload.sub as string, username: payload.username as string };
  } catch {
    return null;
  }
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}
