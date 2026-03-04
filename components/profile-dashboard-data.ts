import type { LucideIcon } from "lucide-react"
import {
  BookOpen,
  Compass,
  Crown,
  Edit3,
  Flame,
  Gem,
  Globe2,
  Leaf,
  Medal,
  MessageSquare,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Users,
} from "lucide-react"

export const badges: Array<{
  title: string
  desc: string
  detail: string
  icon: LucideIcon
  gradient: string
  chip: string
  iconBg: string
  category: string
}> = [
  {
    title: "Penjelajah Lingkungan",
    desc: "Jawab benar 30 soal lingkungan",
    detail: "Kerjakan kuis Lingkungan minimal tiga sesi per pekan dan jaga jawaban benar di atas 85% agar badge tetap aktif.",
    icon: Globe2,
    gradient: "from-primary/10 via-white to-accent/10 dark:via-background dark:to-accent/10",
    chip: "bg-primary/15 text-primary",
    iconBg: "bg-primary/10 text-primary",
    category: "Eksplorasi",
  },
  {
    title: "Ahli Media Tanam",
    desc: "Rampungkan modul tanah",
    detail: "Tuntaskan seluruh materi Media Tanam dan unggah minimal satu catatan percobaan untuk dicek kakak mentor.",
    icon: BookOpen,
    gradient: "from-lime-50 via-white to-green-50 dark:from-lime-950/30 dark:via-background dark:to-green-950/30",
    chip: "bg-lime-100 text-lime-700 dark:bg-lime-950 dark:text-lime-300",
    iconBg: "bg-lime-50 text-lime-600 dark:bg-lime-950 dark:text-lime-300",
    category: "Modul",
  },
  {
    title: "Pahlawan Ternak",
    desc: "Menang 5 duel peternakan",
    detail: "Menangkan 5 duel peternakan dan ikut diskusi mingguan agar badge terus bersinar.",
    icon: ShieldCheck,
    gradient: "from-violet-50 via-white to-teal-50 dark:from-violet-950/30 dark:via-background dark:to-teal-950/30",
    chip: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
    iconBg: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300",
    category: "Kompetisi",
  },
  {
    title: "Pengamat Cuaca",
    desc: "Login 7 hari",
    detail: "Login tujuh hari berturut-turut, aktifkan pengingat prakiraan, dan bagikan minimal satu catatan pengamatan harian.",
    icon: Star,
    gradient: "from-sky-50 via-white to-teal-50 dark:from-sky-950/30 dark:via-background dark:to-teal-950/30",
    chip: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
    iconBg: "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-300",
    category: "Rutinitas",
  },
]

export const activityFeed = [
  { title: "Menang duel modul Tanah", desc: "+80 EXP", time: "2 jam lalu", icon: Flame, accent: "text-violet-500" },
  { title: "Selesaikan materi Media Tanam", desc: "+120 EXP", time: "Kemarin", icon: Edit3, accent: "text-lime-600" },
  { title: "Gabung diskusi iklim mikro", desc: "14 komentar", time: "2 hari lalu", icon: MessageSquare, accent: "text-primary" },
  { title: "Verifikasi lokasi sekolah", desc: "Bandung, Jawa Barat", time: "4 hari lalu", icon: Globe2, accent: "text-sky-500" },
]

export const matchHistory = [
  { id: 1, mode: "Duel Modul Tanah", opponent: "Bima Rahman", result: "Menang", score: "320 - 280", time: "3 hari lalu" },
  { id: 2, mode: "Pertandingan Tim Hidroponik", opponent: "Tim Hydro Grow", result: "Menang", score: "540 - 480", time: "5 hari lalu" },
  { id: 3, mode: "Pertandingan Peringkat Nutrisi", opponent: "Salsabila P.", result: "Coba Lagi", score: "260 - 300", time: "1 minggu lalu" },
]

export const activityTabs: Array<{
  value: "feed" | "history"
  label: string
  strapline: string
  title: string
}> = [
  {
    value: "feed",
    label: "Aktivitas",
    strapline: "Aktivitas Terbaru",
    title: "Laporan kemajuan",
  },
  {
    value: "history",
    label: "Riwayat Pertandingan",
    strapline: "Riwayat Pertandingan",
    title: "Riwayat pertandingan",
  },
]

export const focusTopics = ["Kimia Tanah", "Iklim Mikro", "Hidroponik", "Pengelolaan Air", "Keberlanjutan"]

export const profileSummaryStats = [
  { label: "Level Saat Ini", value: "18 Mentor", detail: "+120 EXP menuju level 19" },
  { label: "Ranking Jawa Barat", value: "#07", detail: "Naik 2 posisi pekan ini" },
  { label: "Streak Belajar", value: "12 hari", detail: "Target 21 hari tanpa putus" },
]

export const heroStats = [
  { label: "Sekolah Aktif", value: "482" },
  { label: "Pertandingan Minggu Ini", value: "1.980" },
  { label: "Mentor Relawan", value: "76" },
]

export const heroHighlights = [
  { title: "Kuis pintar sesuai level", desc: "Soal latihan otomatis menyesuaikan modul dan levelmu.", icon: Sparkles },
  { title: "Papan juara langsung", desc: "Setiap duel tercatat dan langsung memengaruhi papan nasional.", icon: Trophy },
  { title: "Pendampingan daring", desc: "Kakak mentor siap memantau progresmu setiap pekan.", icon: ShieldCheck },
]

