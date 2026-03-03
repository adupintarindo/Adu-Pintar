# AGENT INSTRUCTIONS — Adu Pintar Platform Implementation
> Dokumen ini adalah spec eksekusi untuk AI Agent. Baca seluruh dokumen sebelum mulai mengeksekusi.
> Referensi konsep: `Konsep Adu Pintar_Gracia_19012026 copy.pptx` (sudah dianalisis).

---

## OVERVIEW PROYEK

**Platform:** Adu Pintar — Quiz & Kompetisi Digital Pertanian untuk Siswa SD–SMA Indonesia
**Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Radix UI, Supabase (target)
**Working Dir:** `/Users/alfatehanseptianta45/Documents/GitHub/Adu Pintar/adupintar`
**Status Saat Ini:** Prototype berjalan dengan in-memory storage. Data hilang saat server restart.

### Kondisi Existing (sudah ada)
- 1v1 duel game (in-memory)
- Registrasi/login via email+password (in-memory)
- Leaderboard individual & tim (static data)
- Dashboard, profile, achievements, materials, activity feed
- 45+ pertanyaan quiz (grade SD/SMP/SMA)
- UI komponen lengkap (Radix UI + shadcn)

---

## URUTAN EKSEKUSI FASE

Eksekusi **berurutan** sesuai fase. Jangan skip fase karena fase berikutnya depend pada fase sebelumnya.

```
FASE 1 → FASE 2 → FASE 3 → FASE 4 → FASE 5 → FASE 6 → FASE 7 → FASE 8
```

---

## FASE 1 — Database & Autentikasi Multi-Role

**Tujuan:** Migrasi dari in-memory ke Supabase + implementasi auth berbasis sekolah

### 1.1 Setup Supabase

**Install dependencies:**
```bash
pnpm add @supabase/supabase-js @supabase/ssr
```

**Buat file `lib/supabase.ts`:**
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Buat file `lib/supabase-server.ts`:**
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

**Tambah ke `.env.local`:**
```
NEXT_PUBLIC_SUPABASE_URL=<dari Supabase dashboard>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<dari Supabase dashboard>
SUPABASE_SERVICE_ROLE_KEY=<dari Supabase dashboard>
```

### 1.2 Skema Database Supabase

Jalankan SQL berikut di Supabase SQL Editor **secara berurutan:**

