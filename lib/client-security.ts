"use client"

import { CSRF_HEADER_NAME } from "./api-security"

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const encoded = `${encodeURIComponent(name)}=`
  const chunks = document.cookie.split(";")
  for (const chunk of chunks) {
    const value = chunk.trim()
    if (value.startsWith(encoded)) {
      return decodeURIComponent(value.slice(encoded.length))
    }
  }
  return null
}

export async function ensureCsrfToken() {
  let token = readCookie("csrf_token")
  if (token) return token

  const response = await fetch("/api/auth/csrf", { credentials: "include" })
  if (!response.ok) {
    throw new Error("Gagal menyiapkan keamanan permintaan")
  }

  token = response.headers.get(CSRF_HEADER_NAME) ?? readCookie("csrf_token")
  if (!token) {
    throw new Error("Token CSRF tidak tersedia")
  }
  return token
}

export async function fetchWithCsrf(input: RequestInfo | URL, init: RequestInit = {}) {
  const method = (init.method ?? "GET").toUpperCase()
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return fetch(input, init)
  }

  const token = await ensureCsrfToken()
  const headers = new Headers(init.headers)
  headers.set(CSRF_HEADER_NAME, token)

  return fetch(input, {
    ...init,
    credentials: "include",
    headers,
  })
}
