import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const url = new URL(req.url);

  // публичные страницы
  const publicRoutes = ["/", "/signin", "/signup", "/api/auth"];
  if (publicRoutes.some(path => url.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // если не авторизован — на /signin
  if (!token) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  const role = token?.role;

  // проверка доступов по ролям
  if (url.pathname.startsWith("/owner") && role !== "OWNER") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (url.pathname.startsWith("/partner") && role !== "PARTNER" && role !== "OWNER") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (url.pathname.startsWith("/point") && role !== "POINT" && role !== "PARTNER" && role !== "OWNER") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|static|images|favicon.ico|api/auth).*)"],
};