```sql
-- Tabel sekolah
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  npsn TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  province TEXT,
  city TEXT,
  school_type TEXT CHECK (school_type IN ('SD', 'SMP', 'SMA')),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel guru
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  grade_levels TEXT[], -- ['1-2', '3-4', '5-6']
  role TEXT CHECK (role IN ('guru', 'co_admin')) DEFAULT 'guru',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel kelas
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id),
  name TEXT NOT NULL, -- e.g. "3A", "5B"
  grade INTEGER NOT NULL, -- 1-12
  grade_category INTEGER CHECK (grade_category IN (1, 2, 3)),
  -- grade_category: 1=kelas1-2, 2=kelas3-4, 3=kelas5-6
  academic_year TEXT DEFAULT '2025/2026',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel siswa
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  nisn TEXT,
  pin_token TEXT NOT NULL, -- 6-digit PIN
  grade INTEGER NOT NULL,
  grade_category INTEGER NOT NULL,
  total_score INTEGER DEFAULT 0,
  total_exp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  games_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  last_login_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel soal
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_category INTEGER CHECK (grade_category IN (1, 2, 3)),
  -- 1=Kelas 1-2, 2=Kelas 3-4, 3=Kelas 5-6
  difficulty TEXT CHECK (difficulty IN ('mudah', 'menengah', 'sulit')) NOT NULL,
  topic TEXT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- ["A", "B", "C", "D"]
  correct_answer INTEGER NOT NULL, -- index 0-3
  explanation TEXT,
  points INTEGER GENERATED ALWAYS AS (
    CASE difficulty
      WHEN 'mudah' THEN 10
      WHEN 'menengah' THEN 15
      WHEN 'sulit' THEN 20
    END
  ) STORED,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel sesi game
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE, -- 6-char join code
  mode TEXT CHECK (mode IN ('practice', 'competition')) NOT NULL,
  game_type TEXT CHECK (game_type IN ('solo', '1v1', 'team')) NOT NULL,
  grade_category INTEGER NOT NULL,
  status TEXT CHECK (status IN ('waiting', 'in_progress', 'completed')) DEFAULT 'waiting',
  player_ids UUID[],
  player_names TEXT[],
  player_scores INTEGER[],
  questions JSONB, -- array of question IDs per player (shuffled)
  current_question_index INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 10,
  winner_id UUID REFERENCES students(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

-- Tabel jawaban per pemain per game
CREATE TABLE game_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id),
  question_id UUID REFERENCES questions(id),
  selected_answer INTEGER,
  is_correct BOOLEAN,
  response_time_ms INTEGER, -- waktu jawab dalam ms (untuk kecepatan bonus)
  points_earned INTEGER DEFAULT 0,
  speed_bonus INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel leaderboard (denormalized untuk query cepat)
CREATE TABLE leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id),
  grade_category INTEGER NOT NULL,
  competition_phase TEXT CHECK (competition_phase IN ('school', 'kabkota', 'provinsi', 'nasional')),
  total_score INTEGER DEFAULT 0,
  rank INTEGER,
  province TEXT,
  city TEXT,
  period TEXT, -- e.g. "2026-05" untuk Mei 2026
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel modul materi
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  grade_category INTEGER NOT NULL,
  topic TEXT NOT NULL,
  short_story TEXT,
  main_content JSONB, -- array of content blocks
  vocabulary JSONB, -- [{ word, definition }]
  activities JSONB, -- array of activity objects
  good_habits TEXT[],
  learning_map JSONB, -- checklist per sesi
  exp_reward INTEGER DEFAULT 100,
  order_index INTEGER,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel kompetisi
CREATE TABLE competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phase INTEGER CHECK (phase IN (1, 2, 3, 4)),
  -- 1=internal sekolah, 2=kab/kota, 3=provinsi, 4=nasional
  grade_category INTEGER,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT CHECK (status IN ('upcoming', 'active', 'completed')) DEFAULT 'upcoming',
  rules JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

-- RLS Policies (public read untuk leaderboard & questions)
CREATE POLICY "Public read leaderboard" ON leaderboard_entries FOR SELECT USING (true);
CREATE POLICY "Public read questions" ON questions FOR SELECT USING (is_active = true);
CREATE POLICY "Public read modules" ON modules FOR SELECT USING (is_published = true);
```

### 1.3 Sistem Autentikasi Baru

**Ganti `lib/auth.ts` sepenuhnya** dengan implementasi Supabase:

```typescript
// lib/auth.ts
import { createServerSupabaseClient } from './supabase-server'
import { cookies } from 'next/headers'

export type UserRole = 'school_admin' | 'teacher' | 'student'

export interface AuthUser {
  id: string
  name: string
  role: UserRole
  schoolId: string
  schoolName?: string
  classId?: string
  gradeCategory?: number
}

// Student login via PIN
export async function loginStudent(params: {
  schoolId: string
  classId: string
  studentName: string
  pin: string
}): Promise<AuthUser | null> {
  const supabase = await createServerSupabaseClient()
  const { data: student } = await supabase
    .from('students')
    .select('*, schools(name)')
    .eq('school_id', params.schoolId)
    .eq('class_id', params.classId)
    .eq('name', params.studentName)
    .eq('pin_token', params.pin)
    .single()

  if (!student) return null

  // Update last login dan award EXP harian
  const today = new Date().toISOString().split('T')[0]
  if (student.last_login_date !== today) {
    await supabase
      .from('students')
      .update({
        last_login_date: today,
        total_exp: student.total_exp + 15
      })
      .eq('id', student.id)
  }

  return {
    id: student.id,
    name: student.name,
    role: 'student',
    schoolId: student.school_id,
    schoolName: student.schools?.name,
    classId: student.class_id,
    gradeCategory: student.grade_category
  }
}

// Generate PIN unik untuk siswa
export function generateStudentPIN(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
```

