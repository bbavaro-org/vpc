# Changelog

## Sprint 002 — Five-panel dashboard & role-based privacy model (2026-11-16)

Completed the five-panel dashboard and added the role-based access and PIPEDA-aggregation
privacy model.

### Added
- **F004 — Intake funnel panel.** Cumulative conversion funnel across inquiry → intake
  form completed → matched to clinician → first session booked: the first stage counts
  every inquiry received in the window and each later stage counts those who reached at
  least that stage, so counts are monotonically non-increasing. Per-gap drop-off with the
  single largest drop marked, and a data-anomaly state that flags rather than renders a
  negative.
- **F005 — Lead source attribution panel.** Share of new clients per acquisition source
  (Google search, physician referral, insurance/EAP, social media, word of mouth) using
  largest-remainder rounding that sums to exactly 100%, ordered largest-first with stable
  ties, and an empty state when there are no new clients.
- **F007 — Automation impact panel.** Admin hours saved, intake forms auto-filed,
  appointment reminders sent, and cross-system sync errors; a non-zero sync-error count is
  visually flagged as needing attention, distinct from the healthy state.
- **F008 — Role-based access & PIPEDA aggregation.** Demo role switcher (front desk,
  clinician, marketing, management); an application-layer role→panel permission map that
  both hides denied panels and never loads them (no data request fires for a panel a role
  can't see); an aggregated audit log holding only role, panel, and timestamp — no personal
  or clinical data — recorded once per permitted panel load; a cross-role no-PII regression
  guard; and a management-only audit view that opens as its own screen with back navigation.

### Notes
- The intake funnel was corrected during review from a current-stage snapshot to a true
  cumulative funnel.
- The audit view gained its own screen and a "Back to dashboard" control, now covered by
  Playwright navigation tests.
- Backlog (IDEA-001): wire the Playwright e2e suite into an automated gate, and add a
  danger/alert color token to the design system.

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
