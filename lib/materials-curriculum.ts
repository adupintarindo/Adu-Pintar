export type MaterialGradeCategory = 1 | 2 | 3

export type MaterialSectionKey =
  | "story"
  | "content"
  | "vocabulary"
  | "activity"
  | "quiz"
  | "habits"
  | "learningMap"

export type MaterialVocabulary = {
  word: string
  definition: string
}

export type MaterialActivity =
  | {
      id: string
      type: "match"
      prompt: string
      pairs: Array<{ left: string; right: string }>
    }
  | {
      id: string
      type: "fill"
      prompt: string
      sentenceTemplate: string
      answer: string
      hint: string
    }
  | {
      id: string
      type: "tap"
      prompt: string
      options: string[]
      correctOption: string
      explanation: string
    }

export type MaterialQuizQuestion = {
  id: string
  prompt: string
  options: string[]
  correctIndex: number
  explanation: string
}

export type CurriculumModule = {
  id: string
  title: string
  topic: string
  gradeCategory: MaterialGradeCategory
  summary: string
  coverImage: string
  estimatedMinutes: number
  shortStory: string
  mainContent: Array<{ title: string; body: string }>
  vocabulary: MaterialVocabulary[]
  activities: MaterialActivity[]
  quiz: MaterialQuizQuestion[]
  goodHabits: string[]
  learningMap: string[]
}

export type MaterialsProgressEntry = {
  completedSectionIds: MaterialSectionKey[]
  habitsChecked: string[]
  learningMapChecked: string[]
  quizAnsweredIds: string[]
  quizCorrectCount: number
  completedAt?: string
  expClaimed?: boolean
  awardedExp?: number
  expMessage?: string
}

export type MaterialsProgressStore = Record<string, MaterialsProgressEntry>

export const MATERIAL_PROGRESS_STORAGE_KEY = "adupintar:materials:progress:v1"

export const MATERIAL_SECTION_KEYS: readonly MaterialSectionKey[] = [
  "story",
  "content",
  "vocabulary",
  "activity",
  "quiz",
  "habits",
  "learningMap",
] as const

export function getGradeCategoryLabel(gradeCategory: MaterialGradeCategory) {
  if (gradeCategory === 1) return "Kelas 1-2"
  if (gradeCategory === 2) return "Kelas 3-4"
  return "Kelas 5-6"
}

export function getGradeCategoryColor(gradeCategory: MaterialGradeCategory) {
  if (gradeCategory === 1) return "bg-primary/10 text-primary border-primary/20"
  if (gradeCategory === 2) return "bg-accent/10 text-accent-foreground border-accent/20"
  return "bg-secondary/10 text-secondary-foreground border-secondary/20"
}

export function getModuleSectionCount() {
  return MATERIAL_SECTION_KEYS.length
}

