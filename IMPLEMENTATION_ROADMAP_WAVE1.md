# IMPLEMENTATION ROADMAP — Wave 1 (UI Improvement)

Periode: 30 hari (4 minggu)  
Target: menurunkan friction auth flow, meningkatkan trust pada data UI, dan memperkuat aksesibilitas dasar.

## Progress Snapshot (2026-03-03)
- Wave 1 implementasi UI inti sudah selesai.
- QA pipeline:
  - `pnpm lint` pass.
  - `pnpm typecheck` pass.
  - E2E smoke masih blocker environment karena browser Playwright revision project belum tersedia lokal.

## North Star KPI
- Conversion landing -> login/register naik minimal 10%.
- Form drop-off register turun minimal 20%.
- Error aksesibilitas kritikal (keyboard/focus/label) turun ke 0 untuk scope wave 1.
- Bug visual mobile kritikal (overflow/occlusion) turun ke 0.

## Week 1 — Accessibility & Trust Foundation (P0)

### Deliverables
1. `P0-01` Single source `main-content` landmark (hapus duplikat id).
2. `P0-02` PIN/password visibility toggle keyboard-accessible.
3. `P0-03` Ubah semua klaim "live/langsung" ke status preview bila data belum realtime.
4. `P1-01` Label-filter landing terhubung `htmlFor/id`.

### Owner
- FE-Core (implementasi)
- QA (keyboard + screen reader smoke test)

### DoD
- Skip link selalu mendarat ke satu target yang valid.
- Seluruh kontrol auth penting bisa diakses via `Tab`.
- Tidak ada label realtime palsu pada data statis.

## Week 2 — Auth Form Conversion Upgrade (P0)

### Deliverables
1. `P0-04` Register: validasi per-field pada setiap step.
2. Auto-focus ke field invalid pertama saat submit/next gagal.
3. Error messaging inline + `aria-invalid` + `aria-describedby` konsisten.
4. Optional: logo auth clickable ke homepage (`P2-01`).

### Owner
- FE-Core
- QA (negative-path test matrix)

### DoD
- Banner error global bukan satu-satunya feedback.
- Semua field wajib punya feedback inline ketika invalid.
- Waktu koreksi form menurun (ukur dari session replay/analytics).

## Week 3 — Mobile Robustness & Navigation Quality (P0/P1)

### Deliverables
1. `P0-05` Chat widget mobile-safe (tidak overflow di viewport kecil).
2. `P1-02` Aktifkan atau hapus sticky filter bar leaderboard (hindari dead UI block).
3. Harmonisasi spacing/touch target di panel filter leaderboard mobile.

### Owner
- FE-Core
- QA (device matrix 320/360/390/430 px)

### DoD
- Tidak ada panel fixed yang terpotong di layar kecil.
- Filter leaderboard tetap discoverable tanpa duplikasi membingungkan.

## Week 4 — Data Clarity & QA Guardrail

### Deliverables
1. `P1-03` Dashboard: visual split `Live` vs `Preview` per panel.
2. `P1-04` Update E2E locator/copy & aktifkan Playwright browser setup pada CI/local.
3. Tambah smoke test untuk route kritikal: `/`, `/login`, `/register`, `/dashboard`, `/leaderboard`, `/game/duel`.

### Owner
- FE-Core + QA

### DoD
- User paham panel mana realtime dan mana simulasi.
- Minimal smoke E2E berjalan hijau untuk flow utama.

## Technical Checklist by Stream

### Accessibility
- [x] Landmark unik (`main`, `nav`, `footer`) tanpa id ganda.
- [x] Semua control interaktif bisa diakses keyboard.
- [x] Label form selalu terhubung ke input via `htmlFor/id`.
- [x] Error form bisa dibaca SR (`aria-invalid`, `aria-describedby`, role alert terarah).

### Conversion & UX
- [x] Auth form memberi feedback cepat dan spesifik.
- [x] Tidak ada misleading copy untuk data yang belum realtime.
- [x] Mobile viewport kecil tidak mengalami clipping/overflow panel utama.

### QA
- [x] Lint bersih untuk file yang touched.
- [ ] Smoke E2E tersedia dan mengikuti copy UI terbaru.
- [ ] Regression checklist mobile + desktop untuk tiap release.

## Risk & Mitigation
- Risiko: perubahan copy memutus locator test.  
  Mitigasi: pakai locator berbasis role+stable label/test-id.
- Risiko: fix aksesibilitas memengaruhi styling lama.  
  Mitigasi: snapshot visual sebelum/sesudah pada route kritikal.
- Risiko: panel realtime belum siap backend.  
  Mitigasi: gunakan badge `Preview` konsisten hingga API live.