**Update `app/login/page.tsx`:** Tambahkan dua tab login:
- Tab "Login Siswa" → pilih sekolah → pilih kelas → pilih nama → masukkan PIN
- Tab "Login Sekolah/Guru" → email + password (existing flow, connect ke Supabase)

**Buat `app/api/auth/student/route.ts`:**
```typescript
import { NextResponse } from 'next/server'
import { loginStudent } from '@/lib/auth'

export async function POST(req: Request) {
  const body = await req.json()
  const { schoolId, classId, studentName, pin } = body

  const user = await loginStudent({ schoolId, classId, studentName, pin })
  if (!user) {
    return NextResponse.json({ error: 'PIN atau data siswa tidak valid' }, { status: 401 })
  }

  const response = NextResponse.json({ user })
  response.cookies.set('student_session', JSON.stringify(user), {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 // 1 hari
  })
  return response
}
```

---

## FASE 2 — Sistem Game & Scoring

**Tujuan:** Update mekanisme game sesuai spec PPTX

### 2.1 Format Game Baru

**Update `lib/game.ts`** — ganti seleksi soal dan scoring:

```typescript
// Spec game dari PPTX:
// - 10 soal per game
// - 10 detik per soal
// - 2 menit total
// - Distribusi: 6 Mudah + 3 Menengah + 1 Sulit
// - Jawaban dan urutan soal diacak per pemain

export const GAME_CONFIG = {
  TOTAL_QUESTIONS: 10,
  TIME_PER_QUESTION_MS: 10000, // 10 detik
  DISTRIBUTION: { mudah: 6, menengah: 3, sulit: 1 },
  POINTS: { mudah: 10, menengah: 15, sulit: 20 },
  BONUS_PERFECT: 20,       // semua benar dalam 1 game
  BONUS_SPEED_PER_Q: 2,    // jawab < 3000ms
  BONUS_SPEED_THRESHOLD_MS: 3000,
  BONUS_WIN_1: 20,         // juara 1
  BONUS_WIN_2: 15,         // juara 2
  BONUS_WIN_3: 5,          // juara 3
  MAX_COMPETITION_GAMES: 10, // hanya 10 game pertama yang dihitung
  EXP_PER_GAME: 25,
}

// Fungsi seleksi soal
export async function selectQuestions(gradeCategory: number) {
  const supabase = createClient()

  const [mudah, menengah, sulit] = await Promise.all([
    supabase.from('questions')
      .select('*').eq('grade_category', gradeCategory)
      .eq('difficulty', 'mudah').eq('is_active', true)
      .limit(GAME_CONFIG.DISTRIBUTION.mudah * 3), // ambil lebih, lalu acak
    supabase.from('questions')
      .select('*').eq('grade_category', gradeCategory)
      .eq('difficulty', 'menengah').eq('is_active', true)
      .limit(GAME_CONFIG.DISTRIBUTION.menengah * 3),
    supabase.from('questions')
      .select('*').eq('grade_category', gradeCategory)
      .eq('difficulty', 'sulit').eq('is_active', true)
      .limit(GAME_CONFIG.DISTRIBUTION.sulit * 3),
  ])

  // Shuffle dan ambil sesuai distribusi
  const shuffle = (arr: any[]) => arr.sort(() => Math.random() - 0.5)
  return [
    ...shuffle(mudah.data || []).slice(0, GAME_CONFIG.DISTRIBUTION.mudah),
    ...shuffle(menengah.data || []).slice(0, GAME_CONFIG.DISTRIBUTION.menengah),
    ...shuffle(sulit.data || []).slice(0, GAME_CONFIG.DISTRIBUTION.sulit),
  ]
}

// Hitung poin dengan bonus
export function calculatePoints(params: {
  difficulty: 'mudah' | 'menengah' | 'sulit'
  isCorrect: boolean
  responseTimeMs: number
}): { base: number; speed_bonus: number; total: number } {
  if (!params.isCorrect) return { base: 0, speed_bonus: 0, total: 0 }

  const base = GAME_CONFIG.POINTS[params.difficulty]
  const speed_bonus = params.responseTimeMs < GAME_CONFIG.BONUS_SPEED_THRESHOLD_MS
    ? GAME_CONFIG.BONUS_SPEED_PER_Q : 0
  return { base, speed_bonus, total: base + speed_bonus }
}
```

