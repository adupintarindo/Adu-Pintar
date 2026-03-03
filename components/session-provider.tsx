"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { fetchWithCsrf } from "@/lib/client-security"

export type SessionUser = {
  id: string
  name: string
  email?: string
  role?: "student" | "teacher" | "school_admin"
  grade?: string
  schoolName?: string
}

type SessionState = {
  user: SessionUser | null
  loading: boolean
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const SessionContext = createContext<SessionState>({
  user: null,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
})

export function useSession() {
  return useContext(SessionContext)
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" })
      if (!res.ok) throw new Error("session fetch failed")
      const data = await res.json()
      setUser(data.authenticated ? data.user : null)
    } catch (error) {
      console.error("[session-provider] Session fetch failed:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetchWithCsrf("/api/auth/logout", { method: "POST" })
    } catch (error) {
      console.error("[session-provider] Logout failed (best effort):", error)
    }
    setUser(null)
  }, [])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  const value = useMemo(
    () => ({ user, loading, refresh: fetchSession, logout }),
    [user, loading, fetchSession, logout],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
