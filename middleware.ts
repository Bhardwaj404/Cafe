import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"

export default auth((req: NextRequest & { auth: { user?: { role?: string } } | null }) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Admin routes — STAFF only
  if (pathname.startsWith("/admin")) {
    if (!session?.user) {
      return NextResponse.redirect(new URL("/login?callbackUrl=/admin", req.url))
    }
    if (session.user.role !== "STAFF") {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  // Protected student routes
  const studentProtected = ["/checkout", "/orders", "/order"]
  if (studentProtected.some((p) => pathname.startsWith(p))) {
    if (!session?.user) {
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, req.url)
      )
    }
  }

  // Redirect logged-in users away from auth pages
  if (pathname === "/login" || pathname === "/signup") {
    if (session?.user) {
      if (session.user.role === "STAFF") {
        return NextResponse.redirect(new URL("/admin", req.url))
      }
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/admin/:path*",
    "/checkout/:path*",
    "/orders/:path*",
    "/order/:path*",
    "/login",
    "/signup",
  ],
}