### 2.2 Dua Mode Permainan

**Update `app/game/duel/page.tsx`** — tampilkan pilihan mode:

```tsx
// Tambahkan dua card sebelum memilih game:
// [Mode Latihan] — unlimited, instant feedback, tidak pengaruhi leaderboard
// [Mode Kompetisi] — hanya 10 game dihitung, mempengaruhi leaderboard sekolah
```

**Update `app/api/game/duel/create/route.ts`:**
```typescript
// Tambah mode parameter
const { gradeCategory, mode } = await req.json()
// mode: 'practice' | 'competition'

// Untuk competition mode, cek apakah sudah mencapai batas 10 game
if (mode === 'competition') {
  const { count } = await supabase
    .from('game_sessions')
    .select('*', { count: 'exact' })
    .eq('mode', 'competition')
    .contains('player_ids', [studentId])
    .eq('status', 'completed')

  if (count >= GAME_CONFIG.MAX_COMPETITION_GAMES) {
    return NextResponse.json({
      error: 'Batas 10 pertandingan kompetisi sudah tercapai untuk periode ini'
    }, { status: 400 })
  }
}
```

**Update `app/api/game/duel/[gameId]/answer/route.ts`:**
```typescript
// Hitung poin dengan difficulty + speed bonus
const question = await getQuestion(questionId)
const { base, speed_bonus, total } = calculatePoints({
  difficulty: question.difficulty,
  isCorrect: selectedAnswer === question.correct_answer,
  responseTimeMs: responseTimeMs
})

// Simpan ke game_answers
await supabase.from('game_answers').insert({
  game_id: gameId,
  student_id: studentId,
  question_id: questionId,
  selected_answer: selectedAnswer,
  is_correct: selectedAnswer === question.correct_answer,
  response_time_ms: responseTimeMs,
  points_earned: base,
  speed_bonus: speed_bonus
})
```

**Update `app/api/game/duel/[gameId]/results/route.ts`:**
```typescript
// Hitung perfect bonus di akhir game
// Hitung placement bonus (Juara 1/2/3)
// Award EXP +25 ke semua pemain
// Update leaderboard_entries jika mode === 'competition'
```

---

## FASE 3 — Sistem Kompetisi 4 Fase

**Tujuan:** Implementasi struktur kompetisi berjenjang

### 3.1 Buat `lib/competition.ts`

```typescript
export type CompetitionPhase = 1 | 2 | 3 | 4
// Phase 1: Internal Sekolah (Mei 2026)
// Phase 2: Kab/Kota (Jun 2026)
// Phase 3: Provinsi (Jul 2026)
// Phase 4: Nasional (Agu 2026)

export type GradeCategory = 1 | 2 | 3
// 1: Kelas 1-2 SD
// 2: Kelas 3-4 SD
// 3: Kelas 5-6 SD

// Group stage: 4 tim per grup (randomized dari kab/kota atau provinsi yang sama)
export const COMPETITION_CONFIG = {
  TEAMS_PER_GROUP: 4,
  PHASE_DATES: {
    1: { start: '2026-05-01', end: '2026-05-31', name: 'Internal Sekolah' },
    2: { start: '2026-06-01', end: '2026-06-30', name: 'Kab/Kota' },
    3: { start: '2026-07-01', end: '2026-07-31', name: 'Provinsi' },
    4: { start: '2026-08-01', end: '2026-08-31', name: 'Nasional' },
  }
}

// Top 3 per grade category mewakili sekolah ke fase berikutnya
export async function getSchoolRepresentatives(schoolId: string, phase: 1) {
  // Query top 3 dari leaderboard per grade category untuk sekolah ini
}

// Generate group bracket untuk fase 2/3
export async function generateGroupBracket(phase: 2 | 3, gradeCategory: GradeCategory, region: string) {
  // Ambil semua tim yang lolos dari fase sebelumnya
  // Randomize ke grup berisi 4 tim
  // Return bracket object
}
```

