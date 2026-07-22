# Meridian Property Partners

Property investment marketplace connecting investors and mortgage brokers
with vetted house-and-land opportunities from developers, tracked end to
end via the Settlement Accelerator. See `../docs/investment-platform/` for
the full PRD, architecture, database design, and user-flow diagrams.

**Meridian Property Partners is a working placeholder brand name** —
trivially find-replaceable once a final name/domain is chosen.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres,
Auth, Storage) — see `docs/investment-platform/ARCHITECTURE.md` for the
full rationale.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Supabase project (or run `supabase start` locally with the
   [Supabase CLI](https://supabase.com/docs/guides/local-development)),
   then apply the schema:

   ```bash
   supabase db push          # or `supabase db reset` locally, which also runs seed.sql
   ```

3. Copy `.env.example` to `.env.local` and fill in your Supabase project's
   URL and keys.

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Project layout

- `src/app/(marketing)` — public homepage.
- `src/app/get-started` — investor onboarding questionnaire.
- `src/app/investor`, `src/app/broker`, `src/app/developer`, `src/app/admin`
  — role-gated portals (real path segments, not route groups, to avoid
  URL collisions between roles that would otherwise share a path like
  `/dashboard`).
- `src/lib/matching` — the deterministic matching/scoring/explanation
  engine (`ARCHITECTURE.md` §5).
- `src/lib/settlement-accelerator` — the 9-stage journey model.
- `supabase/migrations` — the full database schema, including Row-Level
  Security policies (the actual authorization boundary — see
  `ARCHITECTURE.md` §4).

## Status

Implemented: database schema + RLS (including Storage bucket policies),
role-based auth (investor passwordless OTP; broker/developer/admin
password), homepage, investor onboarding, deterministic matching engine,
investor dashboard (matches, saved, compare, browse/filter, Settlement
Accelerator tracker, consultation booking), broker portal (client roster,
referral-link + manual linking, journey stage-advance, listing sharing,
referral pipeline), developer portal (project/listing creation, image/
document upload, submit-for-review), and admin portal (approval queue,
investor/broker/developer management, analytics dashboard).

Not yet built, per the PRD's "Future Features" (§8): automated commission
calculation, LLM-generated match explanations (v1 uses the template layer
described in `ARCHITECTURE.md` §5.3), the AI chatbot/suburb-summary
Edge Functions, and automated follow-up emails. Also untested against a
live Supabase project — no project has been provisioned in this session,
so the migrations are unapplied and RLS has not been exercised against
real Postgres.
