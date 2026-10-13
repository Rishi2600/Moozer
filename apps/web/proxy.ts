import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

// Optimistic redirect for signed-in pages: no session cookie means sign in
// first, then come back. This only checks the cookie exists; every page and
// action still verifies the session itself.
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();
  const { pathname, search } = request.nextUrl;
  const url = new URL("/sign-in", request.url);
  url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/spaces/:path*", "/account/:path*", "/s/:path*"],
};