### 3.2 Buat `app/competition/page.tsx`

Tampilkan:
- Status fase kompetisi yang sedang berjalan
- Peringkat siswa saat ini dan apakah lolos ke fase berikutnya
- Timeline 4 fase dengan tanggal
- Bracket untuk fase 2/3/4

### 3.3 Update `app/leaderboard/page.tsx`

Tambahkan filter level:
```
[Sekolahku] [Kab/Kota] [Provinsi] [Nasional]
```
Masing-masing × 3 kategori:
```
[Kelas 1-2] [Kelas 3-4] [Kelas 5-6]
```

**Update `app/api/leaderboard/individual/route.ts`:**
```typescript
// Params: phase (school/kabkota/provinsi/nasional), gradeCategory (1/2/3), region (optional)
// Query leaderboard_entries dengan filter yang sesuai
```

---

## FASE 4 — Dashboard Sekolah & Guru

**Tujuan:** Implementasi sistem manajemen sekolah

### 4.1 Buat `app/school/dashboard/page.tsx`

Fitur:
- Lihat dan edit profil sekolah
- Daftar guru + tambah guru baru (form: nama, email, kelas, role)
- Statistik: total siswa aktif, rata-rata skor, peringkat sekolah
- List kelas + jumlah siswa per kelas

### 4.2 Buat `app/teacher/dashboard/page.tsx`

Fitur:
- Daftar kelas yang dipegang
- Per kelas: daftar siswa + skor + PIN token
- Tombol "Tambah Kelas" dan "Tambah Siswa"
- Generate/reset PIN siswa
- Tombol "Mulai Sesi Kompetisi" (membuka IFP mode)

### 4.3 API Routes Sekolah

**`app/api/school/teachers/route.ts`:**
```typescript
// POST: Tambah guru ke sekolah
// GET: List guru sekolah
// body: { name, email, gradeLevels, role }
// Setelah tambah: kirim invitation email ke guru
```

**`app/api/school/classes/route.ts`:**
```typescript
// POST: Buat kelas baru
// body: { name, grade, teacherId }
// Auto-assign grade_category berdasarkan grade
```

**`app/api/school/students/route.ts`:**
```typescript
// POST: Tambah siswa ke kelas
// body: { name, nisn, classId }
// Auto-generate PIN token (6 digit unik per sekolah)
// GET: List siswa dengan PIN

// PATCH: Reset PIN siswa
// body: { studentId }
// Generate PIN baru
```

### 4.4 Update Registrasi Sekolah

**Update `app/register/page.tsx`:**
Tambahkan flow registrasi sekolah (berbeda dari siswa):
- Step 1: Email sekolah + verifikasi OTP
- Step 2: Pilih nama sekolah (dari database NPSN Kemendikbud)
- Step 3: Buat School ID + password
- Step 4: Konfirmasi dan aktivasi

---

## FASE 5 — Sistem EXP & Badge

**Tujuan:** Sinkronkan sistem EXP dan level badge dengan spec PPTX

### 5.1 Konstanta EXP

