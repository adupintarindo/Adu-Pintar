export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="h-16 animate-pulse rounded-3xl bg-muted/60" />
        <div className="grid gap-4 md:grid-cols-4">
          <div className="h-32 animate-pulse rounded-2xl bg-muted/60" />
          <div className="h-32 animate-pulse rounded-2xl bg-muted/60" />
          <div className="h-32 animate-pulse rounded-2xl bg-muted/60" />
          <div className="h-32 animate-pulse rounded-2xl bg-muted/60" />
        </div>
      </div>
    </main>
  )
}
