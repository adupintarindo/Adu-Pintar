// #150 — CSV export utility

function escapeCSVField(field: unknown): string {
  const str = String(field ?? "")
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function toCSV<T extends Record<string, unknown>>(
  rows: T[],
  columns: Array<{ key: keyof T; label: string }>,
): string {
  const header = columns.map((col) => escapeCSVField(col.label)).join(",")
  const body = rows.map((row) =>
    columns.map((col) => escapeCSVField(row[col.key])).join(","),
  )
  return [header, ...body].join("\n")
}

export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