**Buat `lib/exp-config.ts`:**
```typescript
export const EXP_CONFIG = {
  DAILY_LOGIN: 15,
  GAME_COMPLETION: 25,
  MODULE_READ: 100,
}

export const LEVEL_THRESHOLDS = [
  { level: 1, minExp: 0, maxExp: 999 },
  { level: 2, minExp: 1000, maxExp: 1999 },
  { level: 3, minExp: 2000, maxExp: 3999 },
  { level: 4, minExp: 4000, maxExp: 7999 },
  { level: 5, minExp: 8000, maxExp: 9999 },
  { level: 6, minExp: 10000, maxExp: 19999 },
  { level: 7, minExp: 20000, maxExp: 49999 },
  { level: 8, minExp: 50000, maxExp: 99999 },
  { level: 9, minExp: 100000, maxExp: 199999 },
  { level: 10, minExp: 200000, maxExp: Infinity },
]

export function getLevel(exp: number): number {
  return LEVEL_THRESHOLDS.find(t => exp >= t.minExp && exp <= t.maxExp)?.level ?? 1
}

export function getExpProgress(exp: number): { current: number; next: number; progress: number } {
  const levelData = LEVEL_THRESHOLDS.find(t => exp >= t.minExp && exp <= t.maxExp)!
  if (levelData.level === 10) return { current: exp, next: levelData.minExp, progress: 100 }

  const range = levelData.maxExp - levelData.minExp + 1
  const current = exp - levelData.minExp
  return {
    current: exp,
    next: levelData.maxExp + 1,
    progress: Math.floor((current / range) * 100)
  }
}
```

### 5.2 Update Dashboard

**Update `app/dashboard/page.tsx`:**
- Ambil `total_exp` dan `level` dari student data (Supabase)
- Tampilkan EXP bar dengan progress ke level berikutnya
- Gunakan `getExpProgress()` untuk kalkulasi

**Update `app/achievements/page.tsx`:**
- Tampilkan 10 level badge dengan karakter unik
- Highlight level saat ini
- Progress bar ke level berikutnya
- Section badge khusus (streak, perfect, topik-spesifik)

### 5.3 Award EXP Otomatis

Tambahkan EXP award di:
- `lib/auth.ts → loginStudent()`: +15 EXP per hari (sudah ada di skeleton Fase 1)
- `app/api/game/duel/[gameId]/results/route.ts`: +25 EXP per game completion
- `app/api/modules/[id]/complete/route.ts` (buat baru): +100 EXP per modul dibaca

---

## FASE 6 — Bank Soal & Kurikulum

**Tujuan:** Struktur pertanyaan sesuai kurikulum PPTX

### 6.1 Klasifikasi Soal yang Ada

**Update `lib/questions.ts`** — migrasi 45+ soal existing ke format baru:
```typescript
// Setiap soal harus punya:
interface Question {
  id: string
  grade_category: 1 | 2 | 3  // 1=Kelas 1-2, 2=Kelas 3-4, 3=Kelas 5-6
  difficulty: 'mudah' | 'menengah' | 'sulit'
  topic: string  // dari daftar topik kurikulum
  question: string
  options: string[]  // 4 pilihan
  correct_answer: number  // index 0-3
  explanation: string
}
```

Tagging untuk soal existing:
- Soal dengan kata "dasar", "apa itu", "nama" → `difficulty: 'mudah'`
- Soal dengan "proses", "mengapa", "bagaimana" → `difficulty: 'menengah'`
- Soal dengan "analisis", "hitungan", "perbandingan" → `difficulty: 'sulit'`

### 6.2 Topik Kurikulum per Kategori

**Kategori 1 (Kelas 1–2):**
`Pengantar Pertanian`, `Anatomi Tanaman`, `Kebutuhan Hidup Tanaman`, `Pangan Harian`, `Hewan Ternak`, `Lingkungan`, `Ilmu Tanah Dasar`, `Siklus Hidup`, `Benih & Bibit`, `Nutrisi (Pupuk)`, `Air & Irigasi`, `Hama & Penyakit Tanaman`, `Teknik Menanam`

**Kategori 2 (Kelas 3–4):**
`Fisiologi Tanaman`, `Manajemen Tanah`, `Manajemen Air`, `Hortikultura`, `Ekonomi Pertanian`, `Peternakan Lanjutan`, `Perikanan Dasar`, `Kimia Tanah`, `Pemupukan Presisi`, `Pengendalian Hama Terpadu (PHT)`, `Mekanisasi Pertanian`, `Smart Farming`, `Sistem Intensif Pertanian`

