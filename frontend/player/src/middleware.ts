import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { locales, defaultLocale, isValidLocale } from "@/lib/i18n-config";

const PROTECTED_PATHS = ["/wallet", "/account", "/bonuses"];
const AUTH_PATHS = ["/login", "/register"];

function getPathnameWithoutLocale(pathname: string): string {
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return pathname.replace(`/${locale}`, "") || "/";
    }
  }
  return pathname;
}

function getLocaleFromPathname(pathname: string): string | null {
  const segment = pathname.split("/")[1];
  if (segment && isValidLocale(segment)) {
    return segment;
  }
  return null;
}

function getPreferredLocale(request: NextRequest): string {
  // Check cookie first
  const cookieLocale = request.cookies.get("odin_locale")?.value;
  if (cookieLocale && isValidLocale(cookieLocale)) {
    return cookieLocale;
  }

  // Check Accept-Language header
  const acceptLang = request.headers.get("accept-language") || "";
  for (const locale of locales) {
    if (acceptLang.includes(locale)) {
      return locale;
    }
  }

  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") // files with extensions
  ) {
    return NextResponse.next();
  }

  // Detect locale from URL
  const pathnameLocale = getLocaleFromPathname(pathname);
  const cleanPathname = getPathnameWithoutLocale(pathname);

  // If no locale in URL, redirect to preferred locale
  if (!pathnameLocale) {
    const preferredLocale = getPreferredLocale(request);
    // Default locale (en) uses bare URLs, others get prefix
    if (preferredLocale === defaultLocale) {
      // English: serve at / without redirect, just set header
      const response = NextResponse.next();
      response.headers.set("x-locale", defaultLocale);
      response.headers.set("x-brand-host", request.headers.get("host") || "localhost");

      // Auth checks for bare (English) paths
      const accessToken = request.cookies.get("odin_access_token")?.value;
      const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
      if (isProtected && !accessToken) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }
      const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));
      if (isAuthPage && accessToken) {
        return NextResponse.redirect(new URL("/", request.url));
      }

      return response;
    }
    // Non-default locale: redirect to /{locale}/path
    const url = new URL(`/${preferredLocale}${pathname === "/" ? "" : pathname}`, request.url);
    return NextResponse.redirect(url);
  }

  // Locale is in URL
  const response = NextResponse.next();
  response.headers.set("x-locale", pathnameLocale);
  response.headers.set("x-brand-host", request.headers.get("host") || "localhost");

  // Auth checks on locale-prefixed paths
  const accessToken = request.cookies.get("odin_access_token")?.value;
  const isProtected = PROTECTED_PATHS.some((p) => cleanPathname.startsWith(p));
  if (isProtected && !accessToken) {
    const loginUrl = new URL(`/${pathnameLocale}/login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }
  const isAuthPage = AUTH_PATHS.some((p) => cleanPathname.startsWith(p));
  if (isAuthPage && accessToken) {
    return NextResponse.redirect(new URL(`/${pathnameLocale}`, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.svg).*)",
  ],
};
