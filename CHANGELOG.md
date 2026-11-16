# Changelog

## Sprint 001 — Dashboard foundation (2026-11-16)

A running dashboard reading from a deterministic mock Jane App, framed by a CSP-clean
shell, with the headline-metrics and clinician-capacity panels live.

### Added
- **F001 — Mock Jane App data layer.** Deterministic seeded store (seeded PRNG, fixed
  reference date) spanning a 90-day history plus a forward two-week window. Domain
  repository interfaces return aggregates only — no client name, clinical note, or raw
  timestamp crosses the boundary. Empty-range and before-window-clamp edges handled;
  the committed fixture regenerates byte-identical.
- **F002 — Dashboard shell & role-aware layout.** Header with the brand logo and the
  active role, five named panel slots, and per-slot loading, empty, and error states
  isolated so one failing panel never takes down the others. Self-hosted Source Serif 4
  and Inter fonts under a `default-src 'self'; style-src 'self' 'unsafe-inline'` content
  security policy, proven CSP-clean and styled by a Playwright spec.
- **F003 — Headline metrics panel.** Four metric cards — new inquiries, inquiry to first
  session, clinician utilization, no-show rate — each with its change versus the prior
  30 days and direction, the 80–90% utilization target band, and a no-data state rather
  than a divide-by-zero.
- **F006 — Clinician capacity panel.** Booked percentage per specialty over the forward
  two weeks, the waitlist total and dominant specialty, near-full specialties visually
  distinguished, and a no-capacity state distinct from 0% booked.

### Notes
- Clean Architecture layering holds: the application layer depends only on domain; the
  mock adapter is the sole reader of raw rows.
- Header typography and the logo match the live Vancouver Psychology Centre site.
