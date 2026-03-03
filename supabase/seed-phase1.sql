-- Phase 1 seed data for Adu Pintar
-- Jalankan SETELAH `supabase/schema-phase1.sql`
--
-- Catatan penting (login sekolah/guru via Supabase Auth):
-- 1) Data SQL ini hanya mengisi tabel aplikasi (`schools`, `teachers`, dst.)
-- 2) Untuk login sekolah/guru dengan email+password Supabase, buat user Auth secara manual
--    di Supabase Dashboard > Authentication > Users dengan email yang sama seperti di bawah:
--    - school@smanadupintar.test
--    - school@smpadupintar.test
--    - rina.guru@adupintar.test
--    - budi.guru@adupintar.test
--    - desi.guru@adupintar.test
--
-- Login siswa TIDAK membutuhkan auth.users karena memakai PIN dari tabel `students`.

begin;

-- =========================================================
-- 1) Sekolah
-- =========================================================
insert into schools (id, name, npsn, email, phone, address, province, city, school_type, is_verified)
values
  ('10000000-0000-0000-0000-000000000001', 'SDN Adu Pintar Nusantara', '10000001', 'school@sdadupintar.test', '0215551001', 'Jl. Kebun Ilmu No. 1', 'DKI Jakarta', 'Jakarta Selatan', 'SD', true),
  ('10000000-0000-0000-0000-000000000002', 'SMP Negeri Tani Cerdas', '10000002', 'school@smpadupintar.test', '0225551002', 'Jl. Sawah Inovasi No. 2', 'Jawa Barat', 'Bandung', 'SMP', true),
  ('10000000-0000-0000-0000-000000000003', 'SMA Agro Teknologi Mandiri', '10000003', 'school@smanadupintar.test', '0315551003', 'Jl. Panen Digital No. 3', 'Jawa Timur', 'Surabaya', 'SMA', true)
on conflict (id) do update
set
  name = excluded.name,
  npsn = excluded.npsn,
  email = excluded.email,
  phone = excluded.phone,
  address = excluded.address,
  province = excluded.province,
  city = excluded.city,
  school_type = excluded.school_type,
  is_verified = excluded.is_verified;

-- =========================================================
-- 2) Guru
-- =========================================================
insert into teachers (id, school_id, name, email, grade_levels, role, is_active)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Ibu Rina Lestari', 'rina.guru@adupintar.test', array['1-2','3-4'], 'co_admin', true),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Pak Dimas Pratama', 'dimas.guru@adupintar.test', array['5-6'], 'guru', true),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'Pak Budi Santoso', 'budi.guru@adupintar.test', array['7-9'], 'co_admin', true),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003', 'Ibu Desi Wulandari', 'desi.guru@adupintar.test', array['10-12'], 'co_admin', true)
on conflict (id) do update
set
  school_id = excluded.school_id,
  name = excluded.name,
  email = excluded.email,
  grade_levels = excluded.grade_levels,
  role = excluded.role,
  is_active = excluded.is_active;

-- =========================================================
-- 3) Kelas
-- grade_category schema:
--   1 = kelas 1-2
--   2 = kelas 3-4
--   3 = kelas 5-6
-- =========================================================
insert into classes (id, school_id, teacher_id, name, grade, grade_category, academic_year)
values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '2A', 2, 1, '2025/2026'),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '4A', 4, 2, '2025/2026'),
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', '5B', 5, 3, '2025/2026'),
  ('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', '7A', 7, 3, '2025/2026'),
  ('30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000004', '10A', 10, 3, '2025/2026')
on conflict (id) do update
set
  school_id = excluded.school_id,
  teacher_id = excluded.teacher_id,
  name = excluded.name,
  grade = excluded.grade,
  grade_category = excluded.grade_category,
  academic_year = excluded.academic_year;