const curriculumModules: CurriculumModule[] = [
  {
    id: "mod-pengantar-pertanian",
    title: "Pengantar Pertanian di Sekitar Kita",
    topic: "Pengantar Pertanian",
    gradeCategory: 1,
    summary: "Mengenal peran petani, hasil pertanian, dan hubungan pertanian dengan kebutuhan harian keluarga.",
    coverImage: "/topics/crops.jpg",
    estimatedMinutes: 20,
    shortStory:
      "Rara membantu ibu berbelanja ke pasar. Ia melihat beras, sayur, telur, dan buah. Rara lalu bertanya: dari mana semua makanan itu berasal dan siapa yang bekerja menyiapkannya?",
    mainContent: [
      {
        title: "Apa Itu Pertanian?",
        body: "Pertanian adalah kegiatan menanam, merawat, dan memanen tanaman atau memelihara hewan untuk menghasilkan pangan serta bahan penting lainnya.",
      },
      {
        title: "Hasil Pertanian Dalam Hidup Kita",
        body: "Beras, jagung, sayur, buah, telur, dan susu adalah contoh hasil yang dekat dengan kehidupan sehari-hari. Kita mengonsumsi hasil pertanian setiap hari.",
      },
      {
        title: "Mengapa Petani Penting?",
        body: "Petani bekerja dari menyiapkan lahan, menanam, menyiram, hingga panen. Menghargai makanan berarti menghargai kerja keras petani dan alam.",
      },
    ],
    vocabulary: [
      { word: "Petani", definition: "Orang yang bekerja menanam dan merawat tanaman." },
      { word: "Panen", definition: "Kegiatan mengambil hasil tanaman yang sudah siap." },
      { word: "Pangan", definition: "Makanan yang dibutuhkan tubuh untuk hidup." },
      { word: "Irigasi", definition: "Sistem pengairan untuk membantu tanaman mendapat air." },
    ],
    activities: [
      {
        id: "a1",
        type: "match",
        prompt: "Cocokkan istilah dengan artinya",
        pairs: [
          { left: "Panen", right: "Mengambil hasil tanaman" },
          { left: "Petani", right: "Orang yang menanam dan merawat" },
          { left: "Pangan", right: "Makanan untuk kebutuhan tubuh" },
        ],
      },
      {
        id: "a2",
        type: "fill",
        prompt: "Isi kata yang hilang",
        sentenceTemplate: "Beras berasal dari tanaman ____.",
        answer: "padi",
        hint: "Tanaman yang ditanam di sawah",
      },
      {
        id: "a3",
        type: "tap",
        prompt: "Klik pilihan yang termasuk hasil pertanian",
        options: ["Sayur bayam", "Remote TV", "Sepatu sekolah", "Baterai"],
        correctOption: "Sayur bayam",
        explanation: "Bayam adalah hasil pertanian tanaman sayur.",
      },
    ],
    quiz: [
      {
        id: "q1",
        prompt: "Orang yang bekerja menanam dan merawat tanaman disebut?",
        options: ["Dokter", "Petani", "Pilot", "Nelayan"],
        correctIndex: 1,
        explanation: "Petani bertugas menanam, merawat, dan memanen hasil pertanian.",
      },
      {
        id: "q2",
        prompt: "Beras yang kita makan berasal dari?",
        options: ["Kelapa", "Padi", "Mangga", "Cabai"],
        correctIndex: 1,
        explanation: "Beras adalah hasil olahan dari padi.",
      },
      {
        id: "q3",
        prompt: "Kegiatan mengambil hasil tanaman yang siap disebut?",
        options: ["Menyiram", "Menanam", "Panen", "Membajak"],
        correctIndex: 2,
        explanation: "Panen dilakukan saat hasil tanaman sudah siap diambil.",
      },
      {
        id: "q4",
        prompt: "Mengapa kita perlu menghargai makanan?",
        options: [
          "Karena makanan muncul sendiri",
          "Karena hasil kerja keras petani",
          "Karena makanan tidak penting",
          "Karena semua makanan dari pabrik",
        ],
        correctIndex: 1,
        explanation: "Makanan berasal dari proses panjang dan kerja keras banyak orang.",
      },
      {
        id: "q5",
        prompt: "Contoh hasil pertanian yang sering ada di pasar adalah?",
        options: ["Pensil", "Televisi", "Wortel", "Sepeda"],
        correctIndex: 2,
        explanation: "Wortel adalah sayuran hasil pertanian.",
      },
    ],
    goodHabits: [
      "Menghabiskan makanan sesuai kemampuan",
      "Mencuci tangan sebelum makan",
      "Mengucapkan terima kasih kepada orang yang menyiapkan makanan",
      "Tidak membuang makanan sembarangan",
    ],
    learningMap: [
      "Mengenal arti pertanian",
      "Menyebutkan minimal 3 hasil pertanian",
      "Menjelaskan arti panen",
      "Memahami alasan menghargai makanan",
      "Menyelesaikan latihan soal modul",
    ],
  },
  {
    id: "mod-kebutuhan-tanaman",
    title: "Kebutuhan Hidup Tanaman",
    topic: "Kebutuhan Hidup Tanaman",
    gradeCategory: 1,
    summary: "Belajar tentang air, cahaya matahari, udara, dan tanah sebagai kebutuhan utama pertumbuhan tanaman.",
    coverImage: "/topics/environment.jpg",
    estimatedMinutes: 22,
    shortStory:
      "Di kebun sekolah, tanaman cabai milik kelas A terlihat layu. Guru mengajak siswa mengamati: apakah tanaman kurang air, kurang cahaya, atau tanahnya terlalu keras?",
    mainContent: [
      {
        title: "Empat Kebutuhan Dasar",
        body: "Tanaman membutuhkan air, cahaya matahari, udara, dan tanah/media tanam agar tumbuh sehat.",
      },
      {
        title: "Peran Air dan Cahaya",
        body: "Air membantu membawa nutrisi ke seluruh bagian tanaman. Cahaya matahari membantu tanaman membuat makanan melalui fotosintesis.",
      },
      {
        title: "Tanda Tanaman Tidak Sehat",
        body: "Daun menguning, layu, atau pertumbuhan lambat bisa menjadi tanda kebutuhan tanaman belum terpenuhi.",
      },
    ],
    vocabulary: [
      { word: "Fotosintesis", definition: "Proses tanaman membuat makanan dengan bantuan cahaya." },
      { word: "Layu", definition: "Kondisi tanaman kekurangan air atau tidak sehat." },
      { word: "Nutrisi", definition: "Zat yang dibutuhkan tanaman untuk tumbuh." },
      { word: "Media tanam", definition: "Tempat tanaman tumbuh, seperti tanah atau campuran lain." },
    ],
    activities: [
      {
        id: "a1",
        type: "match",
        prompt: "Cocokkan kebutuhan tanaman dengan fungsinya",
        pairs: [
          { left: "Air", right: "Membantu tanaman tidak layu" },
          { left: "Matahari", right: "Membantu fotosintesis" },
          { left: "Tanah", right: "Tempat akar tumbuh" },
        ],
      },
      {
        id: "a2",
        type: "fill",
        prompt: "Lengkapi kalimat",
        sentenceTemplate: "Tanaman membutuhkan cahaya ____ untuk fotosintesis.",
        answer: "matahari",
        hint: "Sumber cahaya alami di siang hari",
      },
      {
        id: "a3",
        type: "tap",
        prompt: "Klik tanda tanaman yang kekurangan air",
        options: ["Daun segar", "Daun layu", "Batang kuat", "Tunas baru"],
        correctOption: "Daun layu",
        explanation: "Daun layu sering muncul saat tanaman kekurangan air.",
      },
    ],
    quiz: [
      {
        id: "q1",
        prompt: "Tanaman membutuhkan cahaya matahari untuk?",
        options: ["Berjalan", "Fotosintesis", "Tidur", "Berpindah tempat"],
        correctIndex: 1,
        explanation: "Cahaya matahari membantu tanaman membuat makanannya.",
      },
      {
        id: "q2",
        prompt: "Apa yang terjadi jika tanaman kurang air?",
        options: ["Makin segar", "Cepat berbuah", "Layu", "Berwarna emas"],
        correctIndex: 2,
        explanation: "Kekurangan air membuat tanaman layu.",
      },
      {
        id: "q3",
        prompt: "Akar tanaman biasanya tumbuh di?",
        options: ["Langit", "Tanah", "Atap", "Kaca"],
        correctIndex: 1,
        explanation: "Akar tumbuh di tanah atau media tanam untuk menyerap air.",
      },
      {
        id: "q4",
        prompt: "Yang termasuk kebutuhan dasar tanaman adalah?",
        options: ["Mainan", "Buku", "Air", "Sepatu"],
        correctIndex: 2,
        explanation: "Air termasuk kebutuhan dasar tanaman.",
      },
      {
        id: "q5",
        prompt: "Udara dibutuhkan tanaman untuk proses?",
        options: ["Bermain", "Berpindah", "Pertumbuhan dan fotosintesis", "Bersuara"],
        correctIndex: 2,
        explanation: "Udara menyediakan gas yang dibutuhkan tanaman untuk tumbuh.",
      },
    ],
    goodHabits: [
      "Menyiram tanaman sesuai jadwal",
      "Tidak menginjak tanaman di kebun sekolah",
      "Mengamati kondisi daun setiap hari",
      "Membersihkan gulma kecil di sekitar pot",
    ],
    learningMap: [
      "Menyebutkan 4 kebutuhan dasar tanaman",
      "Menjelaskan fungsi air",
      "Menjelaskan fungsi matahari",
      "Mengenali tanda tanaman layu",
      "Menyelesaikan kuis kebutuhan tanaman",
    ],
  },
  {
    id: "mod-hortikultura-dasar",
    title: "Hortikultura: Sayur dan Buah Bernilai",
    topic: "Hortikultura",
    gradeCategory: 2,
    summary: "Memahami ciri tanaman hortikultura, contoh komoditas, dan teknik perawatan agar hasilnya berkualitas.",
    coverImage: "/topics/cropping.jpg",
    estimatedMinutes: 25,
    shortStory:
      "Kelompok belajar Nusa diminta membuat kebun mini berisi cabai, tomat, dan sawi. Mereka harus memilih cara merawat tanaman agar panen sehat dan seragam.",
    mainContent: [
      {
        title: "Apa Itu Hortikultura?",
        body: "Hortikultura adalah budidaya tanaman sayur, buah, bunga, dan tanaman obat yang biasanya memerlukan perawatan lebih teliti.",
      },
      {
        title: "Mutu Hasil Panen",
        body: "Mutu dipengaruhi oleh benih, pemupukan, pengairan, pengendalian hama, dan waktu panen yang tepat.",
      },
      {
        title: "Perawatan Terencana",
        body: "Tanaman hortikultura memerlukan jadwal siram, pemupukan, dan pemantauan hama agar pertumbuhan stabil.",
      },
    ],
    vocabulary: [
      { word: "Hortikultura", definition: "Budidaya sayur, buah, bunga, dan tanaman obat." },
      { word: "Komoditas", definition: "Produk utama yang dibudidayakan untuk dimanfaatkan atau dijual." },
      { word: "Mutu", definition: "Kualitas hasil panen." },
      { word: "Budidaya", definition: "Kegiatan menanam dan merawat hingga panen." },
    ],
    activities: [
      {
        id: "a1",
        type: "match",
        prompt: "Cocokkan komoditas dengan kelompoknya",
        pairs: [
          { left: "Tomat", right: "Sayuran buah" },
          { left: "Sawi", right: "Sayuran daun" },
          { left: "Mangga", right: "Buah" },
        ],
      },
      {
        id: "a2",
        type: "fill",
        prompt: "Lengkapi kalimat",
        sentenceTemplate: "Tanaman hortikultura membutuhkan perawatan yang lebih ____.",
        answer: "teliti",
        hint: "Kebalikan dari ceroboh",
      },
      {
        id: "a3",
        type: "tap",
        prompt: "Klik langkah yang membantu menjaga mutu panen",
        options: ["Panen terlalu cepat", "Jadwal siram teratur", "Membiarkan gulma", "Tidak memeriksa hama"],
        correctOption: "Jadwal siram teratur",
        explanation: "Perawatan teratur membantu hasil panen lebih baik.",
      },
    ],
    quiz: [
      {
        id: "q1",
        prompt: "Tanaman hortikultura mencakup?",
        options: ["Sayur dan buah", "Batu dan pasir", "Mesin panen", "Bangunan gudang"],
        correctIndex: 0,
        explanation: "Hortikultura fokus pada tanaman seperti sayur, buah, bunga, dan tanaman obat.",
      },
      {
        id: "q2",
        prompt: "Contoh sayuran buah adalah?",
        options: ["Bayam", "Tomat", "Padi", "Teh"],
        correctIndex: 1,
        explanation: "Tomat termasuk sayuran buah.",
      },
      {
        id: "q3",
        prompt: "Mutu hasil panen dipengaruhi oleh?",
        options: ["Perawatan tanaman", "Warna pot saja", "Nama kebun", "Bentuk pagar"],
        correctIndex: 0,
        explanation: "Mutu dipengaruhi oleh banyak faktor budidaya, terutama perawatan.",
      },
      {
        id: "q4",
        prompt: "Mengapa pemantauan hama penting?",
        options: ["Agar hama bertambah", "Agar kerusakan tanaman berkurang", "Agar tanah kering", "Agar panen terlambat"],
        correctIndex: 1,
        explanation: "Pemantauan hama membantu mencegah kerusakan lebih besar.",
      },
      {
        id: "q5",
        prompt: "Budidaya berarti kegiatan?",
        options: ["Menjual alat", "Menanam dan merawat sampai panen", "Mengecat pot", "Membangun jalan"],
        correctIndex: 1,
        explanation: "Budidaya adalah proses produksi tanaman dari awal sampai panen.",
      },
    ],
    goodHabits: [
      "Mencatat jadwal penyiraman kebun kelas",
      "Memeriksa daun untuk tanda hama",
      "Menggunakan air secukupnya",
      "Memanen dengan hati-hati agar tidak merusak tanaman lain",
    ],
    learningMap: [
      "Memahami arti hortikultura",
      "Menyebutkan contoh komoditas hortikultura",
      "Menjelaskan faktor mutu panen",
      "Menyusun perawatan terencana sederhana",
      "Menyelesaikan evaluasi modul",
    ],
  },
  {
    id: "mod-smart-farming-sensor",
    title: "Smart Farming dengan Sensor Sederhana",
    topic: "Smart Farming",
    gradeCategory: 2,
    summary: "Mengenal penggunaan sensor kelembapan, pencatatan data, dan keputusan sederhana untuk penyiraman.",
    coverImage: "/topics/weather.jpg",
    estimatedMinutes: 28,
    shortStory:
      "Tim kebun sekolah mencoba alat sensor kelembapan tanah. Mereka membandingkan dua bedeng: satu disiram berdasarkan jadwal, satu lagi berdasarkan data sensor.",
    mainContent: [
      {
        title: "Apa Itu Smart Farming?",
        body: "Smart farming menggunakan data dan teknologi untuk membantu keputusan budidaya, misalnya kapan menyiram atau memupuk.",
      },
      {
        title: "Sensor Kelembapan Tanah",
        body: "Sensor membaca kondisi tanah dan memberi informasi apakah tanah terlalu kering, cukup lembap, atau terlalu basah.",
      },
      {
        title: "Data Membantu Keputusan",
        body: "Dengan mencatat data, petani dapat mengurangi pemborosan air dan membuat tanaman lebih konsisten pertumbuhannya.",
      },
    ],
    vocabulary: [
      { word: "Sensor", definition: "Alat untuk membaca kondisi tertentu." },
      { word: "Kelembapan", definition: "Tingkat basah atau kering suatu media." },
      { word: "Data", definition: "Informasi yang dicatat untuk dianalisis." },
      { word: "Otomasi", definition: "Proses kerja otomatis dengan bantuan alat." },
    ],
    activities: [
      {
        id: "a1",
        type: "match",
        prompt: "Cocokkan kondisi sensor dengan tindakan",
        pairs: [
          { left: "Tanah kering", right: "Perlu penyiraman" },
          { left: "Tanah cukup lembap", right: "Pantau kembali nanti" },
          { left: "Tanah terlalu basah", right: "Tunda penyiraman" },
        ],
      },
      {
        id: "a2",
        type: "fill",
        prompt: "Lengkapi kalimat",
        sentenceTemplate: "Smart farming membantu mengambil keputusan berbasis ____.",
        answer: "data",
        hint: "Informasi yang dicatat",
      },
      {
        id: "a3",
        type: "tap",
        prompt: "Klik manfaat smart farming",
        options: ["Boros air", "Data penyiraman lebih terukur", "Tanaman diabaikan", "Tanpa pemantauan"],
        correctOption: "Data penyiraman lebih terukur",
        explanation: "Smart farming membuat keputusan lebih terukur dengan data.",
      },
    ],
    quiz: [
      {
        id: "q1",
        prompt: "Smart farming menggunakan?",
        options: ["Data dan teknologi", "Tebakan saja", "Mainan", "Poster"],
        correctIndex: 0,
        explanation: "Smart farming memanfaatkan data dan teknologi untuk keputusan budidaya.",
      },
      {
        id: "q2",
        prompt: "Sensor kelembapan tanah digunakan untuk membaca?",
        options: ["Warna daun", "Suhu ruangan kelas", "Kondisi basah-kering tanah", "Jumlah murid"],
        correctIndex: 2,
        explanation: "Sensor kelembapan memantau kondisi tanah.",
      },
      {
        id: "q3",
        prompt: "Jika tanah terlalu basah, tindakan yang tepat adalah?",
        options: ["Tambah air", "Tunda penyiraman", "Cabut tanaman", "Tutup sensor"],
        correctIndex: 1,
        explanation: "Penyiraman ditunda agar tanaman tidak kelebihan air.",
      },
      {
        id: "q4",
        prompt: "Mengapa data penting dalam budidaya?",
        options: ["Agar keputusan lebih terukur", "Agar alat cepat rusak", "Agar tanaman tidak dipantau", "Agar jadwal kacau"],
        correctIndex: 0,
        explanation: "Data membantu memilih tindakan yang lebih tepat.",
      },
      {
        id: "q5",
        prompt: "Contoh keputusan berbasis data adalah?",
        options: ["Menyiram karena ingin saja", "Menyiram setelah sensor menunjukkan kering", "Menyiram terus-menerus", "Tidak pernah menyiram"],
        correctIndex: 1,
        explanation: "Keputusan berdasarkan hasil sensor adalah contoh berbasis data.",
      },
    ],
    goodHabits: [
      "Mencatat hasil pengamatan kebun",
      "Mengecek alat sebelum digunakan",
      "Membandingkan data dan kondisi nyata tanaman",
      "Menghemat air saat penyiraman",
    ],
    learningMap: [
      "Memahami konsep smart farming",
      "Mengenal fungsi sensor kelembapan",
      "Membaca kondisi kering/lembap/basah",
      "Membuat keputusan penyiraman sederhana",
      "Menyelesaikan kuis modul",
    ],
  },
  {
    id: "mod-pasca-panen-aman",
    title: "Pasca Panen: Menjaga Mutu dan Kebersihan",
    topic: "Pasca Panen",
    gradeCategory: 3,
    summary: "Belajar langkah dasar pasca panen: sortasi, pembersihan, penyimpanan, dan distribusi agar mutu tetap baik.",
    coverImage: "/topics/tools.jpg",
    estimatedMinutes: 30,
    shortStory:
      "Setelah panen sayuran sekolah, tim siswa ingin menjual hasilnya pada bazar. Mereka harus memilah sayur, membersihkan, dan menyimpan dengan cara yang tepat agar tetap segar sampai acara dimulai.",
    mainContent: [
      {
        title: "Apa Itu Pasca Panen?",
        body: "Pasca panen adalah tahap setelah hasil dipetik, termasuk sortasi, pembersihan, pengemasan, dan penyimpanan.",
      },
      {
        title: "Menjaga Mutu Hasil",
        body: "Mutu dipengaruhi oleh cara menangani hasil panen. Penanganan kasar dapat menimbulkan memar dan mempercepat kerusakan.",
      },
      {
        title: "Penyimpanan dan Distribusi",
        body: "Penyimpanan sesuai jenis produk dan pengiriman yang rapi membantu hasil panen sampai ke konsumen dalam kondisi baik.",
      },
    ],
    vocabulary: [
      { word: "Sortasi", definition: "Memilah hasil berdasarkan ukuran, mutu, atau kondisi." },
      { word: "Mutu", definition: "Tingkat kualitas produk panen." },
      { word: "Pengemasan", definition: "Proses membungkus hasil agar aman dan rapi." },
      { word: "Distribusi", definition: "Proses menyalurkan produk ke pengguna atau pasar." },
    ],
    activities: [
      {
        id: "a1",
        type: "match",
        prompt: "Cocokkan tahap pasca panen dengan tujuannya",
        pairs: [
          { left: "Sortasi", right: "Memilah mutu hasil" },
          { left: "Pengemasan", right: "Melindungi produk" },
          { left: "Penyimpanan", right: "Menjaga kesegaran" },
        ],
      },
      {
        id: "a2",
        type: "fill",
        prompt: "Lengkapi kalimat",
        sentenceTemplate: "Tahap memilah hasil panen disebut ____.",
        answer: "sortasi",
        hint: "Diawali huruf s",
      },
      {
        id: "a3",
        type: "tap",
        prompt: "Klik tindakan yang membantu menjaga mutu panen",
        options: ["Menumpuk kasar", "Menyimpan rapi", "Melempar hasil panen", "Mencampur yang busuk"],
        correctOption: "Menyimpan rapi",
        explanation: "Penanganan rapi membantu mencegah kerusakan produk.",
      },
    ],
    quiz: [
      {
        id: "q1",
        prompt: "Pasca panen adalah tahap?",
        options: ["Sebelum tanam", "Saat pembibitan", "Setelah panen", "Saat hujan saja"],
        correctIndex: 2,
        explanation: "Pasca panen dilakukan setelah hasil dipetik.",
      },
      {
        id: "q2",
        prompt: "Tujuan sortasi adalah?",
        options: ["Memilah hasil berdasarkan mutu", "Menambah pupuk", "Menyiram tanaman", "Membajak lahan"],
        correctIndex: 0,
        explanation: "Sortasi membantu memisahkan hasil panen yang baik dan kurang baik.",
      },
      {
        id: "q3",
        prompt: "Penanganan kasar pada hasil panen dapat menyebabkan?",
        options: ["Mutu lebih baik", "Memar dan kerusakan", "Panen bertambah", "Harga alat turun"],
        correctIndex: 1,
        explanation: "Penanganan kasar dapat merusak produk pasca panen.",
      },
      {
        id: "q4",
        prompt: "Pengemasan yang baik berfungsi untuk?",
        options: ["Membuat produk kotor", "Melindungi produk", "Mengurangi mutu", "Menyulitkan distribusi"],
        correctIndex: 1,
        explanation: "Pengemasan menjaga produk tetap aman saat disimpan atau dikirim.",
      },
      {
        id: "q5",
        prompt: "Distribusi berkaitan dengan?",
        options: ["Menyalurkan produk ke pasar/konsumen", "Menyemai benih", "Mencangkul tanah", "Memotong gulma"],
        correctIndex: 0,
        explanation: "Distribusi adalah proses penyaluran hasil panen.",
      },
    ],
    goodHabits: [
      "Memilah hasil panen dengan hati-hati",
      "Menjaga kebersihan wadah panen",
      "Tidak mencampur produk rusak dengan yang baik",
      "Mencatat jumlah dan kondisi hasil panen",
    ],
    learningMap: [
      "Memahami arti pasca panen",
      "Mengenal fungsi sortasi",
      "Menjelaskan pengemasan",
      "Memahami pentingnya penyimpanan",
      "Menyelesaikan kuis pasca panen",
    ],
  },
  {
    id: "mod-isu-lingkungan-pertanian",
    title: "Isu Lingkungan dalam Pertanian",
    topic: "Isu Lingkungan",
    gradeCategory: 3,
    summary: "Mengenal dampak praktik pertanian terhadap tanah, air, dan keanekaragaman hayati serta solusi berkelanjutan.",
    coverImage: "/topics/soil.jpg",
    estimatedMinutes: 32,
    shortStory:
      "Desa Suka Makmur mengalami kualitas air menurun setelah musim tanam. Kelompok siswa meneliti penyebabnya dan menyusun langkah pertanian yang lebih ramah lingkungan.",
    mainContent: [
      {
        title: "Hubungan Pertanian dan Lingkungan",
        body: "Pertanian dapat membantu lingkungan jika dikelola dengan baik, tetapi juga dapat merusak jika penggunaan input berlebihan.",
      },
      {
        title: "Contoh Dampak Negatif",
        body: "Pemakaian pupuk atau pestisida berlebihan dapat mencemari air dan menurunkan kesehatan tanah dalam jangka panjang.",
      },
      {
        title: "Praktik Berkelanjutan",
        body: "Rotasi tanaman, pemupukan tepat dosis, pengelolaan limbah organik, dan konservasi air membantu menjaga ekosistem tetap sehat.",
      },
    ],
    vocabulary: [
      { word: "Berkelanjutan", definition: "Dapat dilakukan terus tanpa merusak sumber daya." },
      { word: "Konservasi", definition: "Upaya menjaga dan melindungi sumber daya alam." },
      { word: "Pencemaran", definition: "Masuknya zat yang merusak kualitas lingkungan." },
      { word: "Ekosistem", definition: "Hubungan makhluk hidup dengan lingkungannya." },
    ],
    activities: [
      {
        id: "a1",
        type: "match",
        prompt: "Cocokkan masalah dengan solusi",
        pairs: [
          { left: "Tanah cepat rusak", right: "Rotasi tanaman" },
          { left: "Air boros", right: "Pengairan lebih efisien" },
          { left: "Limbah organik menumpuk", right: "Kompos" },
        ],
      },
      {
        id: "a2",
        type: "fill",
        prompt: "Isi kata yang tepat",
        sentenceTemplate: "Pertanian ____ menjaga hasil panen sambil melindungi lingkungan.",
        answer: "berkelanjutan",
        hint: "Dimulai dengan huruf b",
      },
      {
        id: "a3",
        type: "tap",
        prompt: "Klik praktik yang lebih ramah lingkungan",
        options: ["Dosis pupuk berlebihan", "Rotasi tanaman", "Buang limbah ke sungai", "Menyiram tanpa kontrol"],
        correctOption: "Rotasi tanaman",
        explanation: "Rotasi tanaman membantu kesuburan tanah dan mengurangi risiko hama tertentu.",
      },
    ],
    quiz: [
      {
        id: "q1",
        prompt: "Pertanian berkelanjutan berarti?",
        options: [
          "Fokus hasil cepat saja",
          "Menjaga produksi sambil melindungi lingkungan",
          "Menggunakan input berlebih",
          "Tanpa pengelolaan air",
        ],
        correctIndex: 1,
        explanation: "Pertanian berkelanjutan menyeimbangkan produksi dan perlindungan lingkungan.",
      },
      {
        id: "q2",
        prompt: "Salah satu dampak pupuk berlebihan adalah?",
        options: ["Air lebih bersih", "Pencemaran air", "Tanah makin sehat selamanya", "Panen tanpa risiko"],
        correctIndex: 1,
        explanation: "Dosis berlebih dapat mencemari air dan merusak tanah.",
      },
      {
        id: "q3",
        prompt: "Rotasi tanaman membantu?",
        options: ["Menambah sampah", "Menjaga tanah dan memutus siklus hama", "Mengurangi cahaya", "Membuat air keruh"],
        correctIndex: 1,
        explanation: "Rotasi tanaman adalah salah satu praktik konservasi lahan.",
      },
      {
        id: "q4",
        prompt: "Kompos berasal dari?",
        options: ["Limbah organik", "Besi", "Plastik", "Cat"],
        correctIndex: 0,
        explanation: "Kompos dibuat dari bahan organik seperti daun dan sisa makanan tertentu.",
      },
      {
        id: "q5",
        prompt: "Konservasi air dalam pertanian bertujuan untuk?",
        options: ["Membuang air lebih banyak", "Menggunakan air secara efisien", "Membuat lahan banjir", "Menghentikan semua irigasi"],
        correctIndex: 1,
        explanation: "Konservasi air berarti penggunaan air lebih hemat dan tepat.",
      },
    ],
    goodHabits: [
      "Menggunakan air secukupnya saat praktik",
      "Memilah sampah organik dan anorganik",
      "Tidak membuang bahan kimia sembarangan",
      "Mencatat dampak praktik budidaya pada lingkungan",
    ],
    learningMap: [
      "Memahami hubungan pertanian dan lingkungan",
      "Mengidentifikasi dampak negatif praktik berlebihan",
      "Mengenal praktik berkelanjutan",
      "Memahami konsep konservasi",
      "Menyelesaikan evaluasi isu lingkungan",
    ],
  },
  {
    id: "mod-teknologi-tepat-guna",
    title: "Teknologi Tepat Guna untuk Kebun Sekolah",
    topic: "Teknologi Tepat Guna",
    gradeCategory: 3,
    summary: "Mengenal alat sederhana dan teknologi tepat guna untuk efisiensi penyiraman, pengamatan, dan pengolahan hasil.",
    coverImage: "/topics/agro.jpg",
    estimatedMinutes: 30,
    shortStory:
      "OSIS merancang proyek kebun sekolah hemat air. Mereka membandingkan berbagai alat sederhana untuk menentukan teknologi yang paling sesuai kebutuhan sekolah.",
    mainContent: [
      {
        title: "Apa Itu Teknologi Tepat Guna?",
        body: "Teknologi tepat guna adalah alat atau metode yang sesuai kebutuhan, terjangkau, mudah dirawat, dan memberi manfaat nyata.",
      },
      {
        title: "Contoh di Kebun Sekolah",
        body: "Timer penyiraman sederhana, penampung air hujan, dan alat ukur kelembapan dapat meningkatkan efisiensi kerja kebun sekolah.",
      },
      {
        title: "Memilih Teknologi yang Tepat",
        body: "Pemilihan teknologi harus mempertimbangkan biaya, manfaat, kemudahan penggunaan, dan kondisi lingkungan setempat.",
      },
    ],
    vocabulary: [
      { word: "Efisiensi", definition: "Mencapai hasil baik dengan penggunaan sumber daya yang tepat." },
      { word: "Tepat guna", definition: "Sesuai kebutuhan dan kondisi pengguna." },
      { word: "Perawatan", definition: "Kegiatan menjaga alat agar tetap berfungsi." },
      { word: "Biaya", definition: "Pengeluaran yang dibutuhkan untuk alat atau kegiatan." },
    ],
    activities: [
      {
        id: "a1",
        type: "match",
        prompt: "Cocokkan kebutuhan dengan alat",
        pairs: [
          { left: "Hemat air", right: "Timer penyiraman" },
          { left: "Menampung air", right: "Tandon/tong air hujan" },
          { left: "Cek kondisi tanah", right: "Alat ukur kelembapan" },
        ],
      },
      {
        id: "a2",
        type: "fill",
        prompt: "Lengkapi kalimat",
        sentenceTemplate: "Teknologi tepat guna harus sesuai ____ dan kondisi pengguna.",
        answer: "kebutuhan",
        hint: "Apa yang benar-benar diperlukan",
      },
      {
        id: "a3",
        type: "tap",
        prompt: "Klik pertimbangan penting saat memilih alat",
        options: ["Warna favorit", "Biaya dan manfaat", "Nama yang keren", "Ukuran logo"],
        correctOption: "Biaya dan manfaat",
        explanation: "Alat dipilih berdasarkan fungsi dan manfaat nyata, bukan tampilan saja.",
      },
    ],
    quiz: [
      {
        id: "q1",
        prompt: "Teknologi tepat guna berarti teknologi yang?",
        options: ["Paling mahal", "Sesuai kebutuhan", "Paling rumit", "Hanya untuk pabrik besar"],
        correctIndex: 1,
        explanation: "Teknologi tepat guna harus sesuai kebutuhan dan kondisi pengguna.",
      },
      {
        id: "q2",
        prompt: "Salah satu manfaat timer penyiraman adalah?",
        options: ["Membuat tanah retak", "Menyiram lebih teratur", "Menambah gulma", "Menghilangkan cahaya"],
        correctIndex: 1,
        explanation: "Timer membantu jadwal penyiraman lebih konsisten.",
      },
      {
        id: "q3",
        prompt: "Saat memilih alat, kita perlu menilai?",
        options: ["Biaya dan manfaat", "Warna cat saja", "Nama merek saja", "Ukuran kotak"],
        correctIndex: 0,
        explanation: "Penilaian utama adalah apakah alat bermanfaat dan terjangkau.",
      },
      {
        id: "q4",
        prompt: "Mengapa perawatan alat penting?",
        options: ["Agar cepat rusak", "Agar alat tetap berfungsi", "Agar terlihat kotor", "Agar dipakai sekali"],
        correctIndex: 1,
        explanation: "Perawatan membuat alat awet dan tetap akurat.",
      },
      {
        id: "q5",
        prompt: "Contoh teknologi tepat guna untuk kebun sekolah adalah?",
        options: ["Kursi kelas", "Timer penyiraman sederhana", "Mainan robot", "Speaker aula"],
        correctIndex: 1,
        explanation: "Timer penyiraman sesuai kebutuhan kebun dan membantu efisiensi.",
      },
    ],
    goodHabits: [
      "Memilih alat berdasarkan kebutuhan nyata",
      "Merawat alat setelah dipakai",
      "Mencatat manfaat dan kendala penggunaan alat",
      "Mengutamakan solusi hemat sumber daya",
    ],
    learningMap: [
      "Memahami konsep teknologi tepat guna",
      "Mengenal contoh alat kebun sederhana",
      "Menganalisis biaya dan manfaat",
      "Menjelaskan pentingnya perawatan alat",
      "Menyelesaikan kuis modul",
    ],
  },
]

export function getCurriculumModules(): CurriculumModule[] {
  return curriculumModules
}

export function getCurriculumModuleById(id: string): CurriculumModule | null {
  return curriculumModules.find((module) => module.id === id) ?? null
}
