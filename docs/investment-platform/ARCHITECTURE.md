# Meridian Property Partners — Technical Architecture

**Status:** Draft v1.0
**Owner:** Engineering
**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Supabase (Postgres · Auth · Storage · Edge Functions) · Resend (email) · Vercel · OpenAI API (AI layer, v2) · PostHog
**Design target:** national launch (all AU states/suburbs are data, not hardcoded), hundreds of listings, low-thousands of investor accounts at MVP scale with headroom for 10x

> Companion documents: `PRD.md` (this folder), `DATABASE_SCHEMA.md`, `USER_FLOWS.md`. This document assumes familiarity with the PRD's functional requirements (FR-1…FR-16) and Settlement Accelerator stage model.

---

## 1. Architecture overview

Meridian is a single Next.js application (App Router) deployed on Vercel, backed by Supabase (managed Postgres + Auth + Storage), with four distinct authenticated/public surfaces sharing one codebase:

1. **Public marketing surface** — homepage, unauthenticated, must convert well and load fast.
2. **Investor surface** — onboarding (semi-public: creates the account) + authenticated dashboard.
3. **Broker surface** — authenticated, client-roster-scoped.
4. **Developer surface** — authenticated, own-projects-scoped.
5. **Admin surface** — authenticated, platform-wide, highest-privilege.

As with PropertyConnect's architecture, we separate **request/response work** (rendering pages, validating and persisting a submitted form, running the deterministic matching scorer) from **asynchronous work** (email notifications, AI suburb-summary generation/refresh, Settlement Accelerator notification fan-out, scheduled re-matching batches). Given the Supabase-centred stack requested for this product, asynchronous work is handled by **Supabase Edge Functions** triggered via **Postgres triggers → `pg_net`/`pg_cron`**, rather than introducing a separate job-runner service — this keeps the platform to two managed dependencies (Vercel, Supabase) instead of three, which is the right tradeoff at Meridian's MVP scale. If job complexity grows materially (retry/backoff orchestration, long-running AI pipelines), revisit introducing a dedicated runner (e.g. Inngest, as PropertyConnect uses) as a v2 decision — the service-layer boundary below is designed so that swap doesn't touch route/page code.

```
                         ┌───────────────────────┐
                         │   Vercel Edge/CDN      │
                         └──────────┬─────────────┘
                                    │
                    ┌───────────────────────────────┐
                    │   Next.js App (App Router)     │
                    │  ── marketing / investor /     │
                    │     broker / developer / admin │
                    │     route groups               │
                    │  ── Server Actions + Route      │
                    │     Handlers (thin)             │
                    └───────┬───────────────┬─────────┘
                            │               │
                 ┌──────────▼───┐   ┌───────▼─────────────┐
                 │  Service      │   │  Supabase client      │
                 │  layer (lib)  │   │  (RLS-enforced reads/  │
                 │  incl. match  │   │  writes, Auth, Storage)│
                 │  scorer       │   └───────┬────────────────┘
                 └──────┬────────┘           │
                        │            ┌────────▼─────────┐
                        │            │  Postgres (Supabase)│
                        │            │  + RLS policies      │
                        │            │  + triggers → pg_cron │
                        │            └────────┬─────────────┘
                        │                     │
                 ┌──────▼──────┐      ┌───────▼────────────┐
                 │  Resend      │      │  Supabase Edge Fns  │
                 │  (email)     │      │  (async: notify,    │
                 └──────────────┘      │  AI summaries, batch │
                                       │  re-match)           │
                                       └───────┬───────────────┘
                                               │
                                        ┌──────▼──────┐
                                        │  OpenAI API  │
                                        │  (v2 AI layer)│
                                        └──────────────┘

  PostHog: client + server event capture (funnel: homepage → onboarding → dashboard → consultation → Settlement Accelerator stage progression).
```

**Why this shape:** the highest-value property for this product is "an investor's match results and Settlement Accelerator status are always trustworthy and current" — the deterministic matching scorer must be fast enough to run inline (§5), while notification fan-out and AI content generation must not block the request path and must be retried safely if Resend/OpenAI have a transient failure. RLS-enforced Postgres access (rather than an application-level authorization layer bolted on top) gives the strongest guarantee against the FR-15 requirement that a broker can never read another broker's clients, even via a bug in application code.

---

## 2. Folder structure

