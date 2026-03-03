import bcrypt from "bcryptjs"
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from "./supabase-admin"
import { hashPinToken, verifyPinToken } from "./pin-security"
import { isSupabaseConfigured } from "./supabase"

export type ManagedSchool = {
  id: string
  name: string
  npsn: string
  email: string
  phone: string
  address: string
  province: string
  city: string
  schoolType: "SD" | "SMP" | "SMA"
  isVerified: boolean
}

export type ManagedTeacher = {
  id: string
  schoolId: string
  name: string
  email: string
  gradeLevels: string[]
  role: "guru" | "co_admin"
  isActive: boolean
  createdAt: string
}

export type ManagedClass = {
  id: string
  schoolId: string
  teacherId?: string | null
  teacherName?: string | null
  name: string
  grade: number
  gradeCategory: 1 | 2 | 3
  academicYear: string
  studentCount: number
  createdAt: string
}

export type ManagedStudent = {
  id: string
  schoolId: string
  classId: string
  className?: string
  name: string
  nisn?: string | null
  pinToken: string
  grade: number
  gradeCategory: 1 | 2 | 3
  totalScore: number
  totalExp: number
  level: number
  gamesPlayed: number
  wins: number
  losses: number
  createdAt: string
}

export type SchoolDashboardData = {
  school: ManagedSchool
  teachers: ManagedTeacher[]
  classes: ManagedClass[]
  students: ManagedStudent[]
  stats: {
    totalStudents: number
    activeStudents: number
    averageScore: number
    averageExp: number
    schoolRankLabel: string
  }
}

export type TeacherDashboardData = {
  teacher: ManagedTeacher
  school: ManagedSchool
  classes: ManagedClass[]
  studentsByClass: Array<{
    classInfo: ManagedClass
    students: ManagedStudent[]
  }>
}

type RegisterSchoolInput = {
  name: string
  email: string
  password: string
  phone?: string
  province?: string
  city?: string
  npsn?: string
}

type FallbackSchoolAccount = {
  schoolId: string
  email: string
  password: string
  schoolName: string
}

type SupabaseSchoolRow = {
  id: string
  name: string
  npsn: string
  email: string
  phone: string | null
  address: string | null
  province: string | null
  city: string | null
  school_type: "SD" | "SMP" | "SMA" | null
  is_verified: boolean | null
}

type SupabaseTeacherRow = {
  id: string
  school_id: string
  name: string
  email: string
  grade_levels: string[] | null
  role: "guru" | "co_admin" | null
  is_active: boolean | null
  created_at: string | null
}

type SupabaseClassRow = {
  id: string
  school_id: string
  teacher_id: string | null
  name: string
  grade: number
  grade_category: number | null
  academic_year: string | null
  created_at: string | null
}

type SupabaseStudentRow = {
  id: string
  school_id: string
  class_id: string
  name: string
  nisn: string | null
  pin_token: string
  grade: number
  grade_category: number
  total_score: number | null
  total_exp: number | null
  level: number | null
  games_played: number | null
  wins: number | null
  losses: number | null
  created_at: string | null
}

const fallbackSchools = new Map<string, ManagedSchool>()
const fallbackTeachers = new Map<string, ManagedTeacher>()
const fallbackClasses = new Map<string, ManagedClass>()
const fallbackStudents = new Map<string, ManagedStudent>()
const fallbackSchoolAccounts = new Map<string, FallbackSchoolAccount>()
const fallbackTeacherPasswords = new Map<string, string>()

function isStrictSupabaseMode() {
  return isSupabaseConfigured()
}

function assertSupabaseReadyForStrictMode() {
  if (isStrictSupabaseMode() && !isSupabaseAdminConfigured()) {
    throw new Error("Konfigurasi Supabase service role belum lengkap")
  }
}

function randomId(prefix: string) {
  const token =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 11)
  return `${prefix}-${token}`
}

function gradeToCategory(grade: number): 1 | 2 | 3 {
  if (grade <= 2) return 1
  if (grade <= 4) return 2
  return 3
}

function generatePinToken() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function getSchoolTypeFromGrade(grade: number): "SD" | "SMP" | "SMA" {
  if (grade <= 6) return "SD"
  if (grade <= 9) return "SMP"
  return "SMA"
}

