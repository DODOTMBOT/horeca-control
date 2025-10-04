import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Check for platform owner routes
    if (pathname.startsWith("/owner")) {
      if (!token?.isPlatformOwner) {
        return NextResponse.redirect(new URL("/", req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Public routes that don't require authentication
        const publicRoutes = ["/", "/pricing", "/signin", "/signup", "/api/auth"]
        if (publicRoutes.some(route => pathname.startsWith(route))) {
          return true
        }

        // Static files and Next.js internals
        if (pathname.startsWith("/_next") || pathname.startsWith("/favicon.ico")) {
          return true
        }

        // Protected routes that require authentication
        const protectedRoutes = ["/dashboard", "/billing", "/org", "/api/secure", "/labeling", "/files", "/learning"]
        if (protectedRoutes.some(route => pathname.startsWith(route))) {
          return !!token
        }

        // Owner routes require platform owner
        if (pathname.startsWith("/owner")) {
          return !!token?.isPlatformOwner
        }

        return true
      },
    },
  }
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/billing/:path*", 
    "/org/:path*",
    "/owner/:path*",
    "/api/secure/:path*",
    "/labeling/:path*",
    "/files/:path*",
    "/learning/:path*",
    "/signin",
    "/signup"
  ]
}
