# UI/UX Page Issue Breakdown - Adu Pintar

Date: 2026-03-03  
Source of truth: `UIUX_REMEDIATION_CHECKLIST.md`  
Goal: Ready-to-assign issue list by page for Design, FE, BE, and QA.

## Team Labels
- `Design`: UI layout, content hierarchy, interaction states.
- `FE-Core`: Shared components, auth pages, dashboard, global accessibility.
- `FE-Game`: Duel flow and game UI.
- `FE-Growth`: Landing page and conversion sections.
- `BE/API`: API response support for new UI data needs.
- `QA`: Functional, responsive, accessibility, and regression testing.

## Global and Shared Components
| ID | Priority | Owner | UX Ref | Task | Definition of Done |
|---|---|---|---|---|---|
| `NAV-01` | `P0` | `Design + FE-Core + QA` | `UX-001, UX-003, UX-006` | Simplify navbar per context (max 5 items), keep one primary CTA, and normalize menu terms. | Navbar is consistent across public/auth pages, CTA is stable, and labels are no longer mixed. |
| `NAV-02` | `P0` | `FE-Core + QA` | `UX-010, UX-011` | Add role badge in header and consistent back affordance for secondary pages. | Role badge appears for authenticated users and all secondary pages have working back behavior. |
| `NAV-03` | `P0` | `FE-Core + QA` | `UX-086, UX-087, UX-088, UX-090, UX-091` | Accessibility hardening for shared components (contrast, aria labels, keyboard nav, 44x44 touch targets). | Accessibility checklist passes for navbar, dialogs, dropdowns, and buttons on desktop/mobile. |
| `NAV-04` | `P0` | `FE-Core + QA` | `UX-098, UX-099` | Improve Core Web Vitals on landing/login and reduce unnecessary client JS on static routes. | CLS/LCP budgets are improved and static pages avoid avoidable client bundle weight. |
| `NAV-05` | `P0` | `FE-Core + BE/API + QA` | `UX-100` | Instrument funnel tracking from visit to duel start with reliable event schema. | Events are emitted and validated for `visit > register > login > duel_start` path. |
| `NAV-06` | `P1` | `FE-Core + Design + QA` | `UX-002, UX-012` | Add breadcrumb for deep pages and bottom navigation for mobile frequent tasks. | Deep pages show breadcrumb and mobile bottom nav is active for key routes. |

## Landing Page (`/`)
| ID | Priority | Owner | UX Ref | Task | Definition of Done |
|---|---|---|---|---|---|
| `LND-01` | `P0` | `Design + FE-Growth + QA` | `UX-016, UX-017, UX-028` | Rewrite hero copy to one clear value sentence with one primary and one secondary CTA. | Hero is concise, CTA hierarchy is clear, and copy is concrete. |
| `LND-02` | `P0` | `FE-Growth + QA` | `UX-021, UX-025` | Add 3-step product flow and place "Daftar Sekolah" with "Masuk Siswa" at equal visual weight. | Both entry actions are visible above the fold and 3-step flow appears in early section. |
| `LND-03` | `P1` | `Design + FE-Growth + QA` | `UX-022, UX-026, UX-027` | Add role-based entry cards and teacher value block with trust marker for child data safety. | Users can choose role path quickly and trust marker is visible near conversion sections. |
| `LND-04` | `P1` | `FE-Growth + BE/API + QA` | `UX-019, UX-023, UX-024, UX-029, UX-030` | Show schedule widget, mini FAQ, and real proof blocks; label preview metrics as non-realtime. | Landing shows competition schedule and all non-live metrics are clearly labeled. |
| `LND-05` | `P1` | `FE-Growth + QA` | `UX-094, UX-095` | Optimize landing visuals and reduce heavy blur effects on mobile. | Mobile render is smooth and media assets are optimized with no major visual regression. |

## Login Page (`/login`)
| ID | Priority | Owner | UX Ref | Task | Definition of Done |
|---|---|---|---|---|---|
| `LGN-01` | `P0` | `FE-Core + QA` | `UX-033, UX-034, UX-039, UX-041` | Add realtime validation, inline field errors, input format hints, and focus to first invalid field. | Invalid submit always highlights the first failing field with inline guidance. |
| `LGN-02` | `P1` | `Design + FE-Core + BE/API + QA` | `UX-037, UX-035` | Add faster student login variant and improve PIN interaction with privacy guidance. | Student login is faster and PIN interaction is clearer and safer. |
| `LGN-03` | `P1` | `FE-Core + QA` | `UX-040, UX-042` | Add first-login onboarding trigger and consistent back/forward interaction behavior. | First successful login can trigger onboarding and auth flow navigation feels predictable. |

## Register Page (`/register`)
| ID | Priority | Owner | UX Ref | Task | Definition of Done |
|---|---|---|---|---|---|
| `REG-01` | `P1` | `FE-Core + QA` | `UX-031, UX-032` | Keep persistent stepper and explicit draft-saved feedback for multi-step registration. | Stepper and saved-state indicator are visible and reliable on reload. |
| `REG-02` | `P1` | `Design + FE-Core + QA` | `UX-036, UX-039` | Reduce early-step field load and move optional fields later with better input hints. | Required fields are minimal per step and input examples are available. |
| `REG-03` | `P0` | `FE-Core + BE/API + QA` | `UX-044, UX-043` | Add final review-before-submit and dedicated pending verification state for school accounts. | Submit flow includes review stage and pending state screen is reachable after register. |
| `REG-04` | `P1` | `FE-Core + QA` | `UX-038, UX-041, UX-042` | Improve password guidance and validation behavior across all steps. | Password rules are explicit and step transitions prevent ambiguous errors. |

