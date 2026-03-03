export type QuestionDifficulty = "mudah" | "menengah" | "sulit"
export type QuestionGradeCategory = 1 | 2 | 3

export interface Question {
  id: string
  grade: "SD" | "SMP" | "SMA"
  question: string
  options: string[]
  correctAnswer: number
  category: string
  points: number
  explanation: string
  difficulty?: QuestionDifficulty
}

export type CurriculumQuestion = Question & {
  grade_category: QuestionGradeCategory
  difficulty: QuestionDifficulty
  topic: string
  correct_answer: number
}

export const CURRICULUM_TOPICS_BY_GRADE_CATEGORY: Record<QuestionGradeCategory, string[]> = {
  1: [
    "Pengantar Pertanian",
    "Anatomi Tanaman",
    "Kebutuhan Hidup Tanaman",
    "Pangan Harian",
    "Hewan Ternak",
    "Lingkungan",
    "Ilmu Tanah Dasar",
    "Siklus Hidup",
    "Benih & Bibit",
    "Nutrisi (Pupuk)",
    "Air & Irigasi",
    "Hama & Penyakit Tanaman",
    "Teknik Menanam",
  ],
  2: [
    "Fisiologi Tanaman",
    "Manajemen Tanah",
    "Manajemen Air",
    "Hortikultura",
    "Ekonomi Pertanian",
    "Peternakan Lanjutan",
    "Perikanan Dasar",
    "Kimia Tanah",
    "Pemupukan Presisi",
    "Pengendalian Hama Terpadu (PHT)",
    "Mekanisasi Pertanian",
    "Smart Farming",
    "Sistem Intensif Pertanian",
  ],
  3: [
    "Kebun Rumah",
    "Pasca Panen",
    "Pengolahan Hasil Pertanian",
    "Manajemen Sampah",
    "Gizi Keluarga",
    "Teknologi Tepat Guna",
    "Pangan Lokal",
    "Peta Komoditas Pangan",
    "Rantai Pasok Pertanian",
    "Isu Lingkungan",
    "Data Pangan Indonesia",
    "Pengaruh Pangan dengan Sosial Ekonomi",
    "Keamanan Pangan",
    "Profesi dalam Pangan dan Pertanian",
  ],
}

function gradeToGradeCategory(grade: Question["grade"]): QuestionGradeCategory {
  if (grade === "SD") return 1
  if (grade === "SMP") return 2
  return 3
}

function inferDifficultyFromQuestion(question: Question): QuestionDifficulty {
  const text = `${question.question} ${question.category}`.toLowerCase()
  const difficultKeywords = ["analisis", "hitungan", "hitung", "perbandingan", "evaluasi", "strategi", "konsep"]
  const mediumKeywords = ["proses", "mengapa", "bagaimana", "fungsi", "faktor", "dampak"]

  if (difficultKeywords.some((keyword) => text.includes(keyword))) return "sulit"
  if (mediumKeywords.some((keyword) => text.includes(keyword))) return "menengah"

  if (question.points >= 20) return "sulit"
  if (question.points >= 15) return "menengah"
  return "mudah"
}

