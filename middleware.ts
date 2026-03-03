import { NextResponse, type NextRequest } from "next/server"

type SessionRole = "student" | "teacher" | "school_admin"

type SessionPayload = {
  id: string
  role?: SessionRole
}

const protectedPrefixes = ["/dashboard", "/profile", "/activity", "/achievements", "/game", "/school", "/teacher", "/admin", "/api/admin"]

function parseSessionCookie(rawValue: string | undefined): SessionPayload | null {
  if (!rawValue) return null

  try {
    if (rawValue.startsWith("v1.")) {
      const segments = rawValue.split(".")
      const payload = segments[1]
      if (!payload) return null

      const normalized = payload.replace(/-/g, "+").replace(/_/g, "/")
      const padded = `${normalized}${"=".repeat((4 - (normalized.length % 4)) % 4)}`
      const json = decodeURIComponent(
        Array.from(atob(padded))
          .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
          .join(""),
      )
      const parsed = JSON.parse(json) as SessionPayload
      return parsed && typeof parsed.id === "string" ? parsed : null
    }

    const parsed = JSON.parse(rawValue) as SessionPayload
    return parsed && typeof parsed.id === "string" ? parsed : null
  } catch (error) {
    console.error("[middleware] Failed to parse session cookie:", error)
    return null
  }
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url)
  loginUrl.searchParams.set("redirect", request.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isProtected = protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))

  if (!isProtected) {
    return NextResponse.next()
  }

  const studentSession = parseSessionCookie(request.cookies.get("student_session")?.value)
  const userSession = parseSessionCookie(request.cookies.get("user_session")?.value)
  const session = studentSession ?? userSession

  const isApiRoute = pathname.startsWith("/api/")

  if (!session) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Sesi tidak valid. Silakan login ulang." }, { status: 401 })
    }
    return redirectToLogin(request)
  }

  const role = session.role
  if ((pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) && role !== "school_admin") {
    if (isApiRoute) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 })
    }
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }
  if (pathname.startsWith("/school") && role !== "school_admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }
  if (pathname.startsWith("/teacher") && role !== "teacher" && role !== "school_admin") {
    if (isApiRoute) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 })
    }
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/activity/:path*", "/achievements/:path*", "/game/:path*", "/school/:path*", "/teacher/:path*", "/admin/:path*", "/api/admin/:path*"],
}
