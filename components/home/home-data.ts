import type { LucideIcon } from "lucide-react"
import {
  AlertTriangle,
  Award,
  Ban,
  BellRing,
  Brain,
  Globe,
  GraduationCap,
  HelpCircle,
  Layers,
  Scale,
  School,
  ShieldCheck,
  Sparkles,
  Sprout,
  ThumbsUp,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react"

export type Highlight = {
  title: string
  description: string
  icon: LucideIcon
  accent?: string
  iconWrap?: string
}

export type TutorialVideo = {
  title: string
  description: string
  href: string
  accent: string
  ctaClass: string
}

export type OversightChallenge = {
  title: string
  description: string
  icon: LucideIcon
  border: string
  iconBg: string
}

export type OversightSolution = {
  title: string
  description: string
  subtitle: string
  icon: LucideIcon
  accent: string
}

export type OversightStat = {
  value: string
  label: string
  icon: LucideIcon
}

export type LandingLeaderboardType = "individual" | "team"
export type LandingLeaderboardScope = "national" | "province" | "city"
export type LandingLeaderboardGrade = "all" | "SD" | "SMP" | "SMA"

export const heroStats: Array<{ label: string; value: string; icon: LucideIcon; accent: string }> = [
  { label: "Sekolah bergabung", value: "482", icon: School, accent: "bg-primary/10 text-primary" },
  { label: "Pertandingan minggu ini", value: "1.980", icon: Trophy, accent: "bg-lime-50 text-lime-600 dark:bg-lime-950 dark:text-lime-300" },
  { label: "Kakak mentor siap bantu", value: "76", icon: UserPlus, accent: "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-300" },
]

export const heroPills = ["Duel 1 lawan 1", "Main bareng tim 5 orang", "Belajar tiap minggu bareng mentor", "Papan Juara Nasional"]

export const heroSnapshotCards: Array<{
  label: string
  value: string
  caption: string
  icon: LucideIcon
  accent: string
}> = [
  {
    label: "Pertandingan hari ini",
    value: "127 duel",
    caption: "Sedang berlangsung di 5 provinsi",
    icon: Trophy,
    accent: "bg-primary/10 text-primary",
  },
  {
    label: "Badge dibagikan",
    value: "+2.430",
    caption: "7 hari terakhir",
    icon: Sparkles,
    accent: "bg-lime-50 text-lime-600 dark:bg-lime-950 dark:text-lime-300",
  },
  {
    label: "Kakak Mentor Online",
    value: "76 mentor",
    caption: "Siap bantu belajar hari ini",
    icon: ShieldCheck,
    accent: "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-300",
  },
  {
    label: "Tantangan duel baru",
    value: "342 undangan",
    caption: "Menunggu dijawab",
    icon: Users,
    accent: "bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-300",
  },
]

export const heroVisual = {
  src: "/hero-agrikultur.svg",
  alt: "Sesi bootcamp agrikultur dengan mentor dan siswa",
  badge: "Bootcamp Nusantara",
  location: "Kabupaten Gowa, Sulawesi Selatan",
  summary: "76 mentor memandu 25 sekolah melalui simulasi duel 5v5 dan eksperimen hidroponik.",
}

export const heroHighlights: Highlight[] = [
  {
    title: "Soal sesuai kelasmu",
    description: "Soal pertanian otomatis menyesuaikan tingkat kelasmu — SD, SMP, atau SMA. Makin sering latihan, makin pintar!",
    icon: Sparkles,
    accent: "border-primary/15",
    iconWrap: "bg-primary/10 text-primary",
  },
  {
    title: "Papan Juara Nasional",
    description: "Setiap kali kamu menang, namamu langsung muncul di papan juara seluruh Indonesia. Ayo jadi nomor 1!",
    icon: Trophy,
    accent: "border-sky-100 dark:border-sky-800",
    iconWrap: "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-300",
  },
  {
    title: "Dibimbing Kakak Mentor",
    description: "Kakak-kakak mentor siap membantu belajar setiap minggu lewat sesi online yang santai dan mudah dipahami.",
    icon: ShieldCheck,
    accent: "border-teal-100 dark:border-teal-800",
    iconWrap: "bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-300",
  },
]

export const oversightChallenges: OversightChallenge[] = [
  {
    title: "Pelajaran Pertanian Masih Kurang Menarik",
    description: "Banyak siswa merasa bosan karena belajar pertanian tidak interaktif",
    icon: AlertTriangle,
    border: "border-l-violet-500",
    iconBg: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300",
  },
  {
    title: "Susah Tahu Kemajuan Belajar",
    description: "Tidak ada cara mudah untuk memantau perkembangan belajar pertanian siswa",
    icon: Scale,
    border: "border-l-primary",
    iconBg: "bg-primary/10 text-primary",
  },
  {
    title: "Kurang Teman Belajar Bersama",
    description: "Belajar sendirian itu membosankan dan kurang semangat",
    icon: Users,
    border: "border-l-teal-500",
    iconBg: "bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-300",
  },
  {
    title: "Tidak Ada Penghargaan untuk Usahamu",
    description: "Kerja keras belajar butuh diakui dengan hadiah dan badge prestasi",
    icon: Ban,
    border: "border-l-lime-500",
    iconBg: "bg-lime-50 text-lime-600 dark:bg-lime-950 dark:text-lime-300",
  },
]

export const oversightSolutions: OversightSolution[] = [
  {
    title: "Platform Belajar Online",
    description: "Semua materi pertanian tersedia online, bisa diakses kapan saja dan di mana saja",
    subtitle: "Platform",
    icon: Layers,
    accent: "text-teal-600 bg-teal-50 dark:bg-teal-950 dark:text-teal-300",
  },
  {
    title: "Soal Cerdas Sesuai Kemampuanmu",
    description: "Soal otomatis menyesuaikan kemampuanmu agar selalu pas tantangannya",
    subtitle: "Cerdas",
    icon: Brain,
    accent: "text-sky-600 bg-sky-50 dark:bg-sky-950 dark:text-sky-300",
  },
  {
    title: "Badge & Hadiah Setiap Pencapaian",
    description: "Kumpulkan badge dan hadiah nyata untuk setiap prestasi yang kamu raih",
    subtitle: "Hadiah",
    icon: Award,
    accent: "text-lime-600 bg-lime-50 dark:bg-lime-950 dark:text-lime-300",
  },
  {
    title: "Notifikasi & Pengingat Belajar",
    description: "Pengingat rutin supaya kamu tidak ketinggalan sesi latihan dan turnamen",
    subtitle: "Pengingat",
    icon: BellRing,
    accent: "text-violet-600 bg-violet-50 dark:bg-violet-950 dark:text-violet-300",
  },
]

export const oversightStats: OversightStat[] = [
  { value: "10K+", label: "Pelajar Terdaftar", icon: UserPlus },
  { value: "500+", label: "Soal Berkualitas", icon: HelpCircle },
  { value: "482", label: "Sekolah Bergabung", icon: School },
  { value: "98%", label: "Siswa Suka Belajar", icon: ThumbsUp },
]

export const impactHighlights: Highlight[] = [
  {
    title: "Belajar Sambil Bermain",
    description:
      "Materi pertanian dikemas dalam soal kuis yang interaktif dan mudah dipahami. Cocok untuk semua pelajar SD, SMP, dan SMA.",
    icon: Sprout,
  },
  {
    title: "Kompetisi yang Adil & Sehat",
    description: "Adu kemampuan dengan teman-teman dari seluruh Indonesia secara adil. Menang atau belum, semua tetap belajar bersama!",
    icon: Trophy,
  },
  {
    title: "Materi Sesuai Pelajaran Sekolah",
    description: "Semua soal dibuat oleh ahli pertanian dan sesuai dengan pelajaran di sekolahmu — dari SD sampai SMA.",
    icon: GraduationCap,
  },
  {
    title: "Teman dari Seluruh Indonesia",
    description:
      "Bertemu dan bersaing dengan pelajar dari Sabang sampai Merauke. Cek siapa yang paling pintar di kotamu, provinsimu, dan seluruh Indonesia!",
    icon: Globe,
  },
]

export const supportersList = [
  {
    name: "Mitra Riset Pertanian Nasional (Placeholder)",
    description: "Contoh placeholder mitra riset resmi. Akan diganti setelah kerja sama terverifikasi.",
  },
  {
    name: "Komunitas Guru Agrikultur Indonesia",
    description: "Melatih 220 guru untuk menjadi pembimbing lokal Adu Pintar.",
  },
  {
    name: "Mitra Teknologi Pertanian (Placeholder)",
    description: "Contoh placeholder mitra teknologi. Detail final dipublikasikan saat kerja sama resmi aktif.",
  },
  {
    name: "Hidroponik Nusantara Network",
    description: "Menyuplai perangkat hidroponik portable untuk latihan 5v5.",
  },
  {
    name: "Food Resilience Foundation",
    description: "Memberikan beasiswa paket data bagi sekolah rural agar bisa ikut duel daring.",
  },
  {
    name: "Dinas Pendidikan Jawa Barat",
    description: "Menjadi tuan rumah liga provinsi dan mengintegrasikan leaderboard dalam Jabar Super Apps.",
  },
] satisfies Array<{ name: string; description: string }>

export const tutorialVideos: TutorialVideo[] = [
  {
    title: "Cara Duel 1 lawan 1",
    description: "Pelajari cara menjawab soal dengan cepat dan tepat, kapan harus menekan tombol jawab, dan tips tetap fokus saat duel!",
    href: "/tutorial/duel",
    accent: "bg-primary",
    ctaClass: "text-primary-foreground/70 hover:text-primary-foreground/90",
  },
  {
    title: "Cara Main Tim 5 Orang",
    description: "Belajar kerjasama tim, bagi peran dengan teman, dan cara membaca skor tim secara langsung. Main bareng lebih asyik!",
    href: "/tutorial/tim",
    accent: "bg-teal-600",
    ctaClass: "text-teal-200 hover:text-teal-100",
  },
]

export const LANDING_TYPE_OPTIONS: Array<{
  key: LandingLeaderboardType
  label: string
  description: string
  icon: LucideIcon
  iconWrap: string
}> = [
  {
    key: "individual",
    label: "Pemain",
    description: "Lihat siapa pelajar terhebat beserta kelas dan kota mereka.",
    icon: GraduationCap,
    iconWrap: "bg-primary/15 text-primary",
  },
  {
    key: "team",
    label: "Tim",
    description: "Lihat sekolah dan tim mana yang paling kompak minggu ini.",
    icon: Users,
    iconWrap: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  },
]

export const LANDING_SCOPE_OPTIONS: Array<{
  key: LandingLeaderboardScope
  label: string
  description: string
  icon: LucideIcon
}> = [
  {
    key: "national",
    label: "Seluruh Indonesia",
    description: "Lihat juara terbaik dari seluruh Indonesia.",
    icon: Globe,
  },
  {
    key: "province",
    label: "Provinsi",
    description: "Lihat juara dari provinsimu.",
    icon: School,
  },
  {
    key: "city",
    label: "Kota/Kabupaten",
    description: "Lihat juara dari kotamu.",
    icon: Sprout,
  },
]

export const GRADE_LABELS: Record<LandingLeaderboardGrade, string> = {
  all: "Semua Tingkat",
  SD: "SD",
  SMP: "SMP",
  SMA: "SMA",
}

export const GRADE_ORDER: LandingLeaderboardGrade[] = ["all", "SD", "SMP", "SMA"]

export const TYPE_LABELS: Record<LandingLeaderboardType, string> = {
  individual: "Leaderboard Individual",
  team: "Leaderboard Tim",
}

export const topicList = [
  {
    key: "media-akar",
    title: "Tanah & Akar Tanaman",
    image: "/topics/soil.jpg",
    desc: "Pelajari jenis tanah, cara merawat akar tanaman, dan kenapa tanah yang sehat itu penting buat pertanian.",
  },
  {
    key: "hidroponik",
    title: "Tanam Tanpa Tanah (Hidroponik)",
    image: "/topics/crops.jpg",
    desc: "Belajar cara menanam sayuran pakai air saja tanpa tanah. Bersih dan bisa dicoba di rumah!",
  },
  {
    key: "iklim-mikro",
    title: "Cuaca & Iklim di Kebun",
    image: "/topics/weather.jpg",
    desc: "Kenali bagaimana suhu dan hujan memengaruhi tanaman. Pelajari cara melindungi tanaman dari cuaca buruk.",
  },
  {
    key: "rantai-pasok",
    title: "Perjalanan Sayur ke Meja Makan",
    image: "/topics/agro.jpg",
    desc: "Ikuti perjalanan sayuran dari ladang petani hingga sampai ke piring makanmu. Penuh hal baru!",
  },
  {
    key: "biosekuriti",
    title: "Merawat Hewan Ternak",
    image: "/topics/livestock.jpg",
    desc: "Pelajari cara menjaga ayam, sapi, dan hewan ternak agar sehat dan terhindar dari penyakit.",
  },
  {
    key: "iot-lahan",
    title: "Teknologi Canggih di Ladang",
    image: "/topics/tools.jpg",
    desc: "Kenali sensor pintar dan alat teknologi modern yang dipakai petani masa kini untuk bertani lebih mudah.",
  },
] satisfies Array<{ key: string; title: string; image: string; desc: string }>

export const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "Adu Pintar",
      url: "https://adupintar-dc9p.vercel.app/",
      logo: "https://adupintar-dc9p.vercel.app/adu_pintar_appicon_dark.png",
    },
    {
      "@type": "EducationalOrganization",
      name: "Adu Pintar",
      description: "Platform kompetisi quiz pertanian untuk pelajar Indonesia.",
      educationalUse: "assessment",
      audience: "students",
    },
    {
      "@type": "Game",
      name: "Adu Pintar Duel Pertanian",
      applicationCategory: "EducationalGame",
      operatingSystem: "Web",
    },
  ],
}
