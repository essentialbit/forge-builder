import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED_PATHS = ["/builder", "/admin"];

function jwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET ?? "";
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow the setup page through
  if (pathname === "/setup") return NextResponse.next();

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get("forge-session")?.value;

  if (!token) {
    return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url));
  }

  try {
    await jwtVerify(token, jwtSecret());
    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url));
    res.cookies.set("forge-session", "", { maxAge: 0, path: "/" });
    res.cookies.set("forge-user", "", { maxAge: 0, path: "/" });
    return res;
  }
}

export const config = {
  matcher: ["/builder/:path*", "/admin/:path*", "/setup"],
};
