import { type NextRequest, NextResponse } from "next/server"
import type { RequestCookies } from "next/dist/compiled/@edge-runtime/cookies"
import { decodeSessionCookie } from "./session-cookie"
import { isSessionRevoked } from "./session-revocation"

export type SessionUserRole = "student" | "teacher" | "school_admin"

export type SessionUser = {
  id: string
  name: string
  role: SessionUserRole
  sid?: string
  schoolId?: string
  schoolName?: string
  classId?: string
  gradeCategory?: number
}

export function parseSessionCookieValue(rawValue: string | undefined): SessionUser | null {
  const session = decodeSessionCookie<SessionUser>(rawValue)
  if (!session) return null
  if (isSessionRevoked(session.sid)) return null
  return session
}

export function getRequestSessionUser(request: NextRequest): SessionUser | null {
  const studentSession = parseSessionCookieValue(request.cookies.get("student_session")?.value)
  if (studentSession) return studentSession

  const userSession = parseSessionCookieValue(request.cookies.get("user_session")?.value)
  return userSession
}

export function getSessionUserFromCookieStore(cookieStore: Pick<RequestCookies, "get">): SessionUser | null {
  const studentSession = parseSessionCookieValue(cookieStore.get("student_session")?.value)
  if (studentSession) return studentSession

  const userSession = parseSessionCookieValue(cookieStore.get("user_session")?.value)
  return userSession
}

export function canManageSchool(user: SessionUser | null): boolean {
  return Boolean(user && (user.role === "school_admin" || user.role === "teacher"))
}

export function isSchoolAdmin(user: SessionUser | null): boolean {
  return Boolean(user && user.role === "school_admin")
}

export function isAdminOrTeacher(user: SessionUser | null): boolean {
  return Boolean(user && (user.role === "school_admin" || user.role === "teacher"))
}

export function requireAdminSession(request: NextRequest): { user: SessionUser } | { error: NextResponse } {
  const user = getRequestSessionUser(request)
  if (!user) {
    return {
      error: NextResponse.json(
        { error: "Sesi tidak valid. Silakan login ulang." },
        { status: 401 },
      ),
    }
  }
  if (user.role !== "school_admin" && user.role !== "teacher") {
    return {
      error: NextResponse.json(
        { error: "Akses ditolak. Hanya admin sekolah dan guru yang dapat mengakses." },
        { status: 403 },
      ),
    }
  }
  return { user }
}

export function requireSchoolAdminSession(request: NextRequest): { user: SessionUser } | { error: NextResponse } {
  const user = getRequestSessionUser(request)
  if (!user) {
    return {
      error: NextResponse.json(
        { error: "Sesi tidak valid. Silakan login ulang." },
        { status: 401 },
      ),
    }
  }
  if (user.role !== "school_admin") {
    return {
      error: NextResponse.json(
        { error: "Akses ditolak. Hanya admin sekolah yang dapat mengakses." },
        { status: 403 },
      ),
    }
  }
  return { user }
}
