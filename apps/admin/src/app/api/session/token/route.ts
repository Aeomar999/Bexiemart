import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "../route";

/**
 * Socket.io must connect directly to the API host, so it needs the raw token.
 * Exposing it via this endpoint (cookie-gated, returned to page JS on demand)
 * is a deliberate, narrower exposure than the previous persistent localStorage
 * copy: nothing survives a page close, and nothing is readable without an
 * authenticated cookie.
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ token });
}