function ensureFallbackSeedData() {
  if (fallbackSchools.size > 0) return

  const school: ManagedSchool = {
    id: "school-demo-001",
    name: "SDN Adu Pintar Nusantara",
    npsn: "12345678",
    email: "school@example.com",
    phone: "021-5551234",
    address: "Jl. Pertanian No. 45",
    province: "DKI Jakarta",
    city: "Jakarta Selatan",
    schoolType: "SD",
    isVerified: true,
  }
  fallbackSchools.set(school.id, school)
  fallbackSchoolAccounts.set(school.email, {
    schoolId: school.id,
    email: school.email,
    password: bcrypt.hashSync("school123", 10),
    schoolName: school.name,
  })

  const teacher1: ManagedTeacher = {
    id: "teacher-demo-001",
    schoolId: school.id,
    name: "Ibu Rina Lestari",
    email: "teacher@example.com",
    gradeLevels: ["1-2", "3-4"],
    role: "co_admin",
    isActive: true,
    createdAt: new Date().toISOString(),
  }
  const teacher2: ManagedTeacher = {
    id: "teacher-demo-002",
    schoolId: school.id,
    name: "Pak Dimas Pratama",
    email: "guru2@example.com",
    gradeLevels: ["5-6"],
    role: "guru",
    isActive: true,
    createdAt: new Date().toISOString(),
  }
  fallbackTeachers.set(teacher1.id, teacher1)
  fallbackTeachers.set(teacher2.id, teacher2)
  fallbackTeacherPasswords.set(teacher1.email, bcrypt.hashSync("teacher123", 10))
  fallbackTeacherPasswords.set(teacher2.email, bcrypt.hashSync("teacher123", 10))

  const classA: ManagedClass = {
    id: "class-demo-3a",
    schoolId: school.id,
    teacherId: teacher1.id,
    teacherName: teacher1.name,
    name: "3A",
    grade: 3,
    gradeCategory: 2,
    academicYear: "2025/2026",
    studentCount: 0,
    createdAt: new Date().toISOString(),
  }
  const classB: ManagedClass = {
    id: "class-demo-5b",
    schoolId: school.id,
    teacherId: teacher2.id,
    teacherName: teacher2.name,
    name: "5B",
    grade: 5,
    gradeCategory: 3,
    academicYear: "2025/2026",
    studentCount: 0,
    createdAt: new Date().toISOString(),
  }
  fallbackClasses.set(classA.id, classA)
  fallbackClasses.set(classB.id, classB)

  const seedStudents: Array<Omit<ManagedStudent, "pinToken"> & { pinToken?: string }> = [
    {
      id: "student-demo-001",
      schoolId: school.id,
      classId: classA.id,
      className: classA.name,
      name: "Bima",
      nisn: "9988776611",
      pinToken: "111111",
      grade: 3,
      gradeCategory: 2,
      totalScore: 120,
      totalExp: 300,
      level: 1,
      gamesPlayed: 4,
      wins: 2,
      losses: 2,
      createdAt: new Date().toISOString(),
    },
    {
      id: "student-demo-002",
      schoolId: school.id,
      classId: classA.id,
      className: classA.name,
      name: "Salsa",
      nisn: "9988776622",
      pinToken: "222222",
      grade: 3,
      gradeCategory: 2,
      totalScore: 180,
      totalExp: 420,
      level: 1,
      gamesPlayed: 6,
      wins: 4,
      losses: 2,
      createdAt: new Date().toISOString(),
    },
    {
      id: "student-demo-003",
      schoolId: school.id,
      classId: classB.id,
      className: classB.name,
      name: "Nayla",
      nisn: "9988776633",
      pinToken: "333333",
      grade: 5,
      gradeCategory: 3,
      totalScore: 250,
      totalExp: 780,
      level: 1,
      gamesPlayed: 8,
      wins: 5,
      losses: 3,
      createdAt: new Date().toISOString(),
    },
  ]

  for (const student of seedStudents) {
    fallbackStudents.set(student.id, {
      ...student,
      pinToken: student.pinToken ?? generatePinToken(),
    })
  }
  recomputeFallbackClassCounts(school.id)
}

function recomputeFallbackClassCounts(schoolId: string) {
  const classes = Array.from(fallbackClasses.values()).filter((item) => item.schoolId === schoolId)
  for (const classInfo of classes) {
    classInfo.studentCount = Array.from(fallbackStudents.values()).filter((student) => student.classId === classInfo.id).length
  }
}

function mapSchoolRow(row: SupabaseSchoolRow): ManagedSchool {
  return {
    id: row.id,
    name: row.name,
    npsn: row.npsn,
    email: row.email,
    phone: row.phone ?? "",
    address: row.address ?? "",
    province: row.province ?? "",
    city: row.city ?? "",
    schoolType: row.school_type ?? "SD",
    isVerified: row.is_verified ?? false,
  }
}

function mapTeacherRow(row: SupabaseTeacherRow): ManagedTeacher {
  return {
    id: row.id,
    schoolId: row.school_id,
    name: row.name,
    email: row.email,
    gradeLevels: row.grade_levels ?? [],
    role: row.role ?? "guru",
    isActive: row.is_active ?? true,
    createdAt: row.created_at ?? new Date().toISOString(),
  }
}

function mapClassRow(row: SupabaseClassRow): ManagedClass {
  return {
    id: row.id,
    schoolId: row.school_id,
    teacherId: row.teacher_id,
    name: row.name,
    grade: row.grade,
    gradeCategory: (row.grade_category ?? gradeToCategory(row.grade)) as 1 | 2 | 3,
    academicYear: row.academic_year ?? "2025/2026",
    studentCount: 0,
    createdAt: row.created_at ?? new Date().toISOString(),
  }
}

function mapStudentRow(row: SupabaseStudentRow): ManagedStudent {
  return {
    id: row.id,
    schoolId: row.school_id,
    classId: row.class_id,
    name: row.name,
    nisn: row.nisn,
    pinToken: "••••••",
    grade: row.grade,
    gradeCategory: row.grade_category as 1 | 2 | 3,
    totalScore: row.total_score ?? 0,
    totalExp: row.total_exp ?? 0,
    level: row.level ?? 1,
    gamesPlayed: row.games_played ?? 0,
    wins: row.wins ?? 0,
    losses: row.losses ?? 0,
    createdAt: row.created_at ?? new Date().toISOString(),
  }
}

async function listSupabaseTeachers(schoolId: string): Promise<ManagedTeacher[] | null> {
  if (!isSupabaseAdminConfigured()) return null
  const strictMode = isStrictSupabaseMode()
  try {
    const supabase = createAdminSupabaseClient()
    const { data, error } = await supabase
      .from("teachers")
      .select("id, school_id, name, email, grade_levels, role, is_active, created_at")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false })
    if (error) {
      if (strictMode) throw new Error(error.message)
      return null
    }
    return ((data as SupabaseTeacherRow[] | null) ?? []).map(mapTeacherRow)
  } catch (error) {
    console.error("[school-management] listSupabaseTeachers failed:", error)
    if (strictMode) throw error instanceof Error ? error : new Error("Gagal memuat guru dari Supabase")
    return null
  }
}

