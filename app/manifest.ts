import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Adu Pintar",
    short_name: "Adu Pintar",
    description: "Platform duel pertanian untuk siswa SD, SMP, dan SMA.",
    start_url: "/",
    display: "standalone",
    background_color: "#0D3E2D",
    theme_color: "#6CA644",
    lang: "id",
    icons: [
      {
        src: "/adu_pintar_appicon_dark.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/adu_pintar_symbol_dark.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  }
}
