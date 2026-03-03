import { NextResponse } from "next/server"
import { issueCsrfToken } from "@/lib/api-security"

export async function GET() {
  const response = NextResponse.json({ ok: true })
  issueCsrfToken(response)
  return response
}
