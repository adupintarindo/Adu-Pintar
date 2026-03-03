# UI/UX Remediation Checklist - Adu Pintar

Date: 2026-03-03  
Scope: Landing, Login/Register, Dashboard, Duel, Leaderboard, Materials, Global system

## Prioritization Rules
- `P0`: High impact, low-medium effort, should be delivered first.
- `P1`: High impact, medium effort, planned after P0.
- `P2`: Medium impact or dependent work, backlog after P1.

## 10 Quick Wins (Start Now)
1. `UX-001` Reduce top-level nav choices per context to max 5.
2. `UX-010` Add role indicator (Siswa/Guru/Sekolah) in header.
3. `UX-025` Place "Daftar Sekolah" and "Masuk Siswa" side by side on landing.
4. `UX-033` Add realtime validation for email, PIN, phone, and NPSN.
5. `UX-034` Show inline field errors below each input, not toast-only.
6. `UX-041` Auto-focus first invalid input on failed submit.
7. `UX-061` Add 3-second countdown before duel starts.
8. `UX-062` Keep question progress indicator (e.g. 3/10) always visible.
9. `UX-078` Show "your current rank" card even if user is outside top 10.
10. `UX-086` Fix all color contrast to WCAG AA minimum.

## 30-Day Roadmap (Wave 1)
### Week 1
- Deliver: `UX-001`, `UX-003`, `UX-010`, `UX-033`, `UX-034`.
- KPI target: +10% task completion from landing to login.

### Week 2
- Deliver: `UX-041`, `UX-046`, `UX-048`, `UX-052`, `UX-055`.
- KPI target: -20% form abandonment, +8% dashboard engagement.

### Week 3
- Deliver: `UX-061`, `UX-062`, `UX-066`, `UX-068`, `UX-074`.
- KPI target: +12% duel completion, -30% duel drop-off mid-game.

### Week 4
- Deliver: `UX-076`, `UX-078`, `UX-079`, `UX-085`, `UX-086`.
- KPI target: +15% return to leaderboard and replay intent.

## Master Checklist (100 Items)

### A. Information Architecture and Navigation
- [ ] `UX-001` `P0` Limit each navigation context to max 5 primary items.
- [ ] `UX-002` `P1` Add breadcrumbs for deep pages (duel, material detail, admin flows).
- [ ] `UX-003` `P0` Keep one consistent primary CTA in navbar ("Mulai Duel").
- [ ] `UX-004` `P1` Reduce mobile navbar height for better content visibility.
- [ ] `UX-005` `P0` Strengthen active menu state with clearer contrast and shape.
- [ ] `UX-006` `P0` Normalize naming ("Badge" vs "Awards") across all surfaces.
- [ ] `UX-007` `P1` Add dashboard quick actions (Materi, Duel, Leaderboard, Tim).
- [ ] `UX-008` `P2` Standardize footer links (legal, contact, help, social proof).
- [ ] `UX-009` `P1` Add global search for materials, FAQ, and tutorial.
- [ ] `UX-010` `P0` Display current role badge in header.
- [ ] `UX-011` `P0` Add consistent back affordance on all secondary pages.
- [ ] `UX-012` `P1` Implement bottom navigation for mobile frequent tasks.
- [ ] `UX-013` `P1` Reorder menu by usage analytics frequency.
- [ ] `UX-014` `P1` Visually separate "Belajar" and "Kompetisi" zones.
- [ ] `UX-015` `P1` Add notification badge for new missions/challenges.

### B. Landing and Conversion
- [ ] `UX-016` `P0` Rewrite hero value proposition into one direct sentence.
- [ ] `UX-017` `P0` Keep hero to one primary CTA and one secondary CTA.
- [ ] `UX-018` `P1` Add short gameplay preview (10-15 sec) above the fold.
- [ ] `UX-019` `P0` Label non-realtime metrics as "demo/preview data".
- [ ] `UX-020` `P1` Replace placeholders with verified testimonials only.
- [ ] `UX-021` `P0` Add "3-step how it works" block near top section.
- [ ] `UX-022` `P1` Offer role-based landing entry points (Siswa/Guru/Sekolah).
- [ ] `UX-023` `P1` Show next competition schedule on landing.
- [ ] `UX-024` `P1` Add mini FAQ on landing to reduce uncertainty.
- [ ] `UX-025` `P0` Make "Daftar Sekolah" and "Masuk Siswa" equally visible.
- [ ] `UX-026` `P1` Add explicit teacher value block (monitoring and coaching).
- [ ] `UX-027` `P1` Add child data protection trust marker near signup.
- [ ] `UX-028` `P0` Use concrete copy (e.g. "10 soal, 5 menit, hasil instan").
- [ ] `UX-029` `P1` Showcase real reward/badge examples and unlock paths.
- [ ] `UX-030` `P1` Add measurable learning impact section, not just engagement.

### C. Authentication and Registration
- [ ] `UX-031` `P1` Keep a persistent stepper during full registration flow.
- [ ] `UX-032` `P1` Show "draft saved" indicator for session-stored forms.
- [ ] `UX-033` `P0` Add realtime validation for key identity fields.
- [ ] `UX-034` `P0` Render inline field-level errors under each input.
- [ ] `UX-035` `P1` Improve PIN visibility toggle with privacy hint text.
- [ ] `UX-036` `P1` Move optional fields to final step to reduce friction.
- [ ] `UX-037` `P1` Add faster student login variant (class code + PIN).
- [ ] `UX-038` `P1` Make password strength guidance actionable.
- [ ] `UX-039` `P0` Provide example formats in placeholders/help text.
- [ ] `UX-040` `P1` Add optional first-login guided onboarding (60 seconds).
- [ ] `UX-041` `P0` Focus first invalid field after failed submit.
- [ ] `UX-042` `P1` Add reliable back behavior for every registration step.
- [ ] `UX-043` `P1` Show dedicated pending verification state for school accounts.
- [ ] `UX-044` `P0` Add final review screen before registration submit.
- [ ] `UX-045` `P2` Add limited guest mode for trying basic materials.