function inferTopic(question: Question, gradeCategory: QuestionGradeCategory): string {
  const text = `${question.category} ${question.question}`.toLowerCase()

  const topicRules: Array<{ match: string[]; topic: string }> =
    gradeCategory === 1
      ? [
          { match: ["pupuk", "kompos", "nutrisi"], topic: "Nutrisi (Pupuk)" },
          { match: ["air", "irigasi", "menyiram"], topic: "Air & Irigasi" },
          { match: ["hama", "pestisida"], topic: "Hama & Penyakit Tanaman" },
          { match: ["peternakan", "ayam", "ternak"], topic: "Hewan Ternak" },
          { match: ["alat", "cangkul", "traktor", "sabit"], topic: "Teknik Menanam" },
          { match: ["akar", "batang", "daun", "bunga", "fotosintesis"], topic: "Anatomi Tanaman" },
          { match: ["tanah", "mulsa"], topic: "Ilmu Tanah Dasar" },
          { match: ["bibit", "benih", "stek", "vegetatif"], topic: "Benih & Bibit" },
          { match: ["buah", "sayur", "pangan", "makanan"], topic: "Pangan Harian" },
          { match: ["lingkungan"], topic: "Lingkungan" },
          { match: ["hidup", "tumbuh", "matahari"], topic: "Kebutuhan Hidup Tanaman" },
        ]
      : gradeCategory === 2
        ? [
            { match: ["hortikultura"], topic: "Hortikultura" },
            { match: ["hidroponik", "smart", "rumah kaca", "greenhouse"], topic: "Smart Farming" },
            { match: ["irigasi", "air"], topic: "Manajemen Air" },
            { match: ["hama", "pestisida"], topic: "Pengendalian Hama Terpadu (PHT)" },
            { match: ["transplanter", "mekanis", "alat panen", "traktor", "sabit"], topic: "Mekanisasi Pertanian" },
            { match: ["avikultur", "peternakan", "ayam"], topic: "Peternakan Lanjutan" },
            { match: ["kompos", "limbah"], topic: "Manajemen Tanah" },
            { match: ["panen", "produksi", "ketahanan pangan"], topic: "Sistem Intensif Pertanian" },
            { match: ["fotosintesis", "reproduksi", "tanaman"], topic: "Fisiologi Tanaman" },
            { match: ["organisasi", "fao", "kebijakan"], topic: "Ekonomi Pertanian" },
          ]
        : [
            { match: ["lingkungan", "berkelanjutan", "kimia berlebihan"], topic: "Isu Lingkungan" },
            { match: ["drone", "iot", "teknologi", "presisi"], topic: "Teknologi Tepat Guna" },
            { match: ["food estate", "kebijakan", "rantai", "perdagangan"], topic: "Rantai Pasok Pertanian" },
            { match: ["bioenergi"], topic: "Pengolahan Hasil Pertanian" },
            { match: ["mangga", "ekspor", "komoditas"], topic: "Peta Komoditas Pangan" },
            { match: ["organik", "pangan"], topic: "Keamanan Pangan" },
            { match: ["brin", "institusi", "profesi"], topic: "Profesi dalam Pangan dan Pertanian" },
            { match: ["pasca panen", "panen"], topic: "Pasca Panen" },
          ]

  const matchedRule = topicRules.find((rule) => rule.match.some((keyword) => text.includes(keyword)))
  if (matchedRule) return matchedRule.topic

  return CURRICULUM_TOPICS_BY_GRADE_CATEGORY[gradeCategory][0]
}

function classifyQuestion(question: Question): CurriculumQuestion {
  const gradeCategory = gradeToGradeCategory(question.grade)
  return {
    ...question,
    grade_category: gradeCategory,
    difficulty: question.difficulty ?? inferDifficultyFromQuestion(question),
    topic: inferTopic(question, gradeCategory),
    correct_answer: question.correctAnswer,
  }
}

