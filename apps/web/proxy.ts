import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

// Optimistic redirect for signed-in pages: no session cookie means sign in
// first, then come back (a bare space link shows its preview instead). This only checks the cookie exists; every page and
// action still verifies the session itself.
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();
  const { pathname, search } = request.nextUrl;
  // A space link opened while signed out shows the public preview at the same
  // address, so the link still works after signing in.
  const space = pathname.match(/^\/s\/([a-z0-9-]+)\/?$/);
  if (space) return NextResponse.rewrite(new URL(`/join/${space[1]}`, request.url));
  const url = new URL("/sign-in", request.url);
  url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/spaces/:path*", "/account/:path*", "/liked/:path*", "/s/:path*"],
};