-- =========================================================
-- 4) Siswa (login via PIN)
-- =========================================================
insert into students (
  id, school_id, class_id, name, nisn, pin_token, grade, grade_category,
  total_score, total_exp, level, games_played, wins, losses, last_login_date
)
values
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Nadia Aulia', '2010000001', '111111', 2, 1, 120, 1150, 2, 5, 3, 2, current_date),
  ('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Rafi Prakoso', '2010000002', '111112', 2, 1, 180, 1640, 2, 8, 5, 3, current_date - interval '1 day'),
  ('40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'Budi Santoso', '2010000003', '123456', 4, 2, 340, 2420, 3, 12, 8, 4, current_date),
  ('40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'Salsa Rahma', '2010000004', '123457', 4, 2, 410, 3180, 3, 15, 10, 5, current_date - interval '2 day'),
  ('40000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 'Nayla Putri', '2010000005', '123458', 5, 3, 530, 4520, 4, 18, 12, 6, current_date),
  ('40000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 'Arkan Maulana', '2010000006', '123459', 5, 3, 495, 4010, 4, 17, 11, 6, current_date - interval '1 day'),
  ('40000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000004', 'Citra Lestari', '2020000001', '223456', 7, 3, 620, 5370, 4, 20, 14, 6, current_date),
  ('40000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000004', 'Dio Permana', '2020000002', '223457', 7, 3, 610, 5290, 4, 21, 13, 8, current_date),
  ('40000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000005', 'Alya Sasmita', '2030000001', '323456', 10, 3, 980, 8720, 5, 30, 22, 8, current_date),
  ('40000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000005', 'Fikri Aditya', '2030000002', '323457', 10, 3, 940, 8110, 5, 28, 20, 8, current_date - interval '1 day')
on conflict (id) do update
set
  school_id = excluded.school_id,
  class_id = excluded.class_id,
  name = excluded.name,
  nisn = excluded.nisn,
  pin_token = excluded.pin_token,
  grade = excluded.grade,
  grade_category = excluded.grade_category,
  total_score = excluded.total_score,
  total_exp = excluded.total_exp,
  level = excluded.level,
  games_played = excluded.games_played,
  wins = excluded.wins,
  losses = excluded.losses,
  last_login_date = excluded.last_login_date;

-- =========================================================
-- 5) Soal (contoh minimal untuk tiap kategori & difficulty)
-- =========================================================
insert into questions (
  id, grade_category, difficulty, topic, question, options, correct_answer, explanation, is_active
)
values
  ('50000000-0000-0000-0000-000000000001', 1, 'mudah', 'Tanaman', 'Bagian tumbuhan yang menyerap air adalah?', '["Akar","Daun","Bunga","Buah"]'::jsonb, 0, 'Akar menyerap air dan mineral dari tanah.', true),
  ('50000000-0000-0000-0000-000000000002', 1, 'menengah', 'Air', 'Kapan tanaman sebaiknya disiram?', '["Saat tanah retak","Saat media mulai kering","Hanya saat hujan","Tidak perlu"]'::jsonb, 1, 'Tanaman disiram saat media mulai kering agar tidak berlebihan.', true),
  ('50000000-0000-0000-0000-000000000003', 1, 'sulit', 'Lingkungan', 'Contoh tindakan hemat air di kebun sekolah adalah?', '["Menyiram siang bolong","Menggunakan mulsa","Membuang air cucian","Membiarkan selang terbuka"]'::jsonb, 1, 'Mulsa membantu menjaga kelembapan tanah.', true),
  ('50000000-0000-0000-0000-000000000004', 2, 'mudah', 'Tanah', 'Tanah gembur membantu tanaman karena...', '["Akar sulit tumbuh","Air & udara mudah masuk","Tanah lebih panas","Biji membusuk"]'::jsonb, 1, 'Tanah gembur mempermudah akar mendapat air dan oksigen.', true),
  ('50000000-0000-0000-0000-000000000005', 2, 'menengah', 'Hama', 'Pengendalian hama ramah lingkungan dapat dilakukan dengan...', '["Pestisida berlebihan","Musuh alami","Membakar lahan","Menebang semua tanaman"]'::jsonb, 1, 'Musuh alami adalah bagian dari PHT.', true),
  ('50000000-0000-0000-0000-000000000006', 2, 'sulit', 'Cuaca', 'Alat untuk mengukur curah hujan adalah...', '["Termometer","Higrometer","Ombrometer","Barometer"]'::jsonb, 2, 'Ombrometer digunakan mengukur curah hujan.', true),
  ('50000000-0000-0000-0000-000000000007', 3, 'mudah', 'Agribisnis', 'Tujuan kemasan produk pertanian adalah...', '["Mempercepat busuk","Menurunkan kualitas","Melindungi & menarik pembeli","Mengurangi berat saja"]'::jsonb, 2, 'Kemasan melindungi produk dan meningkatkan daya tarik.', true),
  ('50000000-0000-0000-0000-000000000008', 3, 'menengah', 'Teknologi', 'Sensor kelembapan tanah membantu petani untuk...', '["Menebak harga pasar","Menentukan waktu irigasi","Mengganti pupuk","Meningkatkan suhu"]'::jsonb, 1, 'Sensor membantu keputusan irigasi lebih efisien.', true),
  ('50000000-0000-0000-0000-000000000009', 3, 'sulit', 'Iklim', 'Mitigasi perubahan iklim di pertanian dapat dilakukan dengan...', '["Deforestasi","Pembakaran jerami","Agroforestry","Monokultur ekstrem"]'::jsonb, 2, 'Agroforestry membantu serapan karbon dan ketahanan lahan.', true)
on conflict (id) do update
set
  grade_category = excluded.grade_category,
  difficulty = excluded.difficulty,
  topic = excluded.topic,
  question = excluded.question,
  options = excluded.options,
  correct_answer = excluded.correct_answer,
  explanation = excluded.explanation,
  is_active = excluded.is_active;

-- =========================================================
-- 6) Modul (untuk materials)
-- =========================================================
insert into modules (
  id, title, grade_category, topic, short_story, main_content, vocabulary, activities, good_habits, learning_map, exp_reward, order_index, is_published
)
values
  (
    '60000000-0000-0000-0000-000000000001',
    'Kenalan dengan Tanaman di Sekitar Sekolah',
    1,
    'Tanaman Dasar',
    'Siswa diajak mengenali bagian tanaman dan kebutuhan dasarnya.',
    '{"sections":[{"title":"Bagian Tanaman","points":["Akar","Batang","Daun"]}]}'::jsonb,
    '["akar","batang","daun","siram"]'::jsonb,
    '["Amati 3 tanaman di halaman sekolah","Gambar bagian tanaman"]'::jsonb,
    array['Siram seperlunya','Buang sampah pada tempatnya'],
    '{"next":"Cuaca dan Air"}'::jsonb,
    100,
    1,
    true
  ),
  (
    '60000000-0000-0000-0000-000000000002',
    'Cuaca, Air, dan Kebun Mini',
    2,
    'Cuaca & Air',
    'Mengenal pengaruh cuaca terhadap pertumbuhan tanaman.',
    '{"sections":[{"title":"Curah Hujan","points":["Pengaruh hujan","Drainase"]}]}'::jsonb,
    '["cuaca","hujan","drainase","mulsa"]'::jsonb,
    '["Catat cuaca 7 hari","Buat jadwal penyiraman"]'::jsonb,
    array['Hemat air','Cek kelembapan media sebelum menyiram'],
    '{"next":"Tanah dan Nutrisi"}'::jsonb,
    100,
    2,
    true
  ),
  (
    '60000000-0000-0000-0000-000000000003',
    'Smart Farming untuk Pemula',
    3,
    'Teknologi Pertanian',
    'Pengantar sensor sederhana dan dashboard pemantauan kebun.',
    '{"sections":[{"title":"Sensor Dasar","points":["Kelembapan","Suhu"]}]}'::jsonb,
    '["sensor","kelembapan","dashboard","IoT"]'::jsonb,
    '["Simulasikan pembacaan sensor","Interpretasi grafik"]'::jsonb,
    array['Catat data harian','Diskusikan hasil dengan tim'],
    '{"next":"Analisis Hasil Panen"}'::jsonb,
    100,
    3,
    true
  )
on conflict (id) do update
set
  title = excluded.title,
  grade_category = excluded.grade_category,
  topic = excluded.topic,
  short_story = excluded.short_story,
  main_content = excluded.main_content,
  vocabulary = excluded.vocabulary,
  activities = excluded.activities,
  good_habits = excluded.good_habits,
  learning_map = excluded.learning_map,
  exp_reward = excluded.exp_reward,
  order_index = excluded.order_index,
  is_published = excluded.is_published;

-- =========================================================
-- 7) Kompetisi
-- =========================================================
insert into competitions (id, name, phase, grade_category, start_date, end_date, status, rules)
values
  ('70000000-0000-0000-0000-000000000001', 'Adu Pintar Fase Sekolah 2026 - Kategori 1', 1, 1, '2026-05-01', '2026-05-31', 'upcoming', '{"max_games":10}'::jsonb),
  ('70000000-0000-0000-0000-000000000002', 'Adu Pintar Fase Sekolah 2026 - Kategori 2', 1, 2, '2026-05-01', '2026-05-31', 'upcoming', '{"max_games":10}'::jsonb),
  ('70000000-0000-0000-0000-000000000003', 'Adu Pintar Fase Sekolah 2026 - Kategori 3', 1, 3, '2026-05-01', '2026-05-31', 'upcoming', '{"max_games":10}'::jsonb)
on conflict (id) do update
set
  name = excluded.name,
  phase = excluded.phase,
  grade_category = excluded.grade_category,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  status = excluded.status,
  rules = excluded.rules;

-- =========================================================
-- 8) Leaderboard entries (untuk leaderboard Supabase)
-- competition_phase: school | kabkota | provinsi | nasional
-- =========================================================
insert into leaderboard_entries (
  id, student_id, school_id, grade_category, competition_phase, total_score, rank, province, city, period, updated_at
)
values
  -- Kategori 1 (Sekolah & Nasional)
  ('80000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 1, 'school',    120, 2, 'DKI Jakarta', 'Jakarta Selatan', '2026-Q1', now()),
  ('80000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 1, 'school',    180, 1, 'DKI Jakarta', 'Jakarta Selatan', '2026-Q1', now()),
  ('80000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 1, 'kabkota',   120, 4, 'DKI Jakarta', 'Jakarta Selatan', '2026-Q1', now()),
  ('80000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 1, 'kabkota',   180, 2, 'DKI Jakarta', 'Jakarta Selatan', '2026-Q1', now()),
  ('80000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 1, 'provinsi',  120, 6, 'DKI Jakarta', 'Jakarta Selatan', '2026-Q1', now()),
  ('80000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 1, 'provinsi',  180, 3, 'DKI Jakarta', 'Jakarta Selatan', '2026-Q1', now()),
  ('80000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 1, 'nasional',  120, 9, 'DKI Jakarta', 'Jakarta Selatan', '2026-Q1', now()),
  ('80000000-0000-0000-0000-000000000008', '40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 1, 'nasional',  180, 5, 'DKI Jakarta', 'Jakarta Selatan', '2026-Q1', now()),

  -- Kategori 2
  ('80000000-0000-0000-0000-000000000009',  '40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 2, 'school',   340, 2, 'DKI Jakarta', 'Jakarta Selatan', '2026-Q1', now()),
  ('80000000-0000-0000-0000-000000000010', '40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 2, 'school',   410, 1, 'DKI Jakarta', 'Jakarta Selatan', '2026-Q1', now()),
  ('80000000-0000-0000-0000-000000000011', '40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 2, 'nasional', 340, 8, 'DKI Jakarta', 'Jakarta Selatan', '2026-Q1', now()),
  ('80000000-0000-0000-0000-000000000012', '40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 2, 'nasional', 410, 4, 'DKI Jakarta', 'Jakarta Selatan', '2026-Q1', now()),

  -- Kategori 3 (multi sekolah)
  ('80000000-0000-0000-0000-000000000013', '40000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 3, 'kabkota',  530, 1, 'DKI Jakarta', 'Jakarta Selatan', '2026-Q1', now()),
  ('80000000-0000-0000-0000-000000000014', '40000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 3, 'kabkota',  495, 2, 'DKI Jakarta', 'Jakarta Selatan', '2026-Q1', now()),
  ('80000000-0000-0000-0000-000000000015', '40000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', 3, 'kabkota',  620, 1, 'Jawa Barat', 'Bandung', '2026-Q1', now()),
  ('80000000-0000-0000-0000-000000000016', '40000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000002', 3, 'kabkota',  610, 2, 'Jawa Barat', 'Bandung', '2026-Q1', now()),
  ('80000000-0000-0000-0000-000000000017', '40000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000003', 3, 'kabkota',  980, 1, 'Jawa Timur', 'Surabaya', '2026-Q1', now()),
  ('80000000-0000-0000-0000-000000000018', '40000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000003', 3, 'kabkota',  940, 2, 'Jawa Timur', 'Surabaya', '2026-Q1', now()),
  ('80000000-0000-0000-0000-000000000019', '40000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 3, 'provinsi', 530, 5, 'DKI Jakarta', 'Jakarta Selatan', '2026-Q1', now()),
  ('80000000-0000-0000-0000-000000000020', '40000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', 3, 'provinsi', 620, 2, 'Jawa Barat', 'Bandung', '2026-Q1', now()),
  ('80000000-0000-0000-0000-000000000021', '40000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000003', 3, 'provinsi', 980, 1, 'Jawa Timur', 'Surabaya', '2026-Q1', now()),
  ('80000000-0000-0000-0000-000000000022', '40000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 3, 'nasional', 530, 6, 'DKI Jakarta', 'Jakarta Selatan', '2026-Q1', now()),
  ('80000000-0000-0000-0000-000000000023', '40000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 3, 'nasional', 495, 7, 'DKI Jakarta', 'Jakarta Selatan', '2026-Q1', now()),
  ('80000000-0000-0000-0000-000000000024', '40000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', 3, 'nasional', 620, 3, 'Jawa Barat', 'Bandung', '2026-Q1', now()),
  ('80000000-0000-0000-0000-000000000025', '40000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000002', 3, 'nasional', 610, 4, 'Jawa Barat', 'Bandung', '2026-Q1', now()),
  ('80000000-0000-0000-0000-000000000026', '40000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000003', 3, 'nasional', 980, 1, 'Jawa Timur', 'Surabaya', '2026-Q1', now()),
  ('80000000-0000-0000-0000-000000000027', '40000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000003', 3, 'nasional', 940, 2, 'Jawa Timur', 'Surabaya', '2026-Q1', now())
on conflict (id) do update
set
  student_id = excluded.student_id,
  school_id = excluded.school_id,
  grade_category = excluded.grade_category,
  competition_phase = excluded.competition_phase,
  total_score = excluded.total_score,
  rank = excluded.rank,
  province = excluded.province,
  city = excluded.city,
  period = excluded.period,
  updated_at = excluded.updated_at;

commit;
