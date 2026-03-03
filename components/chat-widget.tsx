"use client"

import { useState } from "react"
import { MessageCircle, Send, X, CheckCircle2 } from "lucide-react"

type FormState = "idle" | "sending" | "sent"

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState("")
  const [message, setMessage] = useState("")
  const [formState, setFormState] = useState<FormState>("idle")
  const [shaking, setShaking] = useState(false)

  const canSubmit = name.trim().length > 0 && message.trim().length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formState === "sending") return
    if (!canSubmit) {
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
      return
    }

    setFormState("sending")

    // Kirim ke WhatsApp dengan pesan terformat
    const whatsappText = encodeURIComponent(
      `Halo Adu Pintar!\n\nNama: ${name.trim()}\nPesan: ${message.trim()}`
    )
    window.open(`https://wa.me/6281395098825?text=${whatsappText}`, "_blank")

    setFormState("sent")
    setName("")
    setMessage("")
  }

  const handleReset = () => {
    setFormState("idle")
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div
          id="chat-widget-panel"
          className="mb-4 w-[320px] sm:w-[360px] rounded-2xl bg-card shadow-2xl border border-border flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          <div
            style={{ background: "var(--color-brand-dark, #0D3E2D)" }}
            className="text-white px-4 py-4 flex items-center justify-between"
          >
            <div>
              <p className="font-bold text-base">Hubungi Kami</p>
              <p className="text-xs text-white/70 mt-0.5">Pesan diteruskan via WhatsApp</p>
            </div>
            <button
              type="button"
              aria-label="Tutup form"
              onClick={() => setIsOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/20 transition active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4">
            {formState === "sent" ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center animate-bounce-in">
                <div className="relative">
                  <CheckCircle2 className="h-12 w-12 text-primary animate-bounce-in" />
                  <span className="absolute -top-1 -right-1 text-lg animate-bounce-in" style={{ animationDelay: "200ms" }}>&#10024;</span>
                </div>
                <p className="font-semibold text-foreground">Pesan dikirim! &#10003;</p>
                <p className="text-sm text-muted-foreground">
                  WhatsApp akan terbuka otomatis. Tim kami akan segera membalas.
                </p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary transition active:scale-95"
                >
                  Kirim pesan lain
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={`flex flex-col gap-3 ${shaking ? "animate-wrong-shake" : ""}`}>
                <div>
                  <label htmlFor="contact-name" className="block text-xs font-semibold text-muted-foreground mb-1">
                    Nama kamu
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="block text-xs font-semibold text-muted-foreground mb-1">
                    Pesan / pertanyaan
                  </label>
                  <textarea
                    id="contact-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    placeholder="Tulis pertanyaan atau pesanmu di sini..."
                    className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={!canSubmit || formState === "sending"}
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow hover:opacity-90 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                  {formState === "sending" ? "Mengirim..." : "Kirim via WhatsApp"}
                </button>
                <p className="text-center text-[11px] text-muted-foreground">
                  Respons biasanya dalam 1–2 jam kerja
                </p>
              </form>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="rounded-full bg-primary text-primary-foreground shadow-xl px-5 py-3.5 min-h-11 flex items-center gap-2 hover:opacity-90 hover:scale-105 active:scale-95 transition font-bold text-sm"
        aria-expanded={isOpen}
        aria-controls="chat-widget-panel"
        aria-label={isOpen ? "Tutup panel kontak" : "Buka panel kontak"}
      >
        <MessageCircle className="h-5 w-5" />
        {isOpen ? "Tutup" : "Hubungi Kami"}
      </button>
    </div>
  )
}
