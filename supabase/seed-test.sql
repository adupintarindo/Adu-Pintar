-- Seed data untuk testing login siswa
-- Jalankan di Supabase SQL Editor setelah schema-phase1.sql

-- 1. Sekolah contoh
insert into schools (id, name, npsn, email, phone, province, city, school_type, is_verified)
values (
  '00000000-0000-0000-0000-000000000001',
  'SDN Contoh 1',
  '12345678',
  'sdncontoh1@adupintar.test',
  '081234567890',
  'DKI Jakarta',
  'Jakarta Selatan',
  'SD',
  true
)
on conflict (id) do nothing;

-- 2. Kelas contoh
insert into classes (id, school_id, name, grade, grade_category, academic_year)
values (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  '4A',
  4,
  2,
  '2025/2026'
)
on conflict (id) do nothing;

-- 3. Siswa contoh (PIN: 123456)
insert into students (id, school_id, class_id, name, nisn, pin_token, grade, grade_category)
values (
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  'Budi Santoso',
  '1234567890',
  '123456',
  4,
  2
)
on conflict (id) do nothing;
