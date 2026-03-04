"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"

interface ErrorBoundaryProps {
  children: ReactNode
  /** Optional custom fallback UI. When omitted the default Indonesian error card is shown. */
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * React error boundary with a user-friendly fallback in Bahasa Indonesia.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[ErrorBoundary] Uncaught error:", error, errorInfo)
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children
    }

    if (this.props.fallback) {
      return this.props.fallback
    }

    return (
      <div className="flex min-h-[320px] items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
          {/* Friendly emoji */}
          <span className="mb-2 inline-block text-5xl">🔧</span>

          {/* Heading */}
          <h2 className="mb-2 text-xl font-semibold text-foreground">
            Oops! Ada yang perlu diperbaiki
          </h2>

          {/* Description */}
          <p className="mb-4 text-sm text-muted-foreground">
            Bagian ini sedang bermasalah, tapi tenang ya! Coba langkah-langkah ini:
          </p>

          {/* Recovery steps */}
          <ol className="mb-6 list-inside list-decimal space-y-1 text-left text-sm text-muted-foreground">
            <li>Tekan tombol <strong>&quot;Coba Lagi&quot;</strong> di bawah</li>
            <li>Kalau masih error, coba muat ulang halaman</li>
            <li>Periksa koneksi internet kamu</li>
          </ol>

          {/* Error detail (dev only) */}
          {process.env.NODE_ENV === "development" && this.state.error && (
            <pre className="mb-6 max-h-32 overflow-auto rounded-lg bg-muted p-3 text-left text-xs text-muted-foreground">
              {this.state.error.message}
            </pre>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={this.handleRetry}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 active:scale-95"
            >
              Coba Lagi
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/50 active:scale-95"
            >
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      </div>
    )
  }
}
