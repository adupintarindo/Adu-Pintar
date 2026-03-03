import type React from "react"
import type { Metadata } from "next"
import Script from "next/script"
import "./globals.css"
import { ChatWidget } from "@/components/chat-widget"
import { ConditionalFooter } from "@/components/conditional-footer"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { publicEnv } from "@/lib/env-public"
import { validateCriticalServerEnv } from "@/lib/env-server"
import { ScrollToTopButton } from "@/components/scroll-to-top"
import { SessionProvider } from "@/components/session-provider"
import { ServiceWorkerRegister } from "@/components/service-worker-register"

export const metadata: Metadata = {
  title: "Adu Pintar - Kompetisi Cerdas Cermat Pertanian",
  description: "Adu Pintar: Platform kompetisi quiz pertanian untuk pelajar Indonesia. Duel 1v1, tim 5v5, leaderboard nasional. Gratis!",
  metadataBase: new URL(publicEnv.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  generator: "v0.app",
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: "Adu Pintar",
    title: "Adu Pintar - Kompetisi Cerdas Cermat Pertanian",
    description: "Platform kompetisi quiz pertanian untuk pelajar Indonesia dengan duel 1v1, tim 5v5, dan leaderboard nasional.",
    images: [
      {
        url: "/adu_pintar_appicon_dark.png",
        width: 1200,
        height: 630,
        alt: "Adu Pintar",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Adu Pintar - Kompetisi Cerdas Cermat Pertanian",
    description: "Platform kompetisi quiz pertanian untuk pelajar Indonesia dengan duel 1v1, tim 5v5, dan leaderboard nasional.",
    images: ["/adu_pintar_appicon_dark.png"],
  },
  icons: {
    icon: [
      {
        url: "/adu_pintar_symbol_dark.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/adu_pintar_symbol_white.png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: "/adu_pintar_appicon_dark.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  validateCriticalServerEnv()

  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');`}
            </Script>
          </>
        ) : null}
      </head>
      <body className="font-sans antialiased ifp-body overflow-x-hidden">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {/* #299: Skip to main content for accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-999 focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
          >
            Langsung ke konten utama
          </a>
          <SessionProvider>
            <main id="main-content" className="animate-fade-in">
              {children}
            </main>
            <ConditionalFooter />
            <ChatWidget />
            <Toaster position="top-right" richColors />
            <ScrollToTopButton />
            <ServiceWorkerRegister />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
