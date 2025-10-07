import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

// Указываем, что middleware должен работать в Node.js runtime, а не в edge
export const runtime = 'nodejs';

const OWNER_RE = /^\/owner(\/|$)/;
const PARTNER_RE = /^\/partner(\/|$)/;

export async function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname;
  const token = await getToken({ req });

  // Публичные маршруты, которые не требуют авторизации
  const publicRoutes = ["/", "/pricing", "/signin", "/signup"];
  const isPublicRoute = publicRoutes.includes(path) || path.startsWith("/api/auth") || path.startsWith("/uploads") || path.startsWith("/api/files");
  
  // Если это публичный маршрут, пропускаем проверку авторизации
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Для всех остальных маршрутов требуется авторизация
  if (!token) {
    return NextResponse.redirect(new URL("/signin", url));
  }

  const userRole = (token as any).role as string | undefined;

  // Проверка доступа к owner маршрутам (только для ORGANIZATION_OWNER и выше)
  if (OWNER_RE.test(path)) {
    if (userRole !== "ORGANIZATION_OWNER" && userRole !== "PLATFORM_OWNER") {
      return NextResponse.redirect(new URL("/dashboard", url));
    }
    return NextResponse.next();
  }

  // Проверка доступа к partner маршрутам (для MANAGER и выше)
  if (PARTNER_RE.test(path)) {
    if (userRole !== "PLATFORM_OWNER" && userRole !== "ORGANIZATION_OWNER" && userRole !== "MANAGER") {
      return NextResponse.redirect(new URL("/dashboard", url));
    }
    return NextResponse.next();
  }

  // Проверка доступа к биллингу (только для ORGANIZATION_OWNER и выше)
  if (path.startsWith("/billing")) {
    if (userRole !== "PLATFORM_OWNER" && userRole !== "ORGANIZATION_OWNER") {
      return NextResponse.redirect(new URL("/dashboard", url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|static|images|favicon.ico|api/auth|signin|signup|pricing).*)",
    "/dashboard/:path*",
    "/billing/:path*", 
    "/owner/:path*",
    "/partner/:path*",
    "/labeling/:path*",
    "/files/:path*",
    "/learning/:path*",
    "/haccp/:path*",
    "/medical-books/:path*",
    "/schedule-salary/:path*",
    "/employees/:path*"
  ],
};
