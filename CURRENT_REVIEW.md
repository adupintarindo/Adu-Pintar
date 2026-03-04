# CURRENT REVIEW — Deep Scan UI Website Adu Pintar

Tanggal audit: 2026-03-03  
Reviewer: Codex (deep code scan + static checks)

## Update Status (2026-03-03)
- Selesai:
  - `P0-01` duplicate `main-content` pada landing sudah dihapus.
  - `P0-02` toggle PIN/password di login sudah keyboard-accessible.
  - `P0-03` copy status landing sudah pakai `Preview` + disclaimer data contoh.
  - `P0-04` register sudah punya validasi per-field + focus ke field invalid pertama.
  - `P0-05` chat widget sudah aman di viewport mobile kecil.
  - `P1-01` label filter landing sudah terhubung `htmlFor/id`.
  - `P1-02` sticky filter leaderboard sudah aktif untuk desktop (`hidden lg:block`).
  - `P1-03` dashboard sudah memisahkan status `Live` vs `Preview` per panel.
  - `P2-01` branding login/register sudah clickable ke homepage.
  - `home-leaderboard` sudah difinalkan: tab fungsional, search field berlabel, dan encoding text bersih.
- Masih terbuka:
  - `P1-04` smoke E2E belum hijau karena browser Playwright revision yang diminta project belum tersedia di environment ini.

## Scope
- Landing/home (`/`)
- Login/Register (`/login`, `/register`)
- Dashboard (`/dashboard`)
- Duel flow (`/game/duel`, `/game/duel/lobby/[gameId]`, `/game/duel/playing/[gameId]`, `/game/duel/results/[gameId]`)
- Leaderboard (`/leaderboard`)
- Shared/global UI (`layout`, navbar, footer, widget)

## Method
- Deep static review komponen dan halaman utama.
- Verifikasi aksesibilitas dasar dari markup (label, focusability, landmark).
- Validasi pipeline ringan:
  - Snapshot awal audit: `pnpm lint` gagal (4 error, 3 warning), `pnpm test:e2e` gagal (browser Playwright belum tersedia).
  - Snapshot setelah perbaikan UI: `pnpm lint` pass, `pnpm typecheck` pass, `pnpm test:e2e` masih blocker environment browser.

## Priority Findings

### P0-01 — Duplicate `id="main-content"` (landmark conflict untuk skip link)
- Evidence:
  - `app/layout.tsx:93`
  - `components/home/home-page.tsx:544`
- Dampak:
  - Skip-link `href="#main-content"` dapat menjadi ambigu dan menurunkan aksesibilitas keyboard/screen reader.
- Rekomendasi:
  - Pertahankan satu landmark utama di `layout`.
  - Ubah `<main>` di home menjadi `<div>` atau hapus `id` duplikat.

### P0-02 — Tombol show/hide PIN dan password tidak bisa diakses keyboard
- Evidence:
  - `app/login/page.tsx:562` (`tabIndex={-1}` untuk toggle PIN)
  - `app/login/page.tsx:676` (`tabIndex={-1}` untuk toggle password)
- Dampak:
  - User keyboard-only tidak bisa membuka/menutup visibilitas kredensial.
- Rekomendasi:
  - Hapus `tabIndex={-1}`.
  - Pertahankan `aria-label` yang sudah baik.

### P0-03 — Klaim "live"/"langsung" di landing pakai data hardcoded
- Evidence:
  - Sumber angka statis: `components/home/home-page.tsx:86-129`
  - Label live: `components/home/home-page.tsx:650-656`
- Dampak:
  - Risiko trust: user menganggap data real-time padahal angka tidak berasal dari API.
- Rekomendasi:
  - Ganti label menjadi `Data contoh`/`Preview` sampai koneksi data realtime aktif.
  - Atau fetch nyata dari API + tampilkan timestamp pembaruan.