const questionsDB: Question[] = [
  // ============ SD LEVEL (15 Questions) ============
  {
    id: "sd-1",
    grade: "SD",
    question: "Apa nama alat yang digunakan petani untuk membajak sawah?",
    options: ["Cangkul", "Traktor", "Sekop", "Parang"],
    correctAnswer: 1,
    category: "Alat Pertanian",
    points: 10,
    explanation:
      "Traktor adalah alat modern yang digunakan untuk membajak sawah dengan lebih efisien dibandingkan alat manual.",
    difficulty: "mudah",
  },
  {
    id: "sd-2",
    grade: "SD",
    question: "Tanaman padi biasanya tumbuh di?",
    options: ["Gunung", "Sawah", "Hutan", "Sungai"],
    correctAnswer: 1,
    category: "Habitat Tanaman",
    points: 10,
    explanation: "Padi membutuhkan genangan air, sehingga tumbuh optimal di sawah yang memiliki pasokan air berlimpah.",
    difficulty: "mudah",
  },
  {
    id: "sd-3",
    grade: "SD",
    question: "Sayuran seperti wortel tumbuh di bagian?",
    options: ["Daun", "Akar", "Batang", "Bunga"],
    correctAnswer: 1,
    category: "Bagian Tanaman",
    points: 10,
    explanation: "Wortel adalah sayuran akar yang tumbuh di dalam tanah sebagai penyimpan nutrisi.",
    difficulty: "mudah",
  },
  {
    id: "sd-4",
    grade: "SD",
    question: "Ayam termasuk hewan yang diternakkan untuk diambil?",
    options: ["Daging dan telur", "Susu", "Kulit", "Bulu"],
    correctAnswer: 0,
    category: "Peternakan",
    points: 10,
    explanation: "Ayam adalah peternakan utama yang menghasilkan daging berkualitas dan telur sebagai sumber protein.",
    difficulty: "mudah",
  },
  {
    id: "sd-5",
    grade: "SD",
    question: "Petani menyiram tanaman agar?",
    options: ["Kering", "Layu", "Subur", "Cepat dipanen"],
    correctAnswer: 2,
    category: "Perawatan Tanaman",
    points: 10,
    explanation: "Penyiraman memberikan air yang tanaman butuhkan untuk fotosintesis dan pertumbuhan yang subur.",
    difficulty: "mudah",
  },
  {
    id: "sd-6",
    grade: "SD",
    question: "Sayuran berikut yang berwarna hijau adalah?",
    options: ["Tomat", "Wortel", "Bayam", "Terong ungu"],
    correctAnswer: 2,
    category: "Jenis Sayuran",
    points: 10,
    explanation: "Bayam adalah sayuran hijau yang kaya akan klorofil dan nutrisi penting untuk kesehatan.",
    difficulty: "mudah",
  },
  {
    id: "sd-7",
    grade: "SD",
    question: "Yang bukan alat pertanian adalah?",
    options: ["Sabit", "Cangkul", "Obeng", "Traktor"],
    correctAnswer: 2,
    category: "Alat Pertanian",
    points: 10,
    explanation: "Obeng adalah alat mekanik untuk memperbaiki mesin, bukan alat pertanian tradisional.",
    difficulty: "mudah",
  },
  {
    id: "sd-8",
    grade: "SD",
    question: "Tanaman butuh sinar matahari untuk?",
    options: ["Bernapas", "Berjalan", "Fotosintesis", "Berkembang biak"],
    correctAnswer: 2,
    category: "Biologi Tanaman",
    points: 10,
    explanation: "Fotosintesis adalah proses mengubah cahaya matahari menjadi energi kimia untuk pertumbuhan tanaman.",
    difficulty: "mudah",
  },
  {
    id: "sd-9",
    grade: "SD",
    question: "Hasil perkebunan yang biasa dibuat menjadi minuman adalah?",
    options: ["Kopi", "Jagung", "Gandum", "Padi"],
    correctAnswer: 0,
    category: "Tanaman Perkebunan",
    points: 10,
    explanation: "Kopi adalah komoditas perkebunan utama yang diproses menjadi minuman populer di seluruh dunia.",
    difficulty: "mudah",
  },
  {
    id: "sd-10",
    grade: "SD",
    question: "Alat sederhana untuk menyiram tanaman adalah?",
    options: ["Ember", "Semprotan air", "Piring", "Kipas angin"],
    correctAnswer: 1,
    category: "Alat Pertanian",
    points: 10,
    explanation: "Semprotan air adalah alat efisien untuk menyiram tanaman dengan air yang terdistribusi merata.",
    difficulty: "mudah",
  },
  {
    id: "sd-11",
    grade: "SD",
    question: "Kegiatan menanam dan memelihara tanaman disebut?",
    options: ["Bertani", "Berdagang", "Berternak", "Menjual"],
    correctAnswer: 0,
    category: "Istilah Pertanian",
    points: 10,
    explanation: "Bertani adalah kegiatan utama dalam pertanian yang meliputi penanaman dan pemeliharaan tanaman.",
    difficulty: "mudah",
  },
  {
    id: "sd-12",
    grade: "SD",
    question: "Buah yang tumbuh merambat adalah?",
    options: ["Mangga", "Semangka", "Apel", "Jeruk"],
    correctAnswer: 1,
    category: "Jenis Buah",
    points: 10,
    explanation: "Semangka adalah buah yang tumbuh merambat di tanah dengan batang yang panjang dan fleksibel.",
    difficulty: "mudah",
  },
  {
    id: "sd-13",
    grade: "SD",
    question: "Tanaman yang menghasilkan umbi adalah?",
    options: ["Jagung", "Singkong", "Padi", "Tomat"],
    correctAnswer: 1,
    category: "Jenis Tanaman",
    points: 10,
    explanation: "Singkong menghasilkan umbi yang dapat dimakan dan kaya akan karbohidrat.",
    difficulty: "mudah",
  },
  {
    id: "sd-14",
    grade: "SD",
    question: "Sayur yang bisa dimakan mentah adalah?",
    options: ["Terong", "Kangkung", "Tomat", "Labu"],
    correctAnswer: 2,
    category: "Jenis Sayuran",
    points: 10,
    explanation: "Tomat dapat dimakan mentah karena sudah matang dan aman dikonsumsi tanpa perlu dimasak.",
    difficulty: "mudah",
  },
  {
    id: "sd-15",
    grade: "SD",
    question: "Jenis pupuk alami adalah?",
    options: ["Kompos", "Plastik", "Pasir", "Besi"],
    correctAnswer: 0,
    category: "Pupuk",
    points: 10,
    explanation: "Kompos adalah pupuk alami yang dibuat dari sampah organik dan bermanfaat menyuburkan tanah.",
    difficulty: "mudah",
  },

  // ============ SMP LEVEL (20 Questions) ============
  {
    id: "smp-1",
    grade: "SMP",
    question: "Unsur utama yang dibutuhkan tanaman untuk fotosintesis adalah?",
    options: ["Nitrogen", "Karbon dioksida", "Oksigen", "Gas mulia"],
    correctAnswer: 1,
    category: "Biologi Tumbuhan",
    points: 15,
    explanation: "Karbon dioksida (CO2) adalah bahan utama yang diambil dari udara untuk proses fotosintesis.",
    difficulty: "menengah",
  },
  {
    id: "smp-2",
    grade: "SMP",
    question: "Pestisida digunakan untuk?",
    options: ["Mempercepat panen", "Membasmi hama", "Menyuburkan tanah", "Memperkuat batang"],
    correctAnswer: 1,
    category: "Perlindungan Tanaman",
    points: 15,
    explanation: "Pestisida adalah zat kimia untuk membunuh serangga pengganggu dan hama tanaman.",
    difficulty: "menengah",
  },
  {
    id: "smp-3",
    grade: "SMP",
    question: "Sistem irigasi tetes banyak digunakan pada?",
    options: ["Tanaman padi", "Tanaman sayur", "Tanaman kaktus", "Tanaman hidroponik"],
    correctAnswer: 3,
    category: "Teknologi Irigasi",
    points: 15,
    explanation:
      "Irigasi tetes ideal untuk hidroponik karena efisien dalam mengalirkan air dan nutrisi secara langsung.",
    difficulty: "menengah",
  },
  {
    id: "smp-4",
    grade: "SMP",
    question: "Alat panen padi tradisional adalah?",
    options: ["Cangkul", "Traktor", "Sabit", "Sekop"],
    correctAnswer: 2,
    category: "Alat Pertanian",
    points: 15,
    explanation: "Sabit adalah alat tradisional yang masih banyak digunakan untuk memotong batang padi saat panen.",
    difficulty: "menengah",
  },
  {
    id: "smp-5",
    grade: "SMP",
    question: "Fungsi mulsa plastik hitam perak adalah?",
    options: ["Menyuburkan tanaman", "Menahan gulma dan menjaga kelembaban tanah", "Menarik serangga", "Menyaring air"],
    correctAnswer: 1,
    category: "Teknik Budidaya",
    points: 15,
    explanation: "Mulsa membantu mengurangi pertumbuhan gulma dan menjaga kelembaban tanah agar stabil.",
    difficulty: "menengah",
  },
  {
    id: "smp-6",
    grade: "SMP",
    question: "Tanaman yang berkembang biak secara vegetatif alami adalah?",
    options: ["Padi", "Jagung", "Jahe", "Kacang"],
    correctAnswer: 2,
    category: "Reproduksi Tanaman",
    points: 15,
    explanation: "Jahe berkembang biak melalui umbi yang tumbuh di dalam tanah (vegetatif alami).",
    difficulty: "menengah",
  },
  {
    id: "smp-7",
    grade: "SMP",
    question: "Salah satu ciri tanaman hortikultura adalah?",
    options: ["Tanaman musiman", "Tanaman keras", "Tanaman pangan pokok", "Tidak berbuah"],
    correctAnswer: 0,
    category: "Hortikultura",
    points: 15,
    explanation: "Tanaman hortikultura umumnya musiman dan memerlukan perawatan khusus untuk hasil optimal.",
    difficulty: "menengah",
  },
  {
    id: "smp-8",
    grade: "SMP",
    question: "Sayuran yang banyak mengandung vitamin A adalah?",
    options: ["Kentang", "Wortel", "Tomat", "Terong"],
    correctAnswer: 1,
    category: "Nutrisi Sayuran",
    points: 15,
    explanation: "Wortel kaya akan beta-karoten yang diubah menjadi vitamin A oleh tubuh.",
    difficulty: "menengah",
  },
  {
    id: "smp-9",
    grade: "SMP",
    question: "Teknik stek biasanya digunakan untuk?",
    options: ["Tumbuhan lumut", "Tanaman keras seperti mawar atau singkong", "Tanaman air", "Tumbuhan paku"],
    correctAnswer: 1,
    category: "Propagasi Tanaman",
    points: 15,
    explanation: "Stek adalah teknik perbanyakan vegetatif yang cocok untuk tanaman keras untuk menjaga sifat induk.",
    difficulty: "menengah",
  },
  {
    id: "smp-10",
    grade: "SMP",
    question: "Peternakan ayam disebut juga?",
    options: ["Avikultur", "Florikultur", "Vitikultur", "Apikultur"],
    correctAnswer: 0,
    category: "Istilah Peternakan",
    points: 15,
    explanation: "Avikultur adalah ilmu yang mempelajari pemeliharaan unggas, khususnya ayam.",
    difficulty: "menengah",
  },
  {
    id: "smp-11",
    grade: "SMP",
    question: "Teknik hidroponik menggunakan?",
    options: ["Tanah", "Pasir", "Air dan nutrisi", "Abu"],
    correctAnswer: 2,
    category: "Sistem Budidaya",
    points: 15,
    explanation: "Hidroponik adalah sistem pertanian tanpa tanah menggunakan air bernutrisi untuk menanam tanaman.",
    difficulty: "menengah",
  },
  {
    id: "smp-12",
    grade: "SMP",
    question: "Limbah pertanian organik bisa dimanfaatkan sebagai?",
    options: ["Plastik", "Kompos", "Batu bata", "Semen"],
    correctAnswer: 1,
    category: "Daur Ulang",
    points: 15,
    explanation: "Limbah organik dapat dikomposkan menjadi pupuk alami yang bermanfaat untuk pertumbuhan tanaman.",
    difficulty: "menengah",
  },
  {
    id: "smp-13",
    grade: "SMP",
    question: "Faktor yang tidak mempengaruhi hasil panen?",
    options: ["Cuaca", "Pupuk", "Warna tanaman", "Hama"],
    correctAnswer: 2,
    category: "Faktor Produksi",
    points: 15,
    explanation:
      "Warna tanaman bukan faktor utama yang mempengaruhi hasil panen, tapi cuaca, pupuk, dan hama sangat mempengaruhi.",
    difficulty: "menengah",
  },
  {
    id: "smp-14",
    grade: "SMP",
    question: "Tanaman jagung dipanen saat?",
    options: ["Daunnya tumbuh", "Tongkol menguning dan mengering", "Tanaman mulai berbunga", "Baru ditanam"],
    correctAnswer: 1,
    category: "Panen",
    points: 15,
    explanation: "Jagung dipanen ketika tongkol sudah matang sempurna (menguning dan mengering) untuk hasil optimal.",
    difficulty: "menengah",
  },
  {
    id: "smp-15",
    grade: "SMP",
    question: "Alat modern untuk menanam padi secara otomatis disebut?",
    options: ["Hand tractor", "Transplanter", "Seeder", "Plow"],
    correctAnswer: 1,
    category: "Mekanis Pertanian",
    points: 15,
    explanation: "Transplanter adalah mesin yang secara otomatis menanam bibit padi dalam baris yang rapi dan teratur.",
    difficulty: "menengah",
  },
  {
    id: "smp-16",
    grade: "SMP",
    question: "Fungsi rumah kaca dalam pertanian adalah?",
    options: ["Menyerap hujan", "Mengontrol suhu dan cahaya", "Menarik burung", "Menurunkan suhu"],
    correctAnswer: 1,
    category: "Infrastruktur Pertanian",
    points: 15,
    explanation:
      "Rumah kaca menciptakan iklim mikro yang terkontrol untuk pertumbuhan tanaman optimal sepanjang tahun.",
    difficulty: "menengah",
  },
  {
    id: "smp-17",
    grade: "SMP",
    question: "Program pemerintah untuk ketahanan pangan disebut?",
    options: ["Upsus Pajale", "Swasembada Garam", "Reforma Agraria", "Green Economy"],
    correctAnswer: 0,
    category: "Kebijakan Pertanian",
    points: 15,
    explanation:
      "Upsus Pajale (Upaya Khusus Padi Jagung Kedelai) adalah program pemerintah untuk meningkatkan produksi pangan.",
    difficulty: "menengah",
  },
  {
    id: "smp-18",
    grade: "SMP",
    question: "Padi dan jagung termasuk dalam kelompok?",
    options: ["Legum", "Umbi", "Serealia", "Sayuran"],
    correctAnswer: 2,
    category: "Klasifikasi Tanaman",
    points: 15,
    explanation: "Serealia adalah kelompok tanaman yang termasuk padi, jagung, dan gandum yang menghasilkan biji.",
    difficulty: "menengah",
  },
  {
    id: "smp-19",
    grade: "SMP",
    question: "Tanaman cabai termasuk dalam?",
    options: ["Sayuran buah", "Sayuran akar", "Sayuran daun", "Tanaman keras"],
    correctAnswer: 0,
    category: "Klasifikasi Sayuran",
    points: 15,
    explanation: "Cabai adalah sayuran buah karena bagian yang dimakan adalah buah dari tanaman tersebut.",
    difficulty: "menengah",
  },
  {
    id: "smp-20",
    grade: "SMP",
    question: "Organisasi pangan dunia adalah?",
    options: ["WHO", "FAO", "UNICEF", "IMF"],
    correctAnswer: 1,
    category: "Organisasi Internasional",
    points: 15,
    explanation:
      "FAO (Food and Agriculture Organization) adalah lembaga PBB yang mengurus isu pangan dan pertanian dunia.",
    difficulty: "menengah",
  },

  // ============ SMA LEVEL (15 Questions) ============
  {
    id: "sma-1",
    grade: "SMA",
    question: "Teknologi pertanian presisi menggunakan bantuan?",
    options: ["GPS dan sensor tanah", "Radio dan kompas", "Manual dan tradisional", "Ramalan cuaca"],
    correctAnswer: 0,
    category: "Pertanian Teknologi",
    points: 20,
    explanation: "Pertanian presisi menggunakan GPS dan sensor untuk mengoptimalkan penggunaan input secara efisien.",
    difficulty: "sulit",
  },
  {
    id: "sma-2",
    grade: "SMA",
    question: "Salah satu dampak negatif penggunaan pupuk kimia berlebihan adalah?",
    options: [
      "Menambah kesuburan tanah",
      "Meningkatkan hasil panen terus menerus",
      "Menurunnya kualitas tanah dan pencemaran air",
      "Meningkatkan jumlah serangga",
    ],
    correctAnswer: 2,
    category: "Dampak Lingkungan",
    points: 20,
    explanation: "Pupuk kimia berlebih menyebabkan degradasi tanah dan eutrofikasi air yang merugikan lingkungan.",
    difficulty: "sulit",
  },
  {
    id: "sma-3",
    grade: "SMA",
    question: "Konsep pertanian berkelanjutan mencakup?",
    options: ["Peningkatan hasil saja", "Hanya pertumbuhan ekonomi", "Ekologi, ekonomi, dan sosial", "Inovasi pupuk"],
    correctAnswer: 2,
    category: "Pertanian Berkelanjutan",
    points: 20,
    explanation: "Pertanian berkelanjutan menyeimbangkan ketiga pilar: lingkungan, ekonomi, dan kesejahteraan sosial.",
    difficulty: "sulit",
  },
  {
    id: "sma-4",
    grade: "SMA",
    question: "Reproduksi vegetatif buatan seperti okulasi digunakan pada tanaman?",
    options: ["Tomat", "Jeruk", "Padi", "Kangkung"],
    correctAnswer: 1,
    category: "Bioteknologi",
    points: 20,
    explanation:
      "Okulasi adalah teknik perbanyakan untuk tanaman jeruk dengan menggabungkan mata tunas pada batang bawah.",
    difficulty: "sulit",
  },
  {
    id: "sma-5",
    grade: "SMA",
    question: "Fungsi nitrogen (N) pada tanaman adalah?",
    options: ["Meningkatkan bunga", "Menguatkan akar", "Meningkatkan pertumbuhan daun", "Mencegah penyakit"],
    correctAnswer: 2,
    category: "Nutrisi Tanaman",
    points: 20,
    explanation:
      "Nitrogen adalah komponen utama klorofil dan protein yang penting untuk pertumbuhan vegetatif tanaman.",
    difficulty: "sulit",
  },
  {
    id: "sma-6",
    grade: "SMA",
    question: "Rotasi tanaman penting untuk?",
    options: [
      "Menyuburkan kembali tanah dan mencegah hama",
      "Meningkatkan pestisida",
      "Mempercepat panen",
      "Menghilangkan gulma",
    ],
    correctAnswer: 0,
    category: "Manajemen Pertanian",
    points: 20,
    explanation: "Rotasi tanaman mengembalikan kesuburan tanah dan memutus siklus hama serta penyakit tanaman.",
    difficulty: "sulit",
  },
  {
    id: "sma-7",
    grade: "SMA",
    question: "Salah satu sistem pertanian konservasi adalah?",
    options: ["Tumpangsari", "Monokultur", "Hidroponik", "Akuaponik"],
    correctAnswer: 0,
    category: "Sistem Budidaya",
    points: 20,
    explanation:
      "Tumpangsari adalah pertanian konservasi yang menggabungkan beberapa tanaman untuk efisiensi sumber daya.",
    difficulty: "sulit",
  },
  {
    id: "sma-8",
    grade: "SMA",
    question: "Teknologi Internet of Things (IoT) dalam pertanian bisa digunakan untuk?",
    options: ["Membajak manual", "Memantau kelembaban tanah secara otomatis", "Menjual produk", "Menebang pohon"],
    correctAnswer: 1,
    category: "Smart Farming",
    points: 20,
    explanation: "IoT dalam pertanian menggunakan sensor untuk monitoring real-time kondisi lahan dan otomasi irigasi.",
    difficulty: "sulit",
  },
  {
    id: "sma-9",
    grade: "SMA",
    question: "Salah satu contoh tanaman bioenergi adalah?",
    options: ["Singkong", "Anggrek", "Melati", "Teh"],
    correctAnswer: 0,
    category: "Bioenergi",
    points: 20,
    explanation: "Singkong dapat diubah menjadi bioethanol sebagai sumber energi terbarukan untuk bahan bakar.",
    difficulty: "sulit",
  },
  {
    id: "sma-10",
    grade: "SMA",
    question: "Fungsi drone dalam pertanian?",
    options: ["Menabur pupuk dan memantau lahan dari udara", "Memanen hasil", "Membajak sawah", "Mengolah tanah"],
    correctAnswer: 0,
    category: "Teknologi Drone",
    points: 20,
    explanation: "Drone pertanian dapat menabur pupuk dan pestisida serta memetakan lahan untuk analisis presisi.",
    difficulty: "sulit",
  },
  {
    id: "sma-11",
    grade: "SMA",
    question: "Konsep food estate adalah?",
    options: ["Pertanian kota", "Lahan pertanian skala besar terpadu", "Pasar petani", "Produk organik"],
    correctAnswer: 1,
    category: "Kebijakan Pertanian",
    points: 20,
    explanation:
      "Food estate adalah pengembangan lahan pertanian besar yang terintegrasi untuk ketahanan pangan nasional.",
    difficulty: "sulit",
  },
  {
    id: "sma-12",
    grade: "SMA",
    question: "Komoditas ekspor hortikultura Indonesia yang utama adalah?",
    options: ["Kentang", "Durian", "Mangga", "Cabai"],
    correctAnswer: 2,
    category: "Perdagangan Pertanian",
    points: 20,
    explanation: "Mangga adalah komoditas hortikultura ekspor utama Indonesia yang diminati pasar internasional.",
    difficulty: "sulit",
  },
  {
    id: "sma-13",
    grade: "SMA",
    question: "Kelebihan pertanian organik adalah?",
    options: ["Hasil lebih cepat panen", "Harga murah", "Ramah lingkungan dan bebas bahan kimia", "Mengandalkan mesin"],
    correctAnswer: 2,
    category: "Pertanian Organik",
    points: 20,
    explanation:
      "Pertanian organik menghindari bahan kimia sintetis sehingga lebih berkelanjutan dan ramah lingkungan.",
    difficulty: "sulit",
  },
  {
    id: "sma-14",
    grade: "SMA",
    question: "Lembaga riset pertanian nasional Indonesia adalah?",
    options: ["BRIN", "IPB", "Kementan", "FAO"],
    correctAnswer: 0,
    category: "Institusi Pertanian",
    points: 20,
    explanation:
      "BRIN (Badan Riset dan Inovasi Nasional) adalah lembaga riset utama Indonesia untuk inovasi pertanian.",
    difficulty: "sulit",
  },
  {
    id: "sma-15",
    grade: "SMA",
    question: "Tanaman yang diperbanyak dengan kultur jaringan disebut?",
    options: ["Tomat", "Anggrek", "Bayam", "Jagung"],
    correctAnswer: 1,
    category: "Bioteknologi",
    points: 20,
    explanation:
      "Anggrek sering diperbanyak dengan kultur jaringan untuk menghasilkan tanaman yang identik dengan induk.",
    difficulty: "sulit",
  },
]

export function getQuestionsByGrade(grade: "SD" | "SMP" | "SMA", count = 10): Question[] {
  const filtered = questionsDB.filter((q) => q.grade === grade)
  const shuffled = [...filtered]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = shuffled[i]
    shuffled[i] = shuffled[j]
    shuffled[j] = tmp
  }
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

export function getQuestionById(id: string): Question | undefined {
  return questionsDB.find((q) => q.id === id)
}

export function getAllQuestions(): Question[] {
  return questionsDB
}

export function getQuestionsByCategory(grade: "SD" | "SMP" | "SMA", category: string): Question[] {
  return questionsDB.filter((q) => q.grade === grade && q.category === category)
}

export function getAllQuestionsWithCurriculumMetadata(): CurriculumQuestion[] {
  return questionsDB.map(classifyQuestion)
}

export function getQuestionsByGradeCategoryForSeed(gradeCategory: QuestionGradeCategory): CurriculumQuestion[] {
  return getAllQuestionsWithCurriculumMetadata().filter((question) => question.grade_category === gradeCategory)
}