async function listSupabaseClasses(schoolId: string): Promise<ManagedClass[] | null> {
  if (!isSupabaseAdminConfigured()) return null
  const strictMode = isStrictSupabaseMode()
  try {
    const supabase = createAdminSupabaseClient()
    const { data: classes, error } = await supabase
      .from("classes")
      .select("id, school_id, teacher_id, name, grade, grade_category, academic_year, created_at")
      .eq("school_id", schoolId)
      .order("grade", { ascending: true })
      .order("name", { ascending: true })
    if (error) {
      if (strictMode) throw new Error(error.message)
      return null
    }

    const classList = ((classes as SupabaseClassRow[] | null) ?? []).map(mapClassRow)
    if (classList.length === 0) return classList

    const { data: students } = await supabase
      .from("students")
      .select("id, class_id")
      .eq("school_id", schoolId)

    const counts = new Map<string, number>()
    for (const row of (students ?? []) as Array<{ id: string; class_id: string }>) {
      counts.set(row.class_id, (counts.get(row.class_id) ?? 0) + 1)
    }
    for (const classInfo of classList) {
      classInfo.studentCount = counts.get(classInfo.id) ?? 0
    }
    return classList
  } catch (error) {
    console.error("[school-management] listSupabaseClasses failed:", error)
    if (strictMode) throw error instanceof Error ? error : new Error("Gagal memuat kelas dari Supabase")
    return null
  }
}

async function listSupabaseStudents(schoolId: string): Promise<ManagedStudent[] | null> {
  if (!isSupabaseAdminConfigured()) return null
  const strictMode = isStrictSupabaseMode()
  try {
    const supabase = createAdminSupabaseClient()
    const { data: students, error } = await supabase
      .from("students")
      .select("id, school_id, class_id, name, nisn, pin_token, grade, grade_category, total_score, total_exp, level, games_played, wins, losses, created_at")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false })
    if (error) {
      if (strictMode) throw new Error(error.message)
      return null
    }

    const mapped = ((students as SupabaseStudentRow[] | null) ?? []).map(mapStudentRow)
    const { data: classes } = await supabase
      .from("classes")
      .select("id, name")
      .eq("school_id", schoolId)

    const classNames = new Map<string, string>()
    for (const row of (classes ?? []) as Array<{ id: string; name: string }>) {
      classNames.set(row.id, row.name)
    }

    for (const student of mapped) {
      student.className = classNames.get(student.classId)
    }
    return mapped
  } catch (error) {
    console.error("[school-management] listSupabaseStudents failed:", error)
    if (strictMode) throw error instanceof Error ? error : new Error("Gagal memuat siswa dari Supabase")
    return null
  }
}

async function getSupabaseSchool(schoolId: string): Promise<ManagedSchool | null> {
  if (!isSupabaseAdminConfigured()) return null
  const strictMode = isStrictSupabaseMode()
  try {
    const supabase = createAdminSupabaseClient()
    const { data, error } = await supabase
      .from("schools")
      .select("id, name, npsn, email, phone, address, province, city, school_type, is_verified")
      .eq("id", schoolId)
      .maybeSingle()
    if (error) {
      if (strictMode) throw new Error(error.message)
      return null
    }
    if (!data) return null
    return mapSchoolRow(data as SupabaseSchoolRow)
  } catch (error) {
    console.error("[school-management] getSupabaseSchool failed:", error)
    if (strictMode) throw error instanceof Error ? error : new Error("Gagal memuat data sekolah")
    return null
  }
}

async function pinExistsInSupabase(schoolId: string, pin: string): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return false
  try {
    const supabase = createAdminSupabaseClient()
    const { data } = await supabase
      .from("students")
      .select("id, pin_token")
      .eq("school_id", schoolId)
      .limit(5000)

    const rows = (data ?? []) as Array<{ id: string; pin_token: string }>
    return rows.some((row) => verifyPinToken(pin, row.pin_token))
  } catch (error) {
    console.error("[school-management] pinExistsInSupabase failed:", error)
    return false
  }
}

async function generateUniqueStudentPin(schoolId: string): Promise<string> {
  ensureFallbackSeedData()

  for (let i = 0; i < 50; i++) {
    const candidate = generatePinToken()
    const existsFallback = Array.from(fallbackStudents.values()).some(
      (student) => student.schoolId === schoolId && student.pinToken === candidate,
    )
    if (existsFallback) continue

    const existsSupabase = await pinExistsInSupabase(schoolId, candidate)
    if (existsSupabase) continue
    return candidate
  }
  return generatePinToken()
}

export async function listSchools(): Promise<ManagedSchool[]> {
  ensureFallbackSeedData()
  assertSupabaseReadyForStrictMode()
  const strictMode = isStrictSupabaseMode()
  if (!isSupabaseAdminConfigured()) {
    return Array.from(fallbackSchools.values())
  }
  try {
    const supabase = createAdminSupabaseClient()
    const { data, error } = await supabase
      .from("schools")
      .select("id, name, npsn, email, phone, address, province, city, school_type, is_verified")
      .order("created_at", { ascending: false })
      .limit(100)
    if (error) {
      if (strictMode) throw new Error(error.message)
      return Array.from(fallbackSchools.values())
    }
    return ((data as SupabaseSchoolRow[] | null) ?? []).map(mapSchoolRow)
  } catch (error) {
    console.error("[school-management] listAllSchools Supabase query failed:", error)
    if (strictMode) throw error instanceof Error ? error : new Error("Gagal memuat daftar sekolah")
    return Array.from(fallbackSchools.values())
  }
}

export async function getSchoolById(schoolId: string): Promise<ManagedSchool | null> {
  ensureFallbackSeedData()
  assertSupabaseReadyForStrictMode()
  const strictMode = isStrictSupabaseMode()
  const fromSupabase = await getSupabaseSchool(schoolId)
  if (fromSupabase) return fromSupabase
  if (strictMode) return null
  return fallbackSchools.get(schoolId) ?? null
}

