export type SchoolLevel = "SD" | "SMP" | "SMA"

export type LeaderboardPlayer = {
  rank: number
  name: string
  score: number
  wins: number
  losses: number
  grade: SchoolLevel
  city: string
  province: string
}

export type TeamLeaderboardEntry = {
  rank: number
  name: string
  score: number
  wins: number
  losses: number
  members: number
}

export const leaderboardPlayers: LeaderboardPlayer[] = [
  {
    rank: 1,
    name: "Ahmad Rizki Pratama",
    score: 2850,
    wins: 28,
    losses: 2,
    grade: "SMA",
    city: "Jakarta",
    province: "DKI Jakarta",
  },
  {
    rank: 2,
    name: "Siti Nurhaliza",
    score: 2720,
    wins: 27,
    losses: 3,
    grade: "SMA",
    city: "Bandung",
    province: "Jawa Barat",
  },
  {
    rank: 3,
    name: "Budi Santoso",
    score: 2610,
    wins: 26,
    losses: 4,
    grade: "SMP",
    city: "Surabaya",
    province: "Jawa Timur",
  },
  {
    rank: 4,
    name: "Rina Wijaya",
    score: 2490,
    wins: 24,
    losses: 6,
    grade: "SMA",
    city: "Jakarta",
    province: "DKI Jakarta",
  },
  {
    rank: 5,
    name: "Doni Hermawan",
    score: 2380,
    wins: 23,
    losses: 7,
    grade: "SMP",
    city: "Medan",
    province: "Sumatera Utara",
  },
  {
    rank: 6,
    name: "Lestari Putri",
    score: 2270,
    wins: 22,
    losses: 8,
    grade: "SD",
    city: "Jakarta",
    province: "DKI Jakarta",
  },
  {
    rank: 7,
    name: "Arjun Wijaya",
    score: 2150,
    wins: 21,
    losses: 9,
    grade: "SMA",
    city: "Yogyakarta",
    province: "DI Yogyakarta",
  },
  {
    rank: 8,
    name: "Dewi Santika",
    score: 2040,
    wins: 20,
    losses: 10,
    grade: "SMP",
    city: "Bandung",
    province: "Jawa Barat",
  },
  {
    rank: 9,
    name: "Fajar Kusuma",
    score: 1950,
    wins: 19,
    losses: 11,
    grade: "SMA",
    city: "Jakarta",
    province: "DKI Jakarta",
  },
  {
    rank: 10,
    name: "Maya Indah",
    score: 1850,
    wins: 18,
    losses: 12,
    grade: "SMP",
    city: "Bekasi",
    province: "Jawa Barat",
  },
  {
    rank: 11,
    name: "Yusuf Hamdan",
    score: 1780,
    wins: 17,
    losses: 13,
    grade: "SMA",
    city: "Malang",
    province: "Jawa Timur",
  },
  {
    rank: 12,
    name: "Putri Zalfa",
    score: 1710,
    wins: 17,
    losses: 13,
    grade: "SMP",
    city: "Semarang",
    province: "Jawa Tengah",
  },
  {
    rank: 13,
    name: "Rafael Surya",
    score: 1640,
    wins: 16,
    losses: 14,
    grade: "SD",
    city: "Depok",
    province: "Jawa Barat",
  },
  {
    rank: 14,
    name: "Intan Maulida",
    score: 1580,
    wins: 15,
    losses: 15,
    grade: "SMA",
    city: "Pontianak",
    province: "Kalimantan Barat",
  },
  {
    rank: 15,
    name: "Hendri Lazuardi",
    score: 1520,
    wins: 15,
    losses: 15,
    grade: "SMP",
    city: "Palembang",
    province: "Sumatera Selatan",
  },
  {
    rank: 16,
    name: "Salma Khairunnisa",
    score: 1470,
    wins: 14,
    losses: 16,
    grade: "SD",
    city: "Padang",
    province: "Sumatera Barat",
  },
  {
    rank: 17,
    name: "Rayhan Pradipta",
    score: 1410,
    wins: 14,
    losses: 16,
    grade: "SMP",
    city: "Makassar",
    province: "Sulawesi Selatan",
  },
  {
    rank: 18,
    name: "Citra Anggraini",
    score: 1360,
    wins: 13,
    losses: 17,
    grade: "SMA",
    city: "Denpasar",
    province: "Bali",
  },
  {
    rank: 19,
    name: "Farrel Mahesa",
    score: 1305,
    wins: 13,
    losses: 17,
    grade: "SD",
    city: "Tangerang",
    province: "Banten",
  },
  {
    rank: 20,
    name: "Mega Hartati",
    score: 1250,
    wins: 12,
    losses: 18,
    grade: "SMA",
    city: "Balikpapan",
    province: "Kalimantan Timur",
  },
]

export const teamLeaderboardEntries: TeamLeaderboardEntry[] = [
  { rank: 1, name: "Tim Agronomist Berpengalaman", score: 4250, wins: 18, losses: 2, members: 5 },
  { rank: 2, name: "Petani Muda Indonesia", score: 4120, wins: 17, losses: 3, members: 5 },
  { rank: 3, name: "Kampanye Pertanian Hijau", score: 3980, wins: 16, losses: 4, members: 4 },
  { rank: 4, name: "Kolaborasi Tani Cerdas", score: 3850, wins: 15, losses: 5, members: 5 },
  { rank: 5, name: "Gabungan Pelajar Agribisnis", score: 3720, wins: 14, losses: 6, members: 5 },
]
