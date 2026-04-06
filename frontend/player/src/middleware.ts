import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = ["/wallet", "/account", "/bonuses"];
const AUTH_PATHS = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const response = NextResponse.next();
  response.headers.set("x-brand-host", request.headers.get("host") || "localhost");

  // Strip locale prefix for auth checks
  const cleanPath = pathname.replace(/^\/(sv|en|fi|no)/, "") || "/";

  // Auth: protect certain paths
  const accessToken = request.cookies.get("odin_access_token")?.value;
  const isProtected = PROTECTED_PATHS.some((p) => cleanPath.startsWith(p));
  if (isProtected && !accessToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isAuthPage = AUTH_PATHS.some((p) => cleanPath.startsWith(p));
  if (isAuthPage && accessToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.svg|api).*)",
  ],
};
