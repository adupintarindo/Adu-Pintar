export default function LeaderboardLoading() {
  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="h-12 w-72 animate-pulse rounded-xl bg-muted/60" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-36 animate-pulse rounded-2xl bg-muted/60" />
          <div className="h-36 animate-pulse rounded-2xl bg-muted/60" />
          <div className="h-36 animate-pulse rounded-2xl bg-muted/60" />
        </div>
        <div className="h-96 animate-pulse rounded-3xl bg-muted/60" />
      </div>
    </main>
  )
}
