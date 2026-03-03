import bcrypt from "bcryptjs"
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from "./supabase-admin"
import { createServerSupabaseClient } from "./supabase-server"
import { isSupabaseConfigured } from "./supabase"
import { EXP_CONFIG, getLevel } from "./exp-config"
import { hashPinToken, isPinHashed, verifyPinToken } from "./pin-security"

export type UserRole = "school_admin" | "teacher" | "student"

export interface AuthUser {
  id: string
  name: string
  role: UserRole
  schoolId: string
  schoolName?: string
  classId?: string
  gradeCategory?: number
}

// Legacy user model is kept while the rest of the app is still using in-memory game/leaderboard flows.
export interface User {
  id: string
  name: string
  email: string
  password: string
  teamName?: string
  gender: "M" | "F"
  dateOfBirth: string
  grade: "SD" | "SMP" | "SMA"
  className: string
  city: string
  schoolName: string
  schoolProvince: string
  schoolCity: string
  phoneNumber: string
  score: number
  gamesPlayed: number
  wins: number
  losses: number
  createdAt: Date
}

type StudentLoginRow = {
  id: string
  name: string
  school_id: string
  class_id: string
  pin_token: string
  grade_category: number | null
  level: number | null
  total_score: number | null
  total_exp: number | null
  games_played: number | null
  wins: number | null
  losses: number | null
  last_login_date: string | null
  schools: { name: string } | { name: string }[] | null
}

type TeacherLoginRow = {
  id: string
  name: string
  school_id: string
  schools: { name: string } | { name: string }[] | null
}

type StudentStatsRow = {
  id: string
  name: string
  school_id: string
  class_id: string
  grade: number | null
  grade_category: number | null
  total_score: number | null
  total_exp: number | null
  level: number | null
  games_played: number | null
  wins: number | null
  losses: number | null
  schools: { name: string } | { name: string }[] | null
}

export type StudentStatsSnapshot = {
  id: string
  name: string
  schoolId: string
  schoolName?: string
  classId: string
  grade?: number
  gradeCategory?: number
  totalScore: number
  totalExp: number
  level: number
  gamesPlayed: number
  wins: number
  losses: number
}

const users: User[] = []

function getSchoolNameFromRelation(relation: { name: string } | { name: string }[] | null | undefined) {
  if (!relation) return undefined
  if (Array.isArray(relation)) return relation[0]?.name
  return relation.name
}

function upsertLegacyShadowUser(authUser: AuthUser) {
  const existingUser = users.find((user) => user.id === authUser.id)
  if (existingUser) {
    existingUser.name = authUser.name
    if (authUser.schoolName) {
      existingUser.schoolName = authUser.schoolName
    }
    return
  }

  users.push({
    id: authUser.id,
    name: authUser.name,
    email: `${authUser.id}@adupintar.local`,
    password: "",
    teamName: undefined,
    gender: "M",
    dateOfBirth: "2012-01-01",
    grade: "SD",
    className: authUser.classId ?? "-",
    city: authUser.schoolName ?? "-",
    schoolName: authUser.schoolName ?? "-",
    schoolProvince: "-",
    schoolCity: authUser.schoolName ?? "-",
    phoneNumber: "-",
    score: 0,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    createdAt: new Date(),
  })
}

function syncLegacyShadowUserStats(
  userId: string,
  stats: { totalScore: number; gamesPlayed: number; wins: number; losses: number },
) {
  const user = users.find((storedUser) => storedUser.id === userId)
  if (!user) return

  user.score = stats.totalScore
  user.gamesPlayed = stats.gamesPlayed
  user.wins = stats.wins
  user.losses = stats.losses
}

export async function loginStudent(params: {
  schoolId: string
  classId: string
  studentName: string
  pin: string
}): Promise<AuthUser | null> {
  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) {
    return null
  }

  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from("students")
    .select(
      "id, name, school_id, class_id, pin_token, grade_category, level, total_score, total_exp, games_played, wins, losses, last_login_date, schools(name)",
    )
    .eq("school_id", params.schoolId)
    .eq("class_id", params.classId)
    .eq("name", params.studentName)
    .limit(5)

  if (error || !Array.isArray(data) || data.length === 0) {
    return null
  }

  const candidateRows = data as StudentLoginRow[]
  const student = candidateRows.find((row) => verifyPinToken(params.pin, row.pin_token))
  if (!student) {
    return null
  }

  if (!isPinHashed(student.pin_token)) {
    try {
      await supabase
        .from("students")
        .update({
          pin_token: hashPinToken(params.pin),
        })
        .eq("id", student.id)
    } catch (error) {
      console.error("[auth] PIN migration failed (best effort):", error)
    }
  }
  const today = new Date().toISOString().split("T")[0]
  if (student.last_login_date !== today) {
    const nextTotalExp = (student.total_exp ?? 0) + EXP_CONFIG.DAILY_LOGIN
    const nextLevel = Math.max(student.level ?? 1, getLevel(nextTotalExp))
    await supabase
      .from("students")
      .update({
        last_login_date: today,
        total_exp: nextTotalExp,
        level: nextLevel,
      })
      .eq("id", student.id)
  }

  const user: AuthUser = {
    id: student.id,
    name: student.name,
    role: "student",
    schoolId: student.school_id,
    schoolName: getSchoolNameFromRelation(student.schools),
    classId: student.class_id,
    gradeCategory: student.grade_category ?? undefined,
  }

  upsertLegacyShadowUser(user)
  syncLegacyShadowUserStats(student.id, {
    totalScore: student.total_score ?? 0,
    gamesPlayed: student.games_played ?? 0,
    wins: student.wins ?? 0,
    losses: student.losses ?? 0,
  })
  return user
}

