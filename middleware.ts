import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/auth/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const authToken = request.cookies.get("auth_token");

  console.log("[Middleware] Path:", pathname);
  console.log("[Middleware] Has auth_token:", !!authToken);
  console.log("[Middleware] Token value:", authToken?.value);

  if (!authToken || authToken.value !== "authenticated") {
    console.log("[Middleware] Not authenticated, redirecting to /login");
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  console.log("[Middleware] Authenticated, allowing access");

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