**Kategori 3 (Kelas 5–6):**
`Kebun Rumah`, `Pasca Panen`, `Pengolahan Hasil Pertanian`, `Manajemen Sampah`, `Gizi Keluarga`, `Teknologi Tepat Guna`, `Pangan Lokal`, `Peta Komoditas Pangan`, `Rantai Pasok Pertanian`, `Isu Lingkungan`, `Data Pangan Indonesia`, `Pengaruh Pangan dengan Sosial Ekonomi`, `Keamanan Pangan`, `Profesi dalam Pangan dan Pertanian`

### 6.3 Seed Soal ke Supabase

**Buat `scripts/seed-questions.ts`:**
```typescript
// Script untuk insert soal existing ke Supabase questions table
// Jalankan: npx ts-node scripts/seed-questions.ts
```

### 6.4 Modul Materi Terstruktur

**Update `app/materials/page.tsx`:**
- Grid modul berdasarkan topik kurikulum
- Filter: Kategori Grade (1-2, 3-4, 5-6) dan Topik
- Progress bar per modul (sudah dibaca / belum)

**Buat `app/materials/[id]/page.tsx`:**
Section yang harus ada (sesuai PPTX):
1. **Cerita Pembuka** — narasi kontekstual singkat
2. **Materi Utama** — penjelasan visual + teks
3. **Kosakata Baru** — daftar kata penting + definisi
4. **Kegiatan** — aktivitas interaktif (match, fill, klik)
5. **Latihan Soal** — 5–10 soal + pembahasan
6. **Kebiasaan Baik** — checklist karakter
7. **Peta Belajar** — progress checklist per sesi

Setelah semua section selesai dibaca: trigger EXP award +100

---

## FASE 7 — Halaman yang Perlu Dilengkapi

### 7.1 `app/gallery/page.tsx`

Implementasi:
```tsx
// Grid foto masonry
// Filter tab: Semua | Kompetisi | Sekolah | Workshop
// Data: array foto dengan caption, date, category
// Saat ini bisa pakai static data, nanti connect ke storage
```

### 7.2 `app/faq/page.tsx`

Isi content FAQ lengkap berdasarkan topik:
- **Tentang Adu Pintar**: Apa itu, gratis?, target pengguna
- **Cara Bermain**: Cara daftar, cara login siswa, mode latihan vs kompetisi
- **Kompetisi**: Jadwal, cara ikut, hadiah, fair play
- **Teknis**: Device yang support, IFP, bandwidth rendah
- **Untuk Sekolah**: Cara daftar sekolah, manajemen guru/siswa
- Gunakan Accordion component yang sudah ada

### 7.3 `app/impact/page.tsx`

Implementasi:
```tsx
// Section 1: Hero stats (jumlah sekolah, siswa, pertandingan)
// Section 2: 8 perubahan strategis dari PPTX
// Section 3: Map persebaran (bisa pakai SVG Indonesia)
// Section 4: Quote dari stakeholder
// Section 5: Partnership logos
```

Data dari PPTX — 8 perubahan strategis:
1. Akselerasi Regenerasi SDM Pertanian
2. Rebranding Citra Pertanian di Mata Gen Alpha & Z
3. Peningkatan Skor Literasi Sains & Numerasi
4. Solusi Kecanduan Gadget (Positive Distraction)
5. Optimalisasi Aset Teknologi Negara (IFP)
6. Local Economic Empowerment
7. Pemetaan Big Data Kompetensi Nasional (Heatmap)
8. Pemerataan Akses Kompetisi Berkualitas (Inklusivitas)

### 7.4 `app/contact/page.tsx`

```tsx
// Form: Nama, Email, Kategori (Umum/Kemitraan/Sponsor/Sekolah), Pesan
// Kontak info: WhatsApp +62 813 9509 8825, @adupintar.id, adupintar.id@gmail.com
// Gunakan Resend atau Nodemailer untuk kirim email
```

### 7.5 `app/admin/page.tsx` (Fungsional)

Tab yang harus bekerja:
- **Users**: List semua sekolah + status verifikasi, bisa approve/suspend
- **Questions**: List soal, filter difficulty/topic, tambah/edit/hapus soal
- **Competitions**: Buat kompetisi, atur tanggal fase, lihat hasil
- **Analytics**: Overview stats (total user, game played, dll)

