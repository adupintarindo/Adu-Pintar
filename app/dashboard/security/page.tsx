'use client'

import Link from "next/link"
import { ChangeEvent, FormEvent, useState } from "react"
import { Eye, EyeOff, Info, ShieldCheck } from "lucide-react"

import { Navbar } from "@/components/navbar"

const accountTabs = [
  { label: "Profil", href: "/dashboard#profile" },
  { label: "Keamanan", href: "/dashboard/security" },
]

const defaultFormState = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
}

type FormKey = keyof typeof defaultFormState

const defaultVisibilityState: Record<FormKey, boolean> = {
  currentPassword: false,
  newPassword: false,
  confirmPassword: false,
}

const passwordFields: Array<{
  formKey: FormKey
  label: string
  placeholder: string
  description?: string
}> = [
  {
    formKey: "currentPassword",
    label: "Kata Sandi Saat Ini",
    placeholder: "Masukkan kata sandi saat ini",
  },
  {
    formKey: "newPassword",
    label: "Kata Sandi Baru",
    placeholder: "Minimal 8 karakter",
    description: "Gunakan kombinasi huruf kapital, angka, dan simbol untuk keamanan terbaik.",
  },
  {
    formKey: "confirmPassword",
    label: "Konfirmasi Kata Sandi Baru",
    placeholder: "Ulangi kata sandi baru",
  },
]

const securityTips = [
  "Jangan gunakan kata sandi yang sama di beberapa layanan.",
  "Hindari menggunakan informasi pribadi di dalam kata sandi.",
  "Perbarui kata sandi Anda secara berkala.",
  "Jangan bagikan kata sandi dengan siapa pun.",
  "Keluar dari akun saat memakai perangkat bersama.",
]

export default function SecuritySettingsPage() {
  const [formValues, setFormValues] = useState(() => ({ ...defaultFormState }))
  const [visibility, setVisibility] = useState(() => ({ ...defaultVisibilityState }))
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const handleChange = (key: FormKey) => (event: ChangeEvent<HTMLInputElement>) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: event.target.value,
    }))
  }

  const handleToggleVisibility = (key: FormKey) => () => {
    setVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleReset = () => {
    setFormValues({ ...defaultFormState })
    setVisibility({ ...defaultVisibilityState })
    setStatus(null)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formValues.currentPassword || !formValues.newPassword || !formValues.confirmPassword) {
      setStatus({ type: "error", message: "Semua kolom wajib diisi." })
      return
    }

    if (formValues.newPassword.length < 8) {
      setStatus({ type: "error", message: "Kata sandi baru minimal berisi 8 karakter." })
      return
    }

    if (formValues.newPassword !== formValues.confirmPassword) {
      setStatus({ type: "error", message: "Konfirmasi kata sandi belum cocok." })
      return
    }

    setStatus({ type: "success", message: "Kata sandi berhasil diperbarui." })
    setFormValues({ ...defaultFormState })
    setVisibility({ ...defaultVisibilityState })
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="flex-1 bg-linear-to-b from-primary/10 via-background to-background">
        <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
          <header className="space-y-4">
            <div className="inline-flex items-center gap-3 rounded-full border border-border bg-card px-5 py-2 text-sm font-semibold text-primary shadow-sm">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Keamanan Akun
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Keamanan</h1>
              <p className="mt-2 text-base text-muted-foreground">
                Kelola kata sandi dan pengaturan keamanan akun Anda dari satu tempat setelah berhasil masuk.
              </p>
            </div>
          </header>

          <nav className="flex flex-wrap gap-3 rounded-3xl border border-border/50 bg-card/80 p-2 shadow-lg">
            {accountTabs.map((tab) => {
              const isActive = tab.href === "/dashboard/security"
              return (
                <Link
                  key={tab.label}
                  href={tab.href}
                  className={`rounded-2xl px-5 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-foreground text-background shadow"
                      : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </Link>
              )
            })}
          </nav>

          <section className="rounded-3xl border border-border/50 bg-card/90 p-6 shadow-xl backdrop-blur sm:p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {status && (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
                    status.type === "success"
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-destructive/30 bg-destructive/10 text-destructive"
                  }`}
                >
                  {status.message}
                </div>
              )}

              {passwordFields.map((field) => (
                <div key={field.formKey} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor={field.formKey} className="text-sm font-semibold text-foreground">
                      {field.label}
                    </label>
                    {field.description && (
                      <span className="text-xs text-muted-foreground">{field.description}</span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id={field.formKey}
                      type={visibility[field.formKey] ? "text" : "password"}
                      placeholder={field.placeholder}
                      value={formValues[field.formKey]}
                      onChange={handleChange(field.formKey)}
                      className="w-full rounded-2xl border border-border/50 bg-background px-4 py-3 text-sm text-foreground transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={handleToggleVisibility(field.formKey)}
                      className="absolute inset-y-0 right-3 flex items-center text-muted-foreground transition hover:text-foreground"
                      aria-label={`Tampilkan ${field.label}`}
                    >
                      {visibility[field.formKey] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90"
                >
                  Simpan Kata Sandi
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center justify-center rounded-2xl border border-border/50 px-6 py-3 text-sm font-semibold text-muted-foreground transition hover:border-border hover:text-foreground"
                >
                  Reset
                </button>
              </div>
            </form>

            <div className="mt-8 rounded-2xl border border-border/50 bg-primary/5 p-5">
              <div className="flex items-center gap-2 text-primary">
                <Info className="h-4 w-4" />
                <p className="text-sm font-semibold">Tips Keamanan</p>
              </div>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-foreground">
                {securityTips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