```
meridian/
├── supabase/
│   ├── migrations/                       # timestamped SQL migrations (see DATABASE_SCHEMA.md)
│   ├── functions/                        # Edge Functions (Deno)
│   │   ├── send-notification/
│   │   ├── generate-suburb-summary/
│   │   ├── generate-match-explanation/   # v2: LLM upgrade path, see §5.3
│   │   ├── run-batch-rematch/
│   │   └── send-followup-email/
│   ├── seed.sql
│   └── config.toml
├── src/
│   ├── app/
│   │   ├── (marketing)/
│   │   │   ├── page.tsx                  # homepage
│   │   │   ├── faq/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (onboarding)/
│   │   │   ├── get-started/page.tsx      # questionnaire, multi-step client component
│   │   │   └── layout.tsx
│   │   ├── (investor)/
│   │   │   ├── layout.tsx                # auth-gated, role=investor
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── listings/page.tsx         # browse/filter (FR-5)
│   │   │   ├── listings/[listingId]/page.tsx
│   │   │   ├── compare/page.tsx
│   │   │   ├── saved/page.tsx
│   │   │   ├── journey/page.tsx          # Settlement Accelerator tracker
│   │   │   ├── consultation/page.tsx
│   │   │   └── profile/page.tsx          # edit onboarding answers
│   │   ├── (broker)/
│   │   │   ├── layout.tsx                # auth-gated, role=broker
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── clients/page.tsx
│   │   │   ├── clients/[investorId]/page.tsx
│   │   │   ├── referrals/page.tsx
│   │   │   └── marketing-material/page.tsx
│   │   ├── (developer)/
│   │   │   ├── layout.tsx                # auth-gated, role=developer
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── projects/page.tsx
│   │   │   ├── projects/[projectId]/page.tsx
│   │   │   └── projects/[projectId]/listings/[listingId]/edit/page.tsx
│   │   ├── (admin)/
│   │   │   ├── layout.tsx                # auth-gated, role=admin
│   │   │   ├── dashboard/page.tsx        # analytics, FR-16
│   │   │   ├── approvals/page.tsx        # listing approval queue, FR-9
│   │   │   ├── investors/page.tsx
│   │   │   ├── brokers/page.tsx
│   │   │   ├── developers/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── login/page.tsx
│   │   ├── broker-login/page.tsx
│   │   └── api/
│   │       ├── webhooks/resend/route.ts
│   │       └── og/route.tsx              # dynamic OG images for shared listings
│   ├── components/
│   │   ├── ui/                           # shadcn/ui primitives
│   │   ├── marketing/                    # hero, trust-signals, testimonials, faq
│   │   ├── onboarding/                   # questionnaire step components
│   │   ├── listings/                     # listing card, gallery, comparison table
│   │   ├── journey/                      # Settlement Accelerator stepper
│   │   └── shared/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                 # browser client
│   │   │   ├── server.ts                 # server client (cookies-based session)
│   │   │   └── admin.ts                  # service-role client, server-only, narrow use
│   │   ├── matching/
│   │   │   ├── score.ts                  # deterministic scorer, §5.2
│   │   │   ├── explain.ts                # template explanation generator, §5.3
│   │   │   └── types.ts
│   │   ├── settlement-accelerator/
│   │   │   ├── stages.ts                 # stage enum + transition rules
│   │   │   └── events.ts
│   │   ├── auth/
│   │   │   ├── roles.ts                  # role guards, used in layouts + server actions
│   │   │   └── session.ts
│   │   ├── validation/                   # zod schemas per form (onboarding, listing, etc.)
│   │   └── email/
│   │       └── templates/
│   ├── actions/                          # Server Actions, grouped by domain
│   │   ├── onboarding.ts
│   │   ├── listings.ts
│   │   ├── broker.ts
│   │   ├── developer.ts
│   │   ├── admin.ts
│   │   └── settlement-accelerator.ts
│   └── types/
│       └── database.ts                   # generated from Supabase schema (supabase gen types)
├── public/
├── middleware.ts                         # session refresh + route-group auth gate
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

**Route-group rationale:** each `(role)` route group has its own `layout.tsx` performing the auth/role check server-side before rendering any child route — this is the first of two enforcement layers (the second is RLS at the database level, §4), so a bug in one layer doesn't expose data on its own.

---

## 3. Tech stack detail

| Layer | Choice | Rationale |
|---|---|---|
| Frontend framework | Next.js 15 (App Router), React 19, TypeScript | Matches brief; Server Components keep investor/broker/admin dashboards fast without shipping unnecessary client JS; Server Actions replace hand-rolled API routes for most mutations. |
| Styling/UI | Tailwind CSS + shadcn/ui | Matches brief; shadcn's unstyled-primitive approach avoids the "cheap template" look the brief explicitly warns against — every component is themeable to the premium design direction (§9). |
| Backend/data | Supabase (Postgres) | Matches brief explicitly. Gives Postgres (relational integrity for the referral/journey ledger requirements), RLS (role-scoped data access enforced at the DB layer), Auth, and Storage in one managed product. |
| Auth | Supabase Auth (email+password, magic link, MFA for admin) | Matches brief's role-based requirement; integrates directly with RLS via `auth.uid()`/custom claims, avoiding a second identity system to keep in sync. |
| Storage | Supabase Storage (buckets: `listing-images`, `listing-documents`, `developer-assets`) | Co-located with the rest of the backend; signed URLs give time-boxed access to gated content (e.g. brochures) per FR-4. |
| Background/async | Supabase Edge Functions + `pg_cron`/`pg_net` triggers | Keeps infra surface minimal at MVP scale (§1); revisit if job complexity grows. |
| Email | Resend | Transactional email for onboarding confirmation, consultation booking, Settlement Accelerator stage-change notifications, follow-up emails (FR-14). |
| AI | OpenAI API (behind a narrow service interface in `lib/ai/`) | Used for FR-12 (chatbot), FR-13 (suburb summaries), and the v2 upgrade path for FR-3 explanations — always called server-side, never with unconstrained user-supplied prompts reaching the model without grounding context injected by the service layer (see §8). |
| Hosting | Vercel (frontend), Supabase managed cloud (backend) | Matches brief's "modern scalable architecture"; both scale horizontally without infra ops overhead at Meridian's stage. |
| Analytics | PostHog | Funnel analytics (homepage → onboarding → match → consultation → settlement) feeding the admin analytics dashboard (FR-16) and marketing attribution. |
| Validation | Zod, shared between client forms and Server Actions | Single source of truth for onboarding/listing/etc. field validation, avoids client/server drift. |

---

## 4. Authentication & role-based access control

### 4.1 Roles
Exactly one role per user account, stored on a `profiles` row keyed to `auth.users.id` (see `DATABASE_SCHEMA.md` §1): `investor`, `broker`, `developer`, `admin`. Role is set at account creation and is admin-reassignable only (FR-15).

### 4.2 Enforcement layers
1. **Route-group layout guard** (`src/app/(role)/layout.tsx`): reads the session server-side, redirects if role doesn't match the route group. Fast-fail, good UX, *not* the security boundary on its own.
2. **Row-Level Security (Postgres)**: the actual security boundary. Every table that holds role-scoped data has RLS enabled with policies keyed off `auth.uid()` and role-lookup helper functions (e.g. `is_broker_of(investor_id uuid)`, defined in `DATABASE_SCHEMA.md` §7). This means even a Server Action bug that queries too broadly still can't return another broker's client data — Postgres itself refuses the row.
3. **Service-role client** (`lib/supabase/admin.ts`): used only in a small, audited set of server-only paths (e.g. admin impersonation-view, batch matching Edge Function) that must legitimately bypass RLS. Every such use is logged to `audit_log` with actor and reason, per the NFR auditability requirement.

### 4.3 RBAC matrix (high-level; full policy-by-table detail in `DATABASE_SCHEMA.md` §7)

| Resource | Investor | Broker | Developer | Admin |
|---|---|---|---|---|
| Own investor profile | RW | R (only if linked client) | — | RW |
| Other investors' profiles | — | — | — | RW |
| Listings (published) | R | R | R (own only, all statuses) | RW |
| Listings (draft/pending, not own) | — | — | — | RW |
| Own project/listings (any status) | — | — | RW | RW |
| Broker's own client roster | — | RW (own clients) | — | RW |
| Settlement Accelerator journey | R own, limited-stage-advance actions (e.g. confirm handover received) | R/limited-W for linked clients (e.g. confirm finance assessment, contract signed) | — | RW |
| Referral records | — | R own | — | RW |
| Admin approval queue | — | — | — | RW |

### 4.4 Investor account creation without friction
Per FR-2/FR-15, an investor completing onboarding gets an account created transparently (Supabase Auth magic-link/OTP tied to the email captured in step 1 of the questionnaire) — no separate "create a password" step blocks them from seeing their first match.

---

## 5. Matching engine

### 5.1 Design goal
Ship a matching engine in MVP that is **fast, deterministic, and fully explainable**, with a service boundary that lets FR-3's explanation layer be swapped for LLM-generated copy later without touching the scoring logic, the database schema, or any calling code (dashboard, batch re-match job all call the same `lib/matching/score.ts` + `lib/matching/explain.ts` interface).

### 5.2 Scoring algorithm (v1, deterministic)

```
type MatchInput = {
  investor: InvestorPreferences;   // budget, deposit, states[], suburbs[], growthVsYield (0-100), timeframe, financeStatus
  listing: PublishedListingAttributes;
};