### P0-04 — Validasi register masih dominan banner global, bukan error per field
- Evidence:
  - Validasi step hanya `setError(...)` + `return`: `app/register/page.tsx:204-253`
  - Error ditampilkan sebagai banner umum: `app/register/page.tsx:614`
- Dampak:
  - Friksi tinggi di multi-step form, terutama mobile.
  - User tidak diarahkan otomatis ke field pertama yang invalid.
- Rekomendasi:
  - Tambah state error per-field + `aria-invalid` + `aria-describedby`.
  - Fokus otomatis ke field invalid pertama setiap gagal lanjut step.

### P0-05 — Chat widget berpotensi overflow di mobile kecil
- Evidence:
  - Container fixed kanan: `components/chat-widget.tsx:44`
  - Lebar panel minimum: `components/chat-widget.tsx:48` (`w-[320px]`)
- Dampak:
  - Di viewport sempit, panel dapat terpotong/horizontal clipping.
- Rekomendasi:
  - Ubah ke `w-[calc(100vw-2rem)] max-w-[360px]` dan gunakan `right-4 left-4 sm:left-auto`.

## P1 Findings

### P1-01 — Label filter landing tidak terhubung ke kontrol form
- Evidence:
  - Label tanpa `htmlFor` di filter: `components/home/home-page.tsx:776`, `:818`, `:839`
  - Select terkait tidak memiliki `id`.
- Dampak:
  - Menurunkan aksesibilitas form untuk screen reader.
- Rekomendasi:
  - Tambahkan `id` pada select dan `htmlFor` pada label.

### P1-02 — Sticky filter bar leaderboard sudah dibuat tapi di-hard hide
- Evidence:
  - `app/leaderboard/page.tsx:489` memiliki class `hidden` permanen.
- Dampak:
  - UX intent (quick filter sticky) tidak pernah dipakai; maintenance code jadi berat.
- Rekomendasi:
  - Aktifkan dengan breakpoint jelas (`hidden lg:block`) atau hapus blok duplikat.

### P1-03 — Dashboard masih campur data real dan data contoh di area utama
- Evidence:
  - Fallback sample constants: `app/dashboard/page.tsx:12-40`
  - Disclaimer data contoh: `app/dashboard/page.tsx:271-274`
- Dampak:
  - Persepsi kualitas data belum konsisten.
- Rekomendasi:
  - Pisahkan komponen `LiveDataCard` dan `PreviewCard` secara visual.
  - Tambah badge "Preview" per panel non-live.

### P1-04 — QA E2E belum siap dipakai sebagai guardrail UI
- Evidence:
  - Test copy sudah tidak sinkron: `tests/e2e/home.spec.ts:5-6`.
  - Browser Playwright belum terinstall (hasil run test).
- Dampak:
  - Regression UI mudah lolos tanpa terdeteksi.
- Rekomendasi:
  - Update locator test sesuai copy terbaru.
  - Setup `playwright install` pada environment CI/dev.

## P2 Findings

### P2-01 — Auth page branding belum clickable ke beranda
- Evidence:
  - Login logo statis: `app/login/page.tsx:362-370`
  - Register logo statis: `app/register/page.tsx:492-500`
- Dampak:
  - Minor friction saat user ingin kembali ke homepage.
- Rekomendasi:
  - Bungkus logo dengan `Link href="/"`.

## Quick Win Candidate (1-2 hari)
1. Fix duplicate `main-content` id.
2. Remove `tabIndex={-1}` dari toggle PIN/password.
3. Ubah label "Status Langsung" menjadi "Preview Data" sampai realtime siap.
4. Perbaiki responsive width chat-widget panel.
5. Hubungkan label-filter landing dengan `id/htmlFor`.

## Validation Notes
- `pnpm lint` saat ini gagal karena isu lint non-UI juga (purity/error-boundary).
- E2E belum bisa dijalankan karena browser Playwright belum tersedia di environment lokal ini.