## Dashboard (`/dashboard`)
| ID | Priority | Owner | UX Ref | Task | Definition of Done |
|---|---|---|---|---|---|
| `DSH-01` | `P0` | `FE-Core + QA` | `UX-046, UX-047` | Make key stat cards clickable and clearly separate realtime vs preview data modules. | Each top KPI card navigates to detail and preview data is explicitly marked. |
| `DSH-02` | `P0` | `FE-Core + BE/API + QA` | `UX-048, UX-054, UX-055` | Add daily EXP target, mission board, and instant completion feedback. | User sees active goals, reset timing, and immediate visual feedback when complete. |
| `DSH-03` | `P1` | `Design + FE-Core + BE/API + QA` | `UX-049, UX-050, UX-058, UX-059` | Add continue-learning card, adaptive module recommendation, badge progress, and recent match history. | Dashboard shows next best action and recent progression summary. |
| `DSH-04` | `P1` | `FE-Core + QA` | `UX-052, UX-053, UX-056, UX-060` | Improve empty states, mentor support panel, timeframe filters, and compact mobile KPI layout. | Empty states drive clear actions and mobile dashboard remains legible and focused. |

## Duel Flow (`/game/duel`, `/lobby`, `/playing`, `/results`)
| ID | Priority | Owner | UX Ref | Task | Definition of Done |
|---|---|---|---|---|---|
| `DUL-01` | `P0` | `Design + FE-Game + QA` | `UX-070, UX-071, UX-072` | Simplify duel setup copy, collapse detailed rules, and sharpen practice vs competition distinction. | Setup page is concise and users can identify active mode instantly. |
| `DUL-02` | `P0` | `FE-Game + QA` | `UX-061, UX-062, UX-069` | Add pre-match countdown, persistent question progress, and estimated duration before start. | Countdown and progress are always visible; duration estimate appears before entering match. |
| `DUL-03` | `P0` | `FE-Game + BE/API + QA` | `UX-064, UX-068, UX-073` | Add network quality indicator, reconnect-safe rejoin flow, and useful waiting-state tips. | Disconnect can recover without data loss and waiting state is informative. |
| `DUL-04` | `P0` | `FE-Game + BE/API + QA` | `UX-065, UX-066, UX-074, UX-075` | Add report-question, one-click rematch, post-match analytics, and incorrect answer review. | Results page supports rematch and learning feedback in a single flow. |

## Leaderboard (`/leaderboard`)
| ID | Priority | Owner | UX Ref | Task | Definition of Done |
|---|---|---|---|---|---|
| `LDB-01` | `P0` | `FE-Core + QA` | `UX-076, UX-077` | Add quick presets for filters and persist user filter preferences. | Users can apply common filters fast and keep preference across sessions. |
| `LDB-02` | `P0` | `FE-Core + BE/API + QA` | `UX-078, UX-079` | Always show the current user's rank card and rank delta vs previous period. | Own-rank panel is visible even outside top 10 and includes movement delta. |
| `LDB-03` | `P1` | `Design + FE-Core + BE/API + QA` | `UX-080, UX-081, UX-082` | Add scoring formula help, seasonal/all-time split, and fair-play marker support. | Leaderboard explains scoring and clearly separates period contexts. |
| `LDB-04` | `P0` | `FE-Core + QA` | `UX-083, UX-084, UX-085` | Improve pagination, over-filtered empty states, and add direct CTA to start duel. | Pagination is easier to navigate and leaderboard always offers next action. |

## Materials (`/materials`, `/materials/[id]`)
| ID | Priority | Owner | UX Ref | Task | Definition of Done |
|---|---|---|---|---|---|
| `MAT-01` | `P1` | `FE-Core + BE/API + QA` | `UX-009, UX-049` | Add materials search and continue-last-module shortcut across materials pages. | User can search modules and continue previous progress from one click. |
| `MAT-02` | `P1` | `Design + FE-Core + QA` | `UX-093, UX-096, UX-097` | Simplify instructional language for younger students and improve loading states/prefetch. | Content is easier for SD audience and list/detail loading experience is smoother. |

## Sprint Assignment Proposal
| Sprint | Focus | Issues |
|---|---|---|
| `Sprint 1` | Conversion + Access foundations | `NAV-01`, `NAV-02`, `NAV-03`, `LND-01`, `LND-02`, `LGN-01`, `REG-03` |
| `Sprint 2` | Core engagement | `DSH-01`, `DSH-02`, `DUL-01`, `DUL-02`, `LDB-01`, `LDB-02`, `LDB-04` |
| `Sprint 3` | Scale-up and polish | `NAV-04`, `NAV-05`, `NAV-06`, `LND-03`, `LND-04`, `LND-05`, `LGN-02`, `LGN-03`, `REG-01`, `REG-02`, `REG-04`, `DSH-03`, `DSH-04`, `DUL-03`, `DUL-04`, `LDB-03`, `MAT-01`, `MAT-02` |

## Notes for PM and QA
- Every issue should include mobile and desktop acceptance screenshots.
- Every `P0` issue must include a regression checklist for auth, game flow, and leaderboard.
- Use issue labels: `uiux`, `page:<route>`, `priority:<p0|p1|p2>`, `owner:<team>`.

