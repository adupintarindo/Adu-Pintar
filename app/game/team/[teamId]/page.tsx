"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import { Navbar } from "@/components/navbar"

export default function TeamDetailsPage() {
  const params = useParams()
  const teamId = params.teamId as string
  const [selectedGrade, setSelectedGrade] = useState<"SD" | "SMP" | "SMA">("SMP")

  return (
    <main className="relative min-h-screen overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

      <Navbar />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Team Header Card */}
        <div className="glass-card card-accent-top rounded-3xl p-6 mb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Tim Petani Jago</h1>
          <p className="mt-1 text-muted-foreground">5 anggota | 1250 Total Poin</p>

          {/* Stats Grid */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card rounded-2xl p-3 text-center">
              <div className="font-display text-2xl font-bold text-primary">5</div>
              <div className="text-xs text-muted-foreground">Anggota</div>
            </div>
            <div className="glass-card rounded-2xl p-3 text-center">
              <div className="font-display text-2xl font-bold text-primary">8</div>
              <div className="text-xs text-muted-foreground">Menang</div>
            </div>
            <div className="glass-card rounded-2xl p-3 text-center">
              <div className="font-display text-2xl font-bold text-primary">2</div>
              <div className="text-xs text-muted-foreground">Belum Menang</div>
            </div>
            <div className="glass-card rounded-2xl p-3 text-center">
              <div className="font-display text-2xl font-bold text-primary">1250</div>
              <div className="text-xs text-muted-foreground">Poin</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Members List */}
          <div className="md:col-span-2">
            <div className="glass-card rounded-3xl p-6">
              <h2 className="font-display text-xl font-bold tracking-tight text-foreground mb-4">Anggota Tim</h2>
              <div className="space-y-3">
                {["Budi Santoso", "Siti Nurhaliza", "Ahmad Zainal", "Rina Wijaya", "Doni Hermawan"].map(
                  (name, idx) => (
                    <div
                      key={idx}
                      className="glass-card rounded-2xl flex justify-between items-center p-3 transition hover:border-primary/30"
                    >
                      <div className="flex items-center gap-3">
                        <span className="icon-badge rounded-xl bg-primary/10 text-primary">
                          {name.charAt(0)}
                        </span>
                        <div>
                          <div className="font-semibold text-foreground">{name}</div>
                          <div className="text-xs text-muted-foreground">{idx === 0 ? "Ketua Tim" : "Anggota"}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-primary">{(idx + 1) * 250}</div>
                        <div className="text-xs text-muted-foreground">poin</div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>

          {/* Start Match Card */}
          <div className="md:col-span-1">
            <div className="glass-card rounded-3xl p-6">
              <h2 className="font-display text-xl font-bold tracking-tight text-foreground mb-4">Mulai Pertandingan</h2>
              <div className="space-y-3">
                {(["SD", "SMP", "SMA"] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setSelectedGrade(g)}
                    className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      selectedGrade === g
                        ? "bg-primary text-primary-foreground"
                        : "rounded-xl border border-border/50 text-foreground hover:border-primary/30"
                    }`}
                    style={selectedGrade === g ? { boxShadow: "var(--shadow-glow-primary)" } : undefined}
                  >
                    {g === "SD" ? "SD" : g === "SMP" ? "SMP" : "SMA"}
                  </button>
                ))}

                <button
                  className="w-full rounded-xl bg-linear-to-r from-primary to-primary/90 px-4 py-3 font-display font-bold text-primary-foreground transition"
                  style={{ boxShadow: "var(--shadow-glow-primary)" }}
                >
                  Cari Lawan
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