Eligibility filter (hard cut, listing excluded entirely if any fail):
  listing.price <= investor.budget
  listing.depositRequired <= investor.depositAvailable
  listing.status == 'PUBLISHED'

Score components (each normalised 0-1, then weighted):
  growthFit   = normalisedGrowthDriverScore(listing) * (investor.growthVsYield / 100)
  yieldFit    = normalisedYieldScore(listing)         * (1 - investor.growthVsYield / 100)
  locationFit = 1.0 if listing.suburb in investor.preferredSuburbs
              else 0.6 if listing.state in investor.preferredStates
              else 0.0   // excluded upstream in practice, kept for partial-match cases (empty suburb list)
  timeframeFit = timeframeAlignment(listing.completionTimeline, investor.timeframe)  // closer alignment scores higher, per a fixed lookup table

  totalScore = (growthFit * 0.35) + (yieldFit * 0.35) + (locationFit * 0.20) + (timeframeFit * 0.10)
```

Weights are a named, single-source-of-truth constant (`lib/matching/score.ts`), not scattered magic numbers — tuning them is a one-file change, and every weight change is expected to be logged/versioned (`matches.scoring_version` column, see `DATABASE_SCHEMA.md` §4) so historical explanations remain internally consistent with the weights that actually produced them.

`normalisedGrowthDriverScore` / `normalisedYieldScore` read from structured listing fields (`growth_driver_score`, `expected_yield`) set at listing-submission time (developer-entered, admin-reviewable) rather than inferred — this keeps v1 fully deterministic and auditable, per NFR auditability.

### 5.3 Explanation generation (v1 template, v2 LLM-ready)

v1 (`lib/matching/explain.ts`) builds a short explanation string from the *specific score components that drove the ranking*, using a template, e.g.:

> "This matches your ${budget} budget and ${deposit} deposit, and is weighted toward {growth|cash flow} — {listing-specific growth-driver or yield fact}, which is what you told us matters most."

This directly implements the worked example in PRD §4.2. The template consumes the same structured `MatchScoreBreakdown` object a v2 LLM-based generator would consume (score components + the specific listing facts that contributed) — so the v2 swap is: replace the template call with a call to `generate-match-explanation` (an Edge Function that prompts an LLM with that same structured breakdown, grounded, non-hallucinatory, and caches the result). No caller of `explain()` needs to change.

### 5.4 Execution model
- **Inline (request path):** runs synchronously on onboarding completion and on-demand profile edits (target <3s per NFR table) — acceptable because it's a bounded scan over published listings (hundreds, not millions, at Meridian's scale) with simple arithmetic, no LLM call in the v1 path.
- **Batch (async):** a scheduled Edge Function (`run-batch-rematch`, triggered via `pg_cron`, e.g. every 6 hours or on listing publish/price-change webhook) re-scores all active investor profiles against the current published-listing set, so a newly published listing surfaces to already-onboarded investors without them needing to re-submit anything.

---

## 6. Settlement Accelerator implementation

- **State model:** a fixed 9-stage enum (`settlement_stage`, see `DATABASE_SCHEMA.md` §5) with an append-only `settlement_stage_events` table — the journey's "current stage" is a derived value (latest event), never a mutable column that could silently lose history, matching the NFR data-integrity requirement.
- **Stage-advance authorization:** each stage transition has an allowed-actor set encoded in `lib/settlement-accelerator/stages.ts` (e.g. Stage 3→4 Finance Assessment→Property Selection can be advanced by broker or admin, not by investor directly, to keep the record broker-verified; Stage 8→9 Handover→Property Management can be admin- or developer-confirmed). This mirrors the RBAC matrix in §4.3 but is enforced again at the RLS/policy level on `settlement_stage_events` inserts (§7 in the database doc), not just in application code.
- **Visibility:** a Postgres view (`investor_journey_view`) joins the latest event per journey and is what dashboards query, rather than each surface re-deriving "current stage" independently.
- **Notifications:** every insert into `settlement_stage_events` fires a trigger that enqueues a `send-notification` Edge Function call (investor + broker, if linked), keeping the notification logic out of the three-plus call sites that can create a stage event (investor action, broker action, admin action, developer construction-update).

---

## 7. Storage strategy

| Bucket | Contents | Access policy |
|---|---|---|
| `listing-images` | Gallery images per listing | Public-read (published listings only; enforced by only ever generating/serving URLs for published listings from the app layer, since Storage RLS can't easily see cross-table publish status — app-layer gate is the practical control here) |
| `listing-documents` | Floor plans, brochures | Signed URL, time-boxed (e.g. 1 hour), issued only after the requesting investor's profile-completion check (FR-4) passes server-side |
| `developer-assets` | Developer logos, marketing collateral for broker "download marketing material" (broker portal) | Authenticated (broker/admin) read, developer-owner write |

All uploads validated server-side for MIME type and size before a Storage object is created (developer portal, FR-8) — never trust client-declared content-type alone.

---

## 8. AI features architecture

### 8.1 Guardrail principle (applies to every AI feature)
All AI calls are server-side only, behind `lib/ai/` service functions that **inject grounding context** (the investor's own data, the listing's published attributes, cached suburb facts) into the prompt and constrain the model to that context. No AI feature is a bare pass-through chat surface — this is both a product-quality requirement (FR-3, FR-12, FR-13: explanations must be accurate, not fabricated) and a compliance requirement (NFR: no unlicensed financial/credit advice).

### 8.2 AI suburb summaries (FR-13)
- Generated by an Edge Function (`generate-suburb-summary`), triggered on-demand the first time a suburb is referenced by a published listing and absent from `ai_suburb_summaries`, then refreshed on a schedule (e.g. monthly) rather than per page view — controls cost/latency and gives admin a stable, reviewable artifact rather than regenerating (and potentially drifting) content on every request.
- Cached row includes the prompt/context version used, so a later prompt-quality improvement can selectively invalidate stale summaries.

### 8.3 AI investor assistant chatbot (FR-12)
- MVP scope: a grounded assistant answering from three context sources only — (1) the logged-in investor's own profile/matches/journey, (2) the published attributes of a listing being viewed, (3) cached suburb summaries. Every response is generated with that context explicitly assembled server-side and passed to the model; the model is not given open internet/browsing tools.
- Any query pattern-matched or classified as advice-seeking (loan structuring, "should I buy this," tax/legal questions) triggers a fixed deflection response directing to a consultation booking (FR-11), not a model-generated answer — this is a hard rule in the service layer, not left to prompt instructions alone, since prompt-only guardrails are not compliance-reliable.

### 8.4 Match explanations (v2 upgrade path)
Covered in §5.3 — the v1→v2 swap point is intentionally isolated to one function.

### 8.5 Automated follow-up emails (FR-14)
- MVP ships the trigger/queue/logging mechanism (Postgres trigger on time-since-onboarding-without-booking → Edge Function → Resend, logged to `email_automation_log`) with fixed, product-written templates — not AI-generated content in v1. AI-personalised follow-up copy is a Future item (PRD §8), sequenced after the deflection/guardrail pattern in §8.3 is proven, since automated outbound content carries more compliance risk than a request-scoped chat reply.

---

## 9. Design system notes (supporting PRD's "premium, financial-services" direction)
- Typography-led, generous white space, restrained motion (per brief's explicit "avoid excessive animations") — shadcn/ui defaults themed with a custom Tailwind palette (deep navy/charcoal + a single confident accent, not a real-estate-template palette of blues/oranges).
- Every listing card and dashboard module treated as a "premium card" component (`components/listings/ListingCard.tsx`, `components/shared/StatCard.tsx`) reused across investor/broker/admin surfaces for visual consistency.
- Strong, singular CTAs per screen (mirrors brief's "strong calls to action" direction) rather than competing buttons.

---

## 10. Deployment & environments
- **Environments:** `local` (Supabase CLI local stack), `preview` (Vercel preview deploy + Supabase branch/preview DB per PR, if available on plan — otherwise a shared staging Supabase project), `production`.
- **Migrations:** `supabase/migrations/*.sql`, applied via `supabase db push` in CI before a production deploy; schema changes are never applied by hand against production.
- **Secrets:** OpenAI/Resend/Supabase service-role keys stored in Vercel/Supabase project env vars, never in the repo; service-role key usage restricted to the narrow server-only paths in §4.2.
- **CI:** typecheck, lint, and (once test suite exists) unit tests for `lib/matching` and `lib/settlement-accelerator` (pure functions, high-value to test given their compliance/audit role) gate merges to the deploy branch.

---

## 11. Observability
- PostHog funnel events at each meaningful step (homepage CTA click → onboarding step completed → match viewed → consultation booked → each Settlement Accelerator stage reached) feed both product analytics and the admin dashboard (FR-16).
- Structured logging from Edge Functions (notification sends, AI calls, batch re-match runs) to Supabase's log explorer; alerting on Edge Function failure rate and on `admin approval queue age` exceeding a threshold (an aging queue is a leading indicator of developer-side churn risk).
