import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

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

  // Получаем роль пользователя из токена
  const userRole = (token as any).role as string | undefined;

  // Проверка доступа к owner маршрутам (только для Owner)
  if (OWNER_RE.test(path)) {
    if (userRole !== "Owner") {
      return NextResponse.redirect(new URL("/dashboard", url));
    }
    return NextResponse.next();
  }

  // Проверка доступа к partner маршрутам (только для Partner)
  if (PARTNER_RE.test(path)) {
    if (userRole !== "Partner") {
      return NextResponse.redirect(new URL("/dashboard", url));
    }
    return NextResponse.next();
  }

  // Проверка доступа к модулям (Owner, Partner и Point имеют доступ)
  const moduleRoutes = ["/labeling", "/files", "/learning", "/haccp", "/medical-books", "/schedule-salary", "/employees"];
  const isModuleRoute = moduleRoutes.some(route => path.startsWith(route));
  
  if (isModuleRoute) {
    if (userRole !== "Owner" && userRole !== "Partner" && userRole !== "Point") {
      return NextResponse.redirect(new URL("/dashboard", url));
    }
  }

  // Проверка доступа к биллингу (для Owner и Partner)
  if (path.startsWith("/billing")) {
    if (userRole !== "Owner" && userRole !== "Partner") {
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
