# Vancouver Psychology Centre — Operations Dashboard

A privacy-first operations dashboard for a psychology practice, modelled on **Jane App**
practice-management data. It gives front-desk, clinical, marketing, and management staff a
role-appropriate view of intake, capacity, lead sources, and automation impact — without ever
shipping a raw client record to the browser.

**Live demo:** https://www.bavaro.org

> Portfolio project. All data is **synthetic** — a deterministic mock Jane App seed. No real
> client, appointment, or clinical information is used anywhere in this repository or the live
> site.

---

## Why it's interesting

The hard part of a clinic dashboard isn't the charts — it's showing useful numbers while keeping
individual-level health data off the wire. This project treats that as the central constraint:

- **Aggregates never leave the server.** A small dependency-free Node server runs the use cases
  in-process and exposes only per-panel aggregate view-models over `GET /api/panels/<id>`. The
  mock repositories and the raw seed JSON are server-side only — they are not in the client
  bundle. A build-time check (`scripts/assert-bundle-clean.mjs`) greps the compiled JS and fails
  if any raw row id or ISO timestamp pattern slips through.
- **Access is enforced before data is fetched.** An application-layer role→panel permission map
  both hides a denied panel and never loads it — no request fires for data a role may not see.
- **The audit log is aggregate-only.** It records role, panel, and timestamp for each permitted
  panel load — never personal or clinical data — and is viewable only by the management role.

This mirrors a PIPEDA-style "minimum necessary" posture: the browser receives counts and derived
figures, not the rows they came from.

## The dashboard

Five panels, gated by role (front desk, clinician, marketing, management):

| Panel | What it shows |
|-------|---------------|
| Headline metrics | New inquiries and inquiry-to-first-session time, period over period |
| Intake funnel | Cumulative inquiry → intake form → matched → first session, with drop-off |
| Lead sources | Share of new clients per acquisition source (sums to exactly 100%) |
| Clinician capacity | Booked percentage by specialty and current waitlist |
| Automation impact | Admin hours saved, forms auto-filed, reminders sent, sync-error health |

## Architecture

Clean Architecture, so the privacy boundary is a structural property, not a convention:

```
src/
  domain/          entities and role→panel access rules (no dependencies)
  application/     use cases that compute each panel's aggregates
  infrastructure/  mock Jane App + automation repositories, synthetic seed data
  presentation/    React panels, role gating, audit recording/view, design system wiring
  server/          node:http aggregate API + static host (the only tier that touches raw data)
```

## Tech stack

TypeScript · React · Vite · a framework-free `node:http` server · Vitest (unit/integration) ·
Playwright (e2e) · a token-based design system in `design-system/`.

## Running locally

```bash
npm install
npm run dev          # Vite client with an /api proxy to the server
npm run dev:server   # the aggregate API server on :3000 (run alongside)

npm run test         # unit + integration (Vitest)
npm run test:e2e     # Playwright
npm run build        # type-check + client build
```

## Deployment

Containerised and deployed to a self-hosted **k3s (Kubernetes)** cluster on arm64 (Raspberry Pi
nodes), served over HTTPS at https://www.bavaro.org.

- **Image** — multi-stage `node:26-alpine` Dockerfile built `linux/arm64`; the runtime stage
  carries only the build output and production dependencies and runs as the non-root `node` user.
- **Hardening** (`deploy/k8s/`) — `runAsNonRoot`, `readOnlyRootFilesystem`, all Linux
  capabilities dropped, `allowPrivilegeEscalation: false`, `seccompProfile: RuntimeDefault`,
  service-account token not mounted.
- **Networking** — Traefik ingress with cert-manager TLS and an apex→www redirect; NetworkPolicies
  restrict ingress to Traefik and egress to DNS only.
- **Scripts** — `deploy/build-push.sh` (build + push to the private registry) and
  `deploy/cutover.sh` (apply manifests, wait Ready, then an explicitly-confirmed site cutover).

## How it was built

Developed with Shipyard, an open-source Claude Code plugin for spec-driven agile sprints. Every
feature started as a written spec with acceptance criteria,
was broken into tasks and built test-first, and was checked by a separate reviewer agent against
the spec before release — with a person approving each step. The commit history follows that
sprint/task structure; see `CHANGELOG.md`.
