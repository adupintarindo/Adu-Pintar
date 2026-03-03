import { z } from "zod"

export const npsnSchema = z
  .string()
  .regex(/^\d{8}$/, "NPSN harus 8 digit angka")
  .or(z.literal(""))

export const schoolRegisterSchema = z.object({
  role: z.literal("school"),
  name: z.string().min(2, "Nama PIC minimal 2 karakter").max(100),
  email: z.string().email("Format email tidak valid").max(254),
  password: z
    .string()
    .min(8, "Kata sandi minimal 8 karakter")
    .max(128)
    .refine((pw) => /[a-zA-Z]/.test(pw) && /\d/.test(pw), {
      message: "Kata sandi harus mengandung huruf dan angka",
    }),
  phoneNumber: z.string().min(8, "Nomor telepon minimal 8 digit").max(20),
  schoolName: z.string().min(3, "Nama sekolah minimal 3 karakter").max(200),
  schoolProvince: z.string().min(1, "Provinsi sekolah harus diisi"),
  schoolCity: z.string().min(1, "Kota/Kabupaten sekolah harus diisi"),
  npsn: npsnSchema.optional(),
  grade: z.enum(["SD", "SMP", "SMA"]),
  username: z.string().optional(),
})

export type SchoolRegisterInput = z.infer<typeof schoolRegisterSchema>