---

## FASE 8 — Fitur Lanjutan (Post-Launch)

Implementasi setelah Fase 1–7 selesai dan stable.

### 8.1 AI Adaptive Questions (`lib/adaptive-engine.ts`)
```typescript
// Analisis pattern jawaban salah per topik per siswa
// Prioritaskan soal dari topik yang sering salah
// Digunakan di Mode Latihan untuk rekomendasikan soal berikutnya
```

### 8.2 Replay Feature
- `app/activity/[gameId]/review/page.tsx`
- Tampilkan per soal: jawaban siswa, jawaban benar, penjelasan
- Statistik: akurasi, kecepatan rata-rata, poin

### 8.3 IFP Mode (Large Screen)
- Query param `?mode=ifp` di `/game/duel/playing/[gameId]`
- Font 3x lebih besar, kontras tinggi, minimal chrome
- Timer visual besar, skor semua pemain visible

### 8.4 Forum Diskusi
- `app/forum/page.tsx`
- Thread per topik kurikulum
- Student posting + reply
- Teacher/admin moderasi

### 8.5 National Analytics Dashboard
- `app/analytics/page.tsx` — role: admin/partner only
- Heatmap kompetensi per wilayah (SVG Indonesia dengan color coding)
- Breakdown per provinsi, kab/kota, grade category, topik
- Export CSV

---

## CATATAN PENTING UNTUK AGENT

### Environment Variables yang Dibutuhkan
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=          # untuk email (opsional Fase 4)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Conventions Existing yang Harus Diikuti
- Semua komponen: `components/` directory, TypeScript
- Styling: Tailwind CSS utility classes (NO custom CSS kecuali `app/globals.css`)
- Icons: Lucide React
- UI primitives: Radix UI via shadcn components di `components/ui/`
- Forms: React Hook Form + Zod validation
- Toast notifications: Sonner (`import { toast } from 'sonner'`)
- Routing: Next.js App Router (`app/` directory)
- Server components by default, tambah `'use client'` hanya jika perlu interaktivitas

### Package Manager
```bash
pnpm install  # SELALU pakai pnpm
pnpm dev      # development server
pnpm build    # production build
```

### File Struktur Referensi
```
adupintar/
├── app/
│   ├── api/           ← Server-side API routes
│   ├── game/          ← Game pages
│   ├── dashboard/     ← User dashboard
│   ├── leaderboard/   ← Leaderboard
│   ├── materials/     ← Materi/modul
│   ├── school/        ← BARU: School admin
│   ├── teacher/       ← BARU: Teacher dashboard
│   └── competition/   ← BARU: Competition management
├── components/
│   ├── ui/            ← shadcn UI primitives
│   └── *.tsx          ← Custom components
├── lib/
│   ├── supabase.ts    ← BARU: Supabase client
│   ├── auth.ts        ← UPDATE: Multi-role auth
│   ├── game.ts        ← UPDATE: Scoring + mode
│   ├── competition.ts ← BARU: Competition logic
│   └── exp-config.ts  ← BARU: EXP/level system
└── types/             ← TypeScript type definitions
```

### Acceptance Criteria Per Fase

| Fase | Kriteria Pass |
|------|--------------|
| 1 | Login siswa dengan PIN berhasil + data tidak hilang setelah restart |
| 2 | Game selesai → poin dihitung sesuai difficulty + speed bonus |
| 3 | Leaderboard menampilkan 4 level (sekolah/kabkota/provinsi/nasional) |
| 4 | Sekolah bisa daftar → tambah guru → guru tambah siswa → generate PIN |
| 5 | Login harian → EXP +15 di dashboard → badge naik level setelah threshold |
| 6 | Soal ter-tag difficulty + modul punya 7 section + EXP diberikan saat selesai |
| 7 | Gallery, FAQ, Impact, Contact semua bisa dibuka dan punya konten |
| 8 | Fitur lanjutan bisa digunakan tanpa breaking changes |