export async function updateSchoolProfile(
  schoolId: string,
  patch: Partial<Pick<ManagedSchool, "name" | "phone" | "address" | "province" | "city">>,
): Promise<ManagedSchool | null> {
  ensureFallbackSeedData()
  assertSupabaseReadyForStrictMode()
  const strictMode = isStrictSupabaseMode()
  if (isSupabaseAdminConfigured()) {
    try {
      const supabase = createAdminSupabaseClient()
      const { data, error } = await supabase
        .from("schools")
        .update({
          name: patch.name,
          phone: patch.phone,
          address: patch.address,
          province: patch.province,
          city: patch.city,
        })
        .eq("id", schoolId)
        .select("id, name, npsn, email, phone, address, province, city, school_type, is_verified")
        .maybeSingle()
      if (!error && data) {
        return mapSchoolRow(data as SupabaseSchoolRow)
      }
      if (error && strictMode) {
        throw new Error(error.message)
      }
      if (strictMode) {
        return null
      }
    } catch (error) {
      console.error("[school-management] updateSchoolProfile Supabase operation failed:", error)
      if (strictMode) throw error instanceof Error ? error : new Error("Gagal memperbarui profil sekolah")
    }
  }

  const school = fallbackSchools.get(schoolId)
  if (!school) return null
  if (typeof patch.name === "string") school.name = patch.name
  if (typeof patch.phone === "string") school.phone = patch.phone
  if (typeof patch.address === "string") school.address = patch.address
  if (typeof patch.province === "string") school.province = patch.province
  if (typeof patch.city === "string") school.city = patch.city
  return school
}

