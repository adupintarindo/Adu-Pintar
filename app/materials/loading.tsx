export default function MaterialsLoading() {
  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="h-10 w-56 animate-pulse rounded-xl bg-muted/60" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-52 animate-pulse rounded-2xl bg-muted/60" />
          <div className="h-52 animate-pulse rounded-2xl bg-muted/60" />
          <div className="h-52 animate-pulse rounded-2xl bg-muted/60" />
        </div>
      </div>
    </main>
  )
}