export const testimonials = [
  {
    id: 1,
    menu: "Nasi Goreng",
    reviewer: "A** W.",
    time: "2 jam lalu",
    program: "SPPG Dharma Nusa",
    message: "Masakan segar, porsi pas, dan bumbu terasa. Sangat memuaskan!",
    rating: 5,
  },
  {
    id: 2,
    menu: "Soto Ayam",
    reviewer: "S** N.",
    time: "3 jam lalu",
    program: "SPPG Gemilang Sehat",
    message: "Kuah gurih, daging empuk. Hanya kurang sayuran saja.",
    rating: 4,
  },
  {
    id: 3,
    menu: "Mie Ayam",
    reviewer: "B** S.",
    time: "5 jam lalu",
    program: "SPPG Tembalang Asri",
    message: "Mie kenyal, topping banyak, rasa otentik. Wajib coba!",
    rating: 5,
  },
  {
    id: 4,
    menu: "Gado-gado",
    reviewer: "D** K.",
    time: "1 hari lalu",
    program: "SPPG Mentari Bangsa",
    message: "Sayuran fresh, bumbu kacang pas. Protein kurang beragam.",
    rating: 4,
  },
  {
    id: 5,
    menu: "Es Cendol",
    reviewer: "R** T.",
    time: "1 hari lalu",
    program: "SPPG Bhakti Mandiri",
    message: "Manisnya seimbang, santan segar, cocok untuk cuaca panas.",
    rating: 5,
  },
  {
    id: 6,
    menu: "Rendang",
    reviewer: "M** F.",
    time: "2 hari lalu",
    program: "SPPG Nusantara Harum",
    message: "Bumbu meresap sempurna dan tekstur daging empuk.",
    rating: 5,
  },
  {
    id: 7,
    menu: "Ayam Bakar Madu",
    reviewer: "L** P.",
    time: "2 hari lalu",
    program: "SPPG Cahaya Timur",
    message: "Perpaduan madu dan rempah menarik, tapi perlu lebih smoky.",
    rating: 4,
  },
  {
    id: 8,
    menu: "Sate Lilit",
    reviewer: "J** H.",
    time: "3 hari lalu",
    program: "SPPG Cita Mandala",
    message: "Aroma serai kuat, konsistensi halus, cocok untuk kelas demo.",
    rating: 5,
  },
]

export const journeySteps = [
  {
    id: 1,
    label: "Langkah 1",
    weeks: "Minggu 1-2",
    title: "Explorer",
    description: "Eksplorasi materi dasar dan kumpulkan badge awal agar siap masuk forum komunitas.",
    requirement: "Minimal 400 EXP",
    icon: Compass,
    accent: "from-primary/15 to-white dark:to-background",
  },
  {
    id: 2,
    label: "Langkah 2",
    weeks: "Minggu 3-6",
    title: "Contributor",
    description: "Mulai sharing insight di forum, nulis ide tematik, dan menuntaskan minimal 4 badge eksperimen.",
    requirement: "Badge tematik lengkap",
    icon: Users,
    accent: "from-sky-100 to-white dark:from-sky-950/30 dark:to-background",
  },
  {
    id: 3,
    label: "Langkah 3",
    weeks: "Minggu 7-10",
    title: "Champion",
    description: "Masuk leaderboard provinsi, raih reward komunitas, dan siap menjadi mentor mini bootcamp.",
    requirement: "Top 20 Leaderboard",
    icon: Medal,
    accent: "from-lime-100 to-white dark:from-lime-950/30 dark:to-background",
  },
  {
    id: 4,
    label: "Langkah 4",
    weeks: "Minggu 11+",
    title: "Legacy",
    description: "Kembangkan project sosial agrikultur serta kurasi tantangan untuk pemain baru.",
    requirement: "Kurasi proyek aktif",
    icon: Rocket,
    accent: "from-violet-100 to-white dark:from-violet-950/30 dark:to-background",
  },
]

export const tierLevels = [
  {
    id: 1,
    range: "0 - 1.499 EXP",
    title: "Akar Perunggu",
    tagline: "Pondasi belajar",
    benefits: ["Akses modul dasar", "Lencana Inovator Hijau"],
    icon: Leaf,
    accent: "from-yellow-50 via-white to-primary/10 dark:from-yellow-950/30 dark:via-background dark:to-primary/10",
  },
  {
    id: 2,
    range: "1.500 - 3.499 EXP",
    title: "Panen Perak",
    tagline: "Eksperimen lintas modul",
    benefits: ["Slot event prioritas", "Lencana Peneliti Tanah & Penjaga Ternak"],
    icon: Gem,
    accent: "from-muted via-white to-sky-50 dark:via-background dark:to-sky-950/30",
  },
  {
    id: 3,
    range: "3.500 - 5.999 EXP",
    title: "Kanopi Emas",
    tagline: "Mentoring lintas sekolah",
    benefits: ["Mentoring mingguan", "Undangan Penghargaan Mentor Inspirasi"],
    icon: Medal,
    accent: "from-yellow-50 via-white to-primary/10 dark:from-yellow-950/30 dark:via-background dark:to-primary/10",
  },
  {
    id: 4,
    range: "6.000+ EXP",
    title: "Mutiara Platinum",
    tagline: "Pemimpin kurasi",
    benefits: ["Pembuat tantangan nasional", "Hak memilih lencana baru"],
    icon: Crown,
    accent: "from-muted via-white to-violet-50 dark:via-background dark:to-violet-950/30",
  },
]