export async function listTeachersBySchool(schoolId: string): Promise<ManagedTeacher[]> {
  ensureFallbackSeedData()
  assertSupabaseReadyForStrictMode()
  const strictMode = isStrictSupabaseMode()
  const fromSupabase = await listSupabaseTeachers(schoolId)
  if (fromSupabase) return fromSupabase
  if (strictMode) return []
  return Array.from(fallbackTeachers.values())
    .filter((teacher) => teacher.schoolId === schoolId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function addTeacherToSchool(params: {
  schoolId: string
  name: string
  email: string
  gradeLevels: string[]
  role: "guru" | "co_admin"
}): Promise<ManagedTeacher> {
  ensureFallbackSeedData()
  assertSupabaseReadyForStrictMode()
  const strictMode = isStrictSupabaseMode()

  if (isSupabaseAdminConfigured()) {
    try {
      const supabase = createAdminSupabaseClient()
      const { data, error } = await supabase
        .from("teachers")
        .insert({
          school_id: params.schoolId,
          name: params.name,
          email: params.email,
          grade_levels: params.gradeLevels,
          role: params.role,
          is_active: true,
        })
        .select("id, school_id, name, email, grade_levels, role, is_active, created_at")
        .single()
      if (!error && data) {
        return mapTeacherRow(data as SupabaseTeacherRow)
      }
      if (error && strictMode) {
        throw new Error(error.message)
      }
      if (strictMode) {
        throw new Error("Gagal menambahkan guru")
      }
    } catch (error) {
      console.error("[school-management] addTeacherToSchool Supabase operation failed:", error)
      if (strictMode) throw error instanceof Error ? error : new Error("Gagal menambahkan guru")
    }
  }

  const duplicate = Array.from(fallbackTeachers.values()).find(
    (teacher) => teacher.schoolId === params.schoolId && teacher.email.toLowerCase() === params.email.toLowerCase(),
  )
  if (duplicate) {
    throw new Error("Email guru sudah terdaftar di sekolah ini")
  }

  const teacher: ManagedTeacher = {
    id: randomId("teacher"),
    schoolId: params.schoolId,
    name: params.name,
    email: params.email,
    gradeLevels: params.gradeLevels,
    role: params.role,
    isActive: true,
    createdAt: new Date().toISOString(),
  }
  fallbackTeachers.set(teacher.id, teacher)
  fallbackTeacherPasswords.set(teacher.email, bcrypt.hashSync("teacher123", 10))
  return teacher
}

export async function listClassesBySchool(schoolId: string): Promise<ManagedClass[]> {
  ensureFallbackSeedData()
  assertSupabaseReadyForStrictMode()
  const strictMode = isStrictSupabaseMode()
  const [fromSupabase, teachersFallback] = await Promise.all([
    listSupabaseClasses(schoolId),
    Promise.resolve(Array.from(fallbackTeachers.values())),
  ])
  if (fromSupabase) {
    const teacherNameMap = new Map(teachersFallback.map((teacher) => [teacher.id, teacher.name]))
    for (const classInfo of fromSupabase) {
      classInfo.teacherName = classInfo.teacherId ? teacherNameMap.get(classInfo.teacherId) ?? null : null
    }
    return fromSupabase
  }
  if (strictMode) return []

  recomputeFallbackClassCounts(schoolId)
  const teacherMap = new Map(
    Array.from(fallbackTeachers.values())
      .filter((teacher) => teacher.schoolId === schoolId)
      .map((teacher) => [teacher.id, teacher.name]),
  )

  return Array.from(fallbackClasses.values())
    .filter((classInfo) => classInfo.schoolId === schoolId)
    .map((classInfo) => ({
      ...classInfo,
      teacherName: classInfo.teacherId ? teacherMap.get(classInfo.teacherId) ?? null : null,
    }))
    .sort((a, b) => a.grade - b.grade || a.name.localeCompare(b.name))
}

export async function createClassForSchool(params: {
  schoolId: string
  name: string
  grade: number
  teacherId?: string | null
  academicYear?: string
}): Promise<ManagedClass> {
  ensureFallbackSeedData()
  assertSupabaseReadyForStrictMode()
  const strictMode = isStrictSupabaseMode()
  const gradeCategory = gradeToCategory(params.grade)

  if (isSupabaseAdminConfigured()) {
    try {
      const supabase = createAdminSupabaseClient()
      const { data, error } = await supabase
        .from("classes")
        .insert({
          school_id: params.schoolId,
          teacher_id: params.teacherId ?? null,
          name: params.name,
          grade: params.grade,
          grade_category: gradeCategory,
          academic_year: params.academicYear ?? "2025/2026",
        })
        .select("id, school_id, teacher_id, name, grade, grade_category, academic_year, created_at")
        .single()
      if (!error && data) {
        return mapClassRow(data as SupabaseClassRow)
      }
      if (error && strictMode) {
        throw new Error(error.message)
      }
      if (strictMode) {
        throw new Error("Gagal membuat kelas")
      }
    } catch (error) {
      console.error("[school-management] createClassForSchool Supabase operation failed:", error)
      if (strictMode) throw error instanceof Error ? error : new Error("Gagal membuat kelas")
    }
  }

  const classInfo: ManagedClass = {
    id: randomId("class"),
    schoolId: params.schoolId,
    teacherId: params.teacherId ?? null,
    name: params.name,
    grade: params.grade,
    gradeCategory,
    academicYear: params.academicYear ?? "2025/2026",
    studentCount: 0,
    createdAt: new Date().toISOString(),
  }
  fallbackClasses.set(classInfo.id, classInfo)
  return classInfo
}

export async function listStudentsBySchool(schoolId: string): Promise<ManagedStudent[]> {
  ensureFallbackSeedData()
  assertSupabaseReadyForStrictMode()
  const strictMode = isStrictSupabaseMode()
  const fromSupabase = await listSupabaseStudents(schoolId)
  if (fromSupabase) return fromSupabase
  if (strictMode) return []

  const classNameMap = new Map(
    Array.from(fallbackClasses.values())
      .filter((classInfo) => classInfo.schoolId === schoolId)
      .map((classInfo) => [classInfo.id, classInfo.name]),
  )

  return Array.from(fallbackStudents.values())
    .filter((student) => student.schoolId === schoolId)
    .map((student) => ({ ...student, className: classNameMap.get(student.classId) }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function addStudentToSchool(params: {
  schoolId: string
  classId: string
  name: string
  nisn?: string
}): Promise<ManagedStudent> {
  ensureFallbackSeedData()
  assertSupabaseReadyForStrictMode()
  const strictMode = isStrictSupabaseMode()

  const classes = await listClassesBySchool(params.schoolId)
  const classInfo = classes.find((item) => item.id === params.classId)
  if (!classInfo) {
    throw new Error("Kelas tidak ditemukan")
  }

  const pinToken = await generateUniqueStudentPin(params.schoolId)
  const gradeCategory = classInfo.gradeCategory
  const grade = classInfo.grade

  if (isSupabaseAdminConfigured()) {
    try {
      const supabase = createAdminSupabaseClient()
      const { data, error } = await supabase
        .from("students")
        .insert({
          school_id: params.schoolId,
          class_id: params.classId,
          name: params.name,
          nisn: params.nisn ?? null,
          pin_token: hashPinToken(pinToken),
          grade,
          grade_category: gradeCategory,
        })
        .select("id, school_id, class_id, name, nisn, pin_token, grade, grade_category, total_score, total_exp, level, games_played, wins, losses, created_at")
        .single()
      if (!error && data) {
        const mapped = mapStudentRow(data as SupabaseStudentRow)
        mapped.className = classInfo.name
        mapped.pinToken = pinToken
        return mapped
      }
      if (error && strictMode) {
        throw new Error(error.message)
      }
      if (strictMode) {
        throw new Error("Gagal menambahkan siswa")
      }
    } catch (error) {
      console.error("[school-management] addStudentToSchool Supabase operation failed:", error)
      if (strictMode) throw error instanceof Error ? error : new Error("Gagal menambahkan siswa")
    }
  }

  const student: ManagedStudent = {
    id: randomId("student"),
    schoolId: params.schoolId,
    classId: params.classId,
    className: classInfo.name,
    name: params.name,
    nisn: params.nisn ?? null,
    pinToken,
    grade,
    gradeCategory,
    totalScore: 0,
    totalExp: 0,
    level: 1,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    createdAt: new Date().toISOString(),
  }
  fallbackStudents.set(student.id, student)
  recomputeFallbackClassCounts(params.schoolId)
  return student
}

export async function resetStudentPin(params: {
  schoolId: string
  studentId: string
}): Promise<ManagedStudent> {
  ensureFallbackSeedData()
  assertSupabaseReadyForStrictMode()
  const strictMode = isStrictSupabaseMode()
  const nextPin = await generateUniqueStudentPin(params.schoolId)

  if (isSupabaseAdminConfigured()) {
    try {
      const supabase = createAdminSupabaseClient()
      const { data, error } = await supabase
        .from("students")
        .update({ pin_token: hashPinToken(nextPin) })
        .eq("id", params.studentId)
        .eq("school_id", params.schoolId)
        .select("id, school_id, class_id, name, nisn, pin_token, grade, grade_category, total_score, total_exp, level, games_played, wins, losses, created_at")
        .single()
      if (!error && data) {
        const mapped = mapStudentRow(data as SupabaseStudentRow)
        mapped.pinToken = nextPin
        return mapped
      }
      if (error && strictMode) {
        throw new Error(error.message)
      }
      if (strictMode) {
        throw new Error("Siswa tidak ditemukan")
      }
    } catch (error) {
      console.error("[school-management] resetStudentPin Supabase operation failed:", error)
      if (strictMode) throw error instanceof Error ? error : new Error("Gagal reset PIN siswa")
    }
  }

  const student = fallbackStudents.get(params.studentId)
  if (!student || student.schoolId !== params.schoolId) {
    throw new Error("Siswa tidak ditemukan")
  }
  student.pinToken = nextPin
  return student
}

export async function getSchoolDashboardData(schoolId: string): Promise<SchoolDashboardData | null> {
  const [school, teachers, classes, students] = await Promise.all([
    getSchoolById(schoolId),
    listTeachersBySchool(schoolId),
    listClassesBySchool(schoolId),
    listStudentsBySchool(schoolId),
  ])

  if (!school) return null

  const totalStudents = students.length
  const activeStudents = students.filter((student) => student.gamesPlayed > 0).length
  const averageScore = totalStudents > 0 ? Math.round(students.reduce((sum, item) => sum + item.totalScore, 0) / totalStudents) : 0
  const averageExp = totalStudents > 0 ? Math.round(students.reduce((sum, item) => sum + item.totalExp, 0) / totalStudents) : 0

  return {
    school,
    teachers,
    classes,
    students,
    stats: {
      totalStudents,
      activeStudents,
      averageScore,
      averageExp,
      schoolRankLabel: `${school.city || "Kota"} Top ${Math.max(1, Math.min(10, Math.ceil((teachers.length + totalStudents) / 3)))}`,
    },
  }
}

export async function getTeacherDashboardData(params: {
  teacherId: string
  schoolId?: string
}): Promise<TeacherDashboardData | null> {
  ensureFallbackSeedData()
  assertSupabaseReadyForStrictMode()
  const strictMode = isStrictSupabaseMode()

  if (strictMode && !params.schoolId) {
    throw new Error("schoolId diperlukan untuk dashboard guru pada mode Supabase")
  }

  const teachers = params.schoolId ? await listTeachersBySchool(params.schoolId) : Array.from(fallbackTeachers.values())
  const teacher = teachers.find((item) => item.id === params.teacherId) ?? Array.from(fallbackTeachers.values()).find((item) => item.id === params.teacherId)
  if (!teacher) return null

  const school = await getSchoolById(teacher.schoolId)
  if (!school) return null

  const [classes, students] = await Promise.all([
    listClassesBySchool(teacher.schoolId),
    listStudentsBySchool(teacher.schoolId),
  ])

  const teacherClasses = classes.filter((classInfo) => classInfo.teacherId === teacher.id)
  const studentsByClass = teacherClasses.map((classInfo) => ({
    classInfo,
    students: students
      .filter((student) => student.classId === classInfo.id)
      .sort((a, b) => b.totalScore - a.totalScore || a.name.localeCompare(b.name)),
  }))

  return {
    teacher,
    school,
    classes: teacherClasses,
    studentsByClass,
  }
}

export async function registerSchoolAccount(input: RegisterSchoolInput): Promise<{
  school: ManagedSchool
  authUser: {
    id: string
    name: string
    role: "school_admin"
    schoolId: string
    schoolName: string
  }
  mode: "supabase" | "fallback"
}> {
  ensureFallbackSeedData()
  const supabaseConfigured = isSupabaseConfigured()

  if (supabaseConfigured && !isSupabaseAdminConfigured()) {
    throw new Error("Konfigurasi Supabase service role belum lengkap")
  }

  if (isSupabaseAdminConfigured()) {
    try {
      const supabase = createAdminSupabaseClient()
      const authCreate = await supabase.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true,
      })

      if (authCreate.error) {
        throw new Error(authCreate.error.message)
      }

      const createdAuthUserId = authCreate.data.user?.id
      if (!createdAuthUserId) {
        throw new Error("Gagal membuat akun autentikasi sekolah")
      }

      const schoolType = "SD" as const
      const { data: schoolRow, error: schoolError } = await supabase
        .from("schools")
        .insert({
          name: input.name,
          npsn: input.npsn ?? `${Math.floor(10000000 + Math.random() * 89999999)}`,
          email: input.email,
          phone: input.phone ?? null,
          province: input.province ?? null,
          city: input.city ?? null,
          school_type: schoolType,
          is_verified: false,
        })
        .select("id, name, npsn, email, phone, address, province, city, school_type, is_verified")
        .single()

      if (schoolError || !schoolRow) {
        const rollback = await supabase.auth.admin.deleteUser(createdAuthUserId)
        if (rollback.error) {
          console.error("[school-management] rollback auth user failed:", rollback.error)
        }
        throw new Error(schoolError?.message ?? "Gagal membuat data sekolah")
      }

      const school = mapSchoolRow(schoolRow as SupabaseSchoolRow)
      return {
        school,
        authUser: {
          id: school.id,
          name: school.name,
          role: "school_admin",
          schoolId: school.id,
          schoolName: school.name,
        },
        mode: "supabase",
      }
    } catch (error) {
      console.error("[school-management] Supabase registration failed:", error)
      throw new Error(error instanceof Error ? error.message : "Gagal mendaftarkan sekolah ke Supabase")
    }
  }

  if (fallbackSchoolAccounts.has(input.email)) {
    throw new Error("Email sekolah sudah terdaftar")
  }

  const schoolId = randomId("school")
  const school: ManagedSchool = {
    id: schoolId,
    name: input.name,
    npsn: input.npsn ?? `${Math.floor(10000000 + Math.random() * 89999999)}`,
    email: input.email,
    phone: input.phone ?? "",
    address: "",
    province: input.province ?? "",
    city: input.city ?? "",
    schoolType: "SD",
    isVerified: false,
  }

  fallbackSchools.set(school.id, school)
  fallbackSchoolAccounts.set(school.email, {
    schoolId: school.id,
    email: school.email,
    password: bcrypt.hashSync(input.password, 10),
    schoolName: school.name,
  })

  return {
    school,
    authUser: {
      id: school.id,
      name: school.name,
      role: "school_admin",
      schoolId: school.id,
      schoolName: school.name,
    },
    mode: "fallback",
  }
}

export function findFallbackSchoolOrTeacherByEmailPassword(params: {
  email: string
  password: string
}): {
  id: string
  name: string
  role: "school_admin" | "teacher"
  schoolId: string
  schoolName?: string
} | null {
  ensureFallbackSeedData()

  const schoolAccount = fallbackSchoolAccounts.get(params.email)
  if (schoolAccount && bcrypt.compareSync(params.password, schoolAccount.password)) {
    return {
      id: schoolAccount.schoolId,
      name: schoolAccount.schoolName,
      role: "school_admin",
      schoolId: schoolAccount.schoolId,
      schoolName: schoolAccount.schoolName,
    }
  }

  const teacherPassword = fallbackTeacherPasswords.get(params.email)
  if (teacherPassword && bcrypt.compareSync(params.password, teacherPassword)) {
    const teacher = Array.from(fallbackTeachers.values()).find((item) => item.email === params.email)
    const school = teacher ? fallbackSchools.get(teacher.schoolId) : null
    if (teacher) {
      return {
        id: teacher.id,
        name: teacher.name,
        role: "teacher",
        schoolId: teacher.schoolId,
        schoolName: school?.name,
      }
    }
  }

  return null
}

/* ---------- Self-registration for students & teachers ---------- */

const fallbackStudentPasswords = new Map<string, { hash: string; studentId: string; schoolId: string }>()

async function findOrCreateSchoolByInfo(params: {
  name: string
  province: string
  city: string
  grade: string
}): Promise<ManagedSchool> {
  ensureFallbackSeedData()
  const schoolType = (params.grade === "SMP" ? "SMP" : params.grade === "SMA" ? "SMA" : "SD") as "SD" | "SMP" | "SMA"

  if (isSupabaseAdminConfigured()) {
    const supabase = createAdminSupabaseClient()
    const { data: existing } = await supabase
      .from("schools")
      .select("id, name, npsn, email, phone, address, province, city, school_type, is_verified")
      .eq("name", params.name)
      .eq("province", params.province)
      .eq("city", params.city)
      .maybeSingle()

    if (existing) return mapSchoolRow(existing as SupabaseSchoolRow)

    const placeholderEmail = `${randomId("school")}@adupintar.placeholder`
    const placeholderNpsn = `${Math.floor(10000000 + Math.random() * 89999999)}`

    const { data: created, error } = await supabase
      .from("schools")
      .insert({
        name: params.name,
        npsn: placeholderNpsn,
        email: placeholderEmail,
        province: params.province,
        city: params.city,
        school_type: schoolType,
        is_verified: false,
      })
      .select("id, name, npsn, email, phone, address, province, city, school_type, is_verified")
      .single()

    if (!error && created) return mapSchoolRow(created as SupabaseSchoolRow)
  }

  const existing = Array.from(fallbackSchools.values()).find(
    (s) => s.name === params.name && s.province === params.province && s.city === params.city,
  )
  if (existing) return existing

  const school: ManagedSchool = {
    id: randomId("school"),
    name: params.name,
    npsn: `${Math.floor(10000000 + Math.random() * 89999999)}`,
    email: "",
    phone: "",
    address: "",
    province: params.province,
    city: params.city,
    schoolType: schoolType,
    isVerified: false,
  }
  fallbackSchools.set(school.id, school)
  return school
}

type RegisterStudentInput = {
  name: string
  email: string
  password: string
  grade: string
  className: string
  schoolName: string
  schoolProvince: string
  schoolCity: string
}

export async function registerStudentAccount(input: RegisterStudentInput): Promise<{
  student: ManagedStudent
  school: ManagedSchool
  pinToken: string
  authUser: {
    id: string
    name: string
    role: "student"
    schoolId: string
    schoolName: string
    classId: string
  }
  mode: "supabase" | "fallback"
}> {
  ensureFallbackSeedData()

  const school = await findOrCreateSchoolByInfo({
    name: input.schoolName,
    province: input.schoolProvince,
    city: input.schoolCity,
    grade: input.grade,
  })

  const gradeNum =
    Number.parseInt(input.className, 10) || (input.grade === "SD" ? 4 : input.grade === "SMP" ? 7 : 10)
  const gradeCategory = gradeToCategory(gradeNum)

  const classes = await listClassesBySchool(school.id)
  let targetClass = classes.find((c) => c.grade === gradeNum)
  if (!targetClass) {
    targetClass = await createClassForSchool({
      schoolId: school.id,
      name: `Kelas ${input.className}`,
      grade: gradeNum,
    })
  }

  const pinToken = await generateUniqueStudentPin(school.id)

  if (isSupabaseAdminConfigured()) {
    try {
      const supabase = createAdminSupabaseClient()

      const authCreate = await supabase.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true,
        user_metadata: { role: "student" },
      })
      if (authCreate.error) throw new Error(authCreate.error.message)

      const authUserId = authCreate.data.user?.id
      if (!authUserId) throw new Error("Gagal membuat akun autentikasi siswa")

      const { data: studentRow, error: studentError } = await supabase
        .from("students")
        .insert({
          school_id: school.id,
          class_id: targetClass.id,
          name: input.name,
          pin_token: hashPinToken(pinToken),
          grade: gradeNum,
          grade_category: gradeCategory,
        })
        .select(
          "id, school_id, class_id, name, nisn, pin_token, grade, grade_category, total_score, total_exp, level, games_played, wins, losses, created_at",
        )
        .single()

      if (studentError || !studentRow) {
        await supabase.auth.admin.deleteUser(authUserId)
        throw new Error(studentError?.message ?? "Gagal membuat data siswa")
      }

      const student = mapStudentRow(studentRow as SupabaseStudentRow)
      student.pinToken = pinToken
      student.className = targetClass.name

      await supabase.auth.admin.updateUserById(authUserId, {
        user_metadata: { role: "student", student_id: student.id },
      })

      return {
        student,
        school,
        pinToken,
        authUser: {
          id: student.id,
          name: student.name,
          role: "student",
          schoolId: school.id,
          schoolName: school.name,
          classId: targetClass.id,
        },
        mode: "supabase",
      }
    } catch (error) {
      if (isStrictSupabaseMode()) {
        throw new Error(error instanceof Error ? error.message : "Gagal mendaftarkan siswa")
      }
    }
  }

  const student: ManagedStudent = {
    id: randomId("student"),
    schoolId: school.id,
    classId: targetClass.id,
    className: targetClass.name,
    name: input.name,
    nisn: null,
    pinToken,
    grade: gradeNum,
    gradeCategory,
    totalScore: 0,
    totalExp: 0,
    level: 1,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    createdAt: new Date().toISOString(),
  }
  fallbackStudents.set(student.id, student)
  fallbackStudentPasswords.set(input.email, {
    hash: bcrypt.hashSync(input.password, 10),
    studentId: student.id,
    schoolId: school.id,
  })
  recomputeFallbackClassCounts(school.id)

  return {
    student,
    school,
    pinToken,
    authUser: {
      id: student.id,
      name: student.name,
      role: "student",
      schoolId: school.id,
      schoolName: school.name,
      classId: targetClass.id,
    },
    mode: "fallback",
  }
}

type RegisterTeacherInput = {
  name: string
  email: string
  password: string
  phone?: string
  grade: string
  schoolName: string
  schoolProvince: string
  schoolCity: string
}

export async function registerTeacherAccount(input: RegisterTeacherInput): Promise<{
  teacher: ManagedTeacher
  school: ManagedSchool
  authUser: {
    id: string
    name: string
    role: "teacher"
    schoolId: string
    schoolName: string
  }
  mode: "supabase" | "fallback"
}> {
  ensureFallbackSeedData()

  const school = await findOrCreateSchoolByInfo({
    name: input.schoolName,
    province: input.schoolProvince,
    city: input.schoolCity,
    grade: input.grade,
  })

  const gradeLevels =
    input.grade === "SD"
      ? ["1-2", "3-4", "5-6"]
      : input.grade === "SMP"
        ? ["7", "8", "9"]
        : ["10", "11", "12"]

  if (isSupabaseAdminConfigured()) {
    try {
      const supabase = createAdminSupabaseClient()

      const authCreate = await supabase.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true,
        user_metadata: { role: "teacher" },
      })
      if (authCreate.error) throw new Error(authCreate.error.message)

      const authUserId = authCreate.data.user?.id
      if (!authUserId) throw new Error("Gagal membuat akun autentikasi guru")

      const { data: teacherRow, error: teacherError } = await supabase
        .from("teachers")
        .insert({
          school_id: school.id,
          name: input.name,
          email: input.email,
          grade_levels: gradeLevels,
          role: "guru",
          is_active: true,
        })
        .select("id, school_id, name, email, grade_levels, role, is_active, created_at")
        .single()

      if (teacherError || !teacherRow) {
        await supabase.auth.admin.deleteUser(authUserId)
        throw new Error(teacherError?.message ?? "Gagal membuat data guru")
      }

      return {
        teacher: mapTeacherRow(teacherRow as SupabaseTeacherRow),
        school,
        authUser: {
          id: (teacherRow as SupabaseTeacherRow).id,
          name: input.name,
          role: "teacher",
          schoolId: school.id,
          schoolName: school.name,
        },
        mode: "supabase",
      }
    } catch (error) {
      if (isStrictSupabaseMode()) {
        throw new Error(error instanceof Error ? error.message : "Gagal mendaftarkan guru")
      }
    }
  }

  const existingTeacher = Array.from(fallbackTeachers.values()).find(
    (t) => t.email.toLowerCase() === input.email.toLowerCase(),
  )
  if (existingTeacher) throw new Error("Email guru sudah terdaftar")

  const teacher: ManagedTeacher = {
    id: randomId("teacher"),
    schoolId: school.id,
    name: input.name,
    email: input.email,
    gradeLevels: gradeLevels,
    role: "guru",
    isActive: true,
    createdAt: new Date().toISOString(),
  }
  fallbackTeachers.set(teacher.id, teacher)
  fallbackTeacherPasswords.set(teacher.email, bcrypt.hashSync(input.password, 10))

  return {
    teacher,
    school,
    authUser: {
      id: teacher.id,
      name: teacher.name,
      role: "teacher",
      schoolId: school.id,
      schoolName: school.name,
    },
    mode: "fallback",
  }
}

export function findFallbackStudentByEmailPassword(params: {
  email: string
  password: string
}): {
  id: string
  name: string
  role: "student"
  schoolId: string
  schoolName?: string
  classId: string
} | null {
  ensureFallbackSeedData()

  const entry = fallbackStudentPasswords.get(params.email)
  if (!entry || !bcrypt.compareSync(params.password, entry.hash)) return null

  const student = fallbackStudents.get(entry.studentId)
  if (!student) return null

  const school = fallbackSchools.get(student.schoolId)
  return {
    id: student.id,
    name: student.name,
    role: "student",
    schoolId: student.schoolId,
    schoolName: school?.name,
    classId: student.classId,
  }
}
