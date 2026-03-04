export default function DashboardLoading() {
  const weeklyBars = [36, 58, 72, 45, 66, 52, 80]

  return (
    <main className="relative min-h-screen overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
      <section className="relative z-10 mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        {/* Welcome header skeleton */}
        <div className="glass-card rounded-3xl p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-5">
              <div className="h-16 w-16 shrink-0 rounded-2xl bg-muted skeleton-shimmer" />
              <div className="space-y-3">
                <div className="h-4 w-32 rounded-full bg-muted skeleton-shimmer" />
                <div className="h-8 w-56 rounded-full bg-muted skeleton-shimmer" />
                <div className="h-4 w-72 rounded-full bg-muted skeleton-shimmer" />
              </div>
            </div>
            <div className="h-20 w-56 shrink-0 rounded-2xl bg-muted skeleton-shimmer" />
          </div>
        </div>

        {/* Stats grid skeleton */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-5">
              <div className="h-12 w-12 rounded-xl bg-muted skeleton-shimmer" />
              <div className="mt-4 h-3 w-24 rounded-full bg-muted skeleton-shimmer" />
              <div className="mt-2 h-7 w-16 rounded-full bg-muted skeleton-shimmer" />
              <div className="mt-2 h-3 w-20 rounded-full bg-muted skeleton-shimmer" />
            </div>
          ))}
        </div>

        {/* Level progress + Weekly EXP skeleton */}
        <div className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
          {/* Level progress skeleton */}
          <div className="glass-card rounded-3xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="h-4 w-28 rounded-full bg-muted skeleton-shimmer" />
                <div className="h-10 w-20 rounded-full bg-muted skeleton-shimmer" />
                <div className="h-4 w-40 rounded-full bg-muted skeleton-shimmer" />
              </div>
              <div className="h-14 w-14 rounded-2xl bg-muted skeleton-shimmer" />
            </div>
            <div className="mt-6 space-y-3">
              <div className="flex justify-between">
                <div className="h-3 w-16 rounded-full bg-muted skeleton-shimmer" />
                <div className="h-3 w-16 rounded-full bg-muted skeleton-shimmer" />
              </div>
              <div className="h-5 w-full rounded-full bg-muted skeleton-shimmer" />
              <div className="flex justify-between">
                <div className="h-3 w-36 rounded-full bg-muted skeleton-shimmer" />
                <div className="h-3 w-24 rounded-full bg-muted skeleton-shimmer" />
              </div>
            </div>
          </div>

          {/* Weekly EXP skeleton */}
          <div className="glass-card rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-36 rounded-full bg-muted skeleton-shimmer" />
                <div className="h-3 w-48 rounded-full bg-muted skeleton-shimmer" />
              </div>
              <div className="h-10 w-10 rounded-xl bg-muted skeleton-shimmer" />
            </div>
            <div className="mt-6 flex h-40 items-end gap-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-5 rounded-full bg-muted skeleton-shimmer"
                    style={{ height: `${weeklyBars[i % weeklyBars.length]}%` }}
                  />
                  <div className="h-3 w-6 rounded-full bg-muted skeleton-shimmer" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Missions + Badges skeleton */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Missions skeleton */}
          <div className="glass-card rounded-3xl p-6">
            <div className="space-y-2">
              <div className="h-4 w-32 rounded-full bg-muted skeleton-shimmer" />
              <div className="h-7 w-48 rounded-full bg-muted skeleton-shimmer" />
            </div>
            <div className="mt-6 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 rounded-2xl border border-border/30 px-4 py-3">
                  <div className="h-4 w-48 flex-1 rounded-full bg-muted skeleton-shimmer" />
                  <div className="h-6 w-16 shrink-0 rounded-full bg-muted skeleton-shimmer" />
                </div>
              ))}
            </div>
          </div>

          {/* Badges skeleton */}
          <div className="glass-card rounded-3xl p-6">
            <div className="space-y-2">
              <div className="h-4 w-40 rounded-full bg-muted skeleton-shimmer" />
              <div className="h-7 w-52 rounded-full bg-muted skeleton-shimmer" />
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-24 rounded-full bg-muted skeleton-shimmer" />
                    <div className="h-5 w-12 rounded-full bg-muted skeleton-shimmer" />
                  </div>
                  <div className="h-3 w-36 rounded-full bg-muted skeleton-shimmer" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
