// middleware.ts
import { NextRequest, NextResponse } from "next/server";

const ROLE_PATHS = {
  admin: ["/admin"],
  ops: ["/ops"],
  pm: ["/pm"],
  teamlead: ["/teamlead"],
};

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const role = request.cookies.get("user_role")?.value;

  const allowed = ROLE_PATHS[role as keyof typeof ROLE_PATHS]?.some(path =>
    pathname.startsWith(path)
  );

  if (!allowed && pathname !== "/login" && pathname !== "/register") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/ops/:path*", "/pm/:path*", "/teamlead/:path*"],
};