export async function loginSchoolOrTeacher(params: {
  email: string
  password: string
}): Promise<AuthUser | null> {
  if (!isSupabaseConfigured()) {
    return null
  }

  const supabase = await createServerSupabaseClient()
  const { data: signInResult, error: signInError } = await supabase.auth.signInWithPassword({
    email: params.email,
    password: params.password,
  })

  if (signInError || !signInResult.user) {
    return null
  }

  const roleLookupClient = isSupabaseAdminConfigured() ? createAdminSupabaseClient() : supabase

  const { data: schoolData, error: schoolError } = await roleLookupClient
    .from("schools")
    .select("id, name")
    .eq("email", params.email)
    .maybeSingle()

  if (schoolError) {
    await supabase.auth.signOut()
    return null
  }

  if (schoolData) {
    const user: AuthUser = {
      id: schoolData.id,
      name: schoolData.name,
      role: "school_admin",
      schoolId: schoolData.id,
      schoolName: schoolData.name,
    }
    upsertLegacyShadowUser(user)
    return user
  }

  const { data: teacherData, error: teacherError } = await roleLookupClient
    .from("teachers")
    .select("id, name, school_id, schools(name)")
    .eq("email", params.email)
    .eq("is_active", true)
    .maybeSingle()

  if (teacherError || !teacherData) {
    await supabase.auth.signOut()
    return null
  }

  const teacher = teacherData as TeacherLoginRow
  const user: AuthUser = {
    id: teacher.id,
    name: teacher.name,
    role: "teacher",
    schoolId: teacher.school_id,
    schoolName: getSchoolNameFromRelation(teacher.schools),
  }
  upsertLegacyShadowUser(user)
  return user
}

export async function getStudentStatsSnapshot(studentId: string): Promise<StudentStatsSnapshot | null> {
  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) {
    return null
  }

  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from("students")
    .select(
      "id, name, school_id, class_id, grade, grade_category, total_score, total_exp, level, games_played, wins, losses, schools(name)",
    )
    .eq("id", studentId)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  const row = data as StudentStatsRow
  const totalExp = row.total_exp ?? 0
  const snapshot: StudentStatsSnapshot = {
    id: row.id,
    name: row.name,
    schoolId: row.school_id,
    schoolName: getSchoolNameFromRelation(row.schools),
    classId: row.class_id,
    grade: row.grade ?? undefined,
    gradeCategory: row.grade_category ?? undefined,
    totalScore: row.total_score ?? 0,
    totalExp,
    level: Math.max(row.level ?? 1, getLevel(totalExp)),
    gamesPlayed: row.games_played ?? 0,
    wins: row.wins ?? 0,
    losses: row.losses ?? 0,
  }

  upsertLegacyShadowUser({
    id: snapshot.id,
    name: snapshot.name,
    role: "student",
    schoolId: snapshot.schoolId,
    schoolName: snapshot.schoolName,
    classId: snapshot.classId,
    gradeCategory: snapshot.gradeCategory,
  })
  syncLegacyShadowUserStats(snapshot.id, {
    totalScore: snapshot.totalScore,
    gamesPlayed: snapshot.gamesPlayed,
    wins: snapshot.wins,
    losses: snapshot.losses,
  })

  return snapshot
}

export function generateStudentPIN(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function registerUser(user: Omit<User, "id" | "score" | "gamesPlayed" | "wins" | "losses" | "createdAt">): User {
  if (users.find((storedUser) => storedUser.email === user.email)) {
    throw new Error("Email sudah terdaftar")
  }

  const newUser: User = {
    id: Math.random().toString(36).substring(2, 11),
    ...user,
    password: bcrypt.hashSync(user.password, 10),
    score: 0,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    createdAt: new Date(),
  }

  users.push(newUser)
  return newUser
}

export function findUserByEmail(email: string): User | undefined {
  return users.find((storedUser) => storedUser.email === email)
}

export function findUserById(id: string): User | undefined {
  return users.find((storedUser) => storedUser.id === id)
}

export function updateUserScore(userId: string, points: number): User {
  const user = findUserById(userId)
  if (!user) {
    throw new Error("User tidak ditemukan")
  }

  user.score += points
  return user
}

export function recordGameResult(userId: string, won: boolean, pointsEarned: number): User {
  const user = findUserById(userId)
  if (!user) {
    throw new Error("User tidak ditemukan")
  }

  user.gamesPlayed += 1
  if (won) {
    user.wins += 1
  } else {
    user.losses += 1
  }
  user.score += pointsEarned
  return user
}

export function getAllUsers(): User[] {
  return users
}
