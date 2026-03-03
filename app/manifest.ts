import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Adu Pintar",
    short_name: "Adu Pintar",
    description: "Platform kompetisi quiz pertanian untuk pelajar Indonesia",
    start_url: "/",
    display: "standalone",
    background_color: "#f8faf8",
    theme_color: "#4f9f4a",
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
