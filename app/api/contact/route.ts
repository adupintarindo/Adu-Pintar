import { NextResponse, type NextRequest } from "next/server"
import { serverEnv } from "@/lib/env-server"
import { parseAndValidateBody, rejectIfCrossOrigin, rejectIfInvalidCsrf, rejectIfRateLimited } from "@/lib/api-security"
import { z } from "zod"

const allowedCategories = ["umum", "kemitraan", "sponsor", "sekolah"] as const

type ContactCategory = (typeof allowedCategories)[number]

const contactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(254),
  message: z.string().min(10).max(2000),
  category: z.enum(allowedCategories),
})

function categoryLabel(category: ContactCategory): string {
  return {
    umum: "Umum",
    kemitraan: "Kemitraan",
    sponsor: "Sponsor",
    sekolah: "Sekolah",
  }[category]
}

export async function POST(request: NextRequest) {
  const originError = rejectIfCrossOrigin(request)
  if (originError) return originError
  const csrfError = rejectIfInvalidCsrf(request)
  if (csrfError) return csrfError
  const rateLimitError = rejectIfRateLimited(request, {
    keyPrefix: "contact-form",
    max: 10,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) return rateLimitError

  try {
    const body = await request.json()
    const parsed = parseAndValidateBody(body, contactSchema)
    if (!parsed.data || parsed.errorResponse) {
      return parsed.errorResponse!
    }
    const name = parsed.data.name
    const email = parsed.data.email
    const message = parsed.data.message
    const category = parsed.data.category

    const resendKey = serverEnv.RESEND_API_KEY
    const toEmail = process.env.CONTACT_INBOX_EMAIL || "adupintar.id@gmail.com"
    const fromEmail = process.env.RESEND_FROM_EMAIL || "Adu Pintar <onboarding@resend.dev>"

    const html = `
      <h2>Pesan Baru Form Contact Adu Pintar</h2>
      <p><strong>Nama:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Kategori:</strong> ${escapeHtml(categoryLabel(category))}</p>
      <p><strong>Pesan:</strong></p>
      <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
    `

    if (!resendKey) {
      console.log("[contact] RESEND_API_KEY tidak dikonfigurasi, pesan disimpan sebagai fallback log", {
        name,
        email,
        category,
        message,
        receivedAt: new Date().toISOString(),
      })

      return NextResponse.json({
        ok: true,
        delivery: "log_only",
        message: "Pesan diterima. Mode email belum aktif, tetapi pesan tercatat di server log.",
      })
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: email,
        subject: `[Adu Pintar] Contact - ${categoryLabel(category)} - ${name}`,
        html,
        text: `Nama: ${name}\nEmail: ${email}\nKategori: ${categoryLabel(category)}\n\n${message}`,
      }),
    })

    if (!resendResponse.ok) {
      const errorBody = await resendResponse.text()
      console.error("[contact] resend error", resendResponse.status, errorBody)
      return NextResponse.json(
        { error: "Gagal mengirim email. Silakan coba lagi beberapa saat lagi." },
        { status: 502 },
      )
    }

    return NextResponse.json({
      ok: true,
      delivery: "resend",
      message: "Pesan berhasil dikirim. Tim Adu Pintar akan menghubungi Anda.",
    })
  } catch (error) {
    console.error("[api/contact] Internal error:", error)
    return NextResponse.json({ error: "Gagal memproses pesan" }, { status: 500 })
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