### D. Dashboard and Learning Journey
- [ ] `UX-046` `P0` Make key stat cards clickable to detail pages.
- [ ] `UX-047` `P0` Clearly split realtime data vs preview data UI.
- [ ] `UX-048` `P0` Add daily EXP target with progress feedback.
- [ ] `UX-049` `P1` Add "continue last learning module" card.
- [ ] `UX-050` `P1` Recommend adaptive next modules from recent performance.
- [ ] `UX-051` `P2` Add weekly activity heatmap for study consistency.
- [ ] `UX-052` `P0` Improve empty states with strong next-action CTA.
- [ ] `UX-053` `P1` Add "need mentor help" support panel.
- [ ] `UX-054` `P1` Add daily/weekly mission board with reset countdown.
- [ ] `UX-055` `P0` Provide immediate completion feedback for missions.
- [ ] `UX-056` `P1` Add time filters (7/30/90 days) for stats views.
- [ ] `UX-057` `P2` Add class/school benchmark comparison module.
- [ ] `UX-058` `P1` Visualize badge progress and exact unlock conditions.
- [ ] `UX-059` `P1` Add recent match history summary panel.
- [ ] `UX-060` `P1` Create compact mobile dashboard with top 3 KPIs first.

### E. Duel and Match Experience
- [ ] `UX-061` `P0` Add 3-second start countdown for duel readiness.
- [ ] `UX-062` `P0` Keep current question progress sticky and visible.
- [ ] `UX-063` `P1` Improve answer feedback speed without flow interruption.
- [ ] `UX-064` `P1` Show network status indicator during match.
- [ ] `UX-065` `P1` Add report-question action from match/results screens.
- [ ] `UX-066` `P0` Add one-click rematch after result screen.
- [ ] `UX-067` `P1` Add clear "respond to challenge" CTA from notifications.
- [ ] `UX-068` `P0` Implement safe rejoin flow after disconnect.
- [ ] `UX-069` `P1` Show estimated match duration before game starts.
- [ ] `UX-070` `P0` Shorten setup copy into concise bullets.
- [ ] `UX-071` `P1` Move detailed competition rules into collapsible panel.
- [ ] `UX-072` `P1` Increase visual distinction between practice and competition mode.
- [ ] `UX-073` `P2` Show useful waiting-room microtips before match starts.
- [ ] `UX-074` `P0` Add post-match summary (accuracy, speed, weak topics).
- [ ] `UX-075` `P1` Add answer review with explanation for wrong responses.

### F. Leaderboard and Motivation
- [ ] `UX-076` `P0` Add quick preset filters for common scopes.
- [ ] `UX-077` `P1` Persist leaderboard filter preferences per user.
- [ ] `UX-078` `P0` Always show user's own rank card.
- [ ] `UX-079` `P0` Add rank delta vs previous period.
- [ ] `UX-080` `P1` Add scoring formula tooltip/help entry.
- [ ] `UX-081` `P1` Separate seasonal leaderboard from all-time leaderboard.
- [ ] `UX-082` `P2` Add fair-play marker/flag visibility.
- [ ] `UX-083` `P1` Improve pagination with "jump to page".
- [ ] `UX-084` `P0` Build smart empty states for over-filtered results.
- [ ] `UX-085` `P0` Add direct CTA from leaderboard to start duel now.

### G. Accessibility, Content, and Performance
- [ ] `UX-086` `P0` Ensure WCAG AA contrast across components.
- [ ] `UX-087` `P0` Add `aria-label` for icon-only controls.
- [ ] `UX-088` `P0` Make all core flows keyboard navigable.
- [ ] `UX-089` `P1` Honor `prefers-reduced-motion` globally.
- [ ] `UX-090` `P0` Keep touch targets at minimum 44x44 on mobile.
- [ ] `UX-091` `P0` Do not rely on icon-only meaning; always add labels.
- [ ] `UX-092` `P1` Normalize heading hierarchy (`h1-h2-h3`) for all pages.
- [ ] `UX-093` `P1` Simplify language for SD audience on key instructions.
- [ ] `UX-094` `P1` Optimize hero and visual assets (modern formats/lazy load).
- [ ] `UX-095` `P1` Reduce heavy blur/orb effects on mobile for smooth FPS.
- [ ] `UX-096` `P1` Use context-aware skeleton loading states.
- [ ] `UX-097` `P1` Tune smart prefetch for high-traffic routes.
- [ ] `UX-098` `P0` Fix CLS/LCP on landing and authentication pages.
- [ ] `UX-099` `P1` Reduce unnecessary client-side JS on static pages.
- [ ] `UX-100` `P0` Instrument funnel analytics (visit > register > login > duel).

## Suggested Implementation Order
1. Complete all `P0` items for shared components and global styles first.
2. Complete all `P0` items for duel and leaderboard next.
3. Execute `P1` in two sprints, then move remaining `P2` to backlog.

