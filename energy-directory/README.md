# AU Home Energy & Retrofit Professionals Directory

A performance-based lead directory for Australian solar, battery, heat pump, insulation, and electrification
professionals — Next.js (App Router) + TypeScript + Tailwind + Supabase.

See [`COMPLIANCE_AND_SAFETY.md`](./COMPLIANCE_AND_SAFETY.md) for how consent, verification, ACL-safe copy, and the
lead audit trail are implemented.

## Stack

- **Next.js 14** (App Router), TypeScript, Tailwind CSS
- **Supabase** (Postgres + Auth). RLS-first: the service-role key is only ever used from `server-only`-guarded
  service modules; everything else runs under Row Level Security.
- **Zod** + `react-hook-form` for shared client/server validation, including the ACL "no promotional hype" check.
- Pluggable email (Resend) / SMS (Twilio) providers for OTP verification, with a console-logging dev fallback so
  the app runs without either configured.

## Getting started

```bash
cd energy-directory
npm install
cp .env.example .env.local   # fill in Supabase project URL + keys
npm run dev
```

### Database setup

1. Create a Supabase project.
2. Run the migration:

   ```bash
   psql "$DATABASE_URL" -f supabase/migrations/0001_init.sql
   # or: supabase db push (if using the Supabase CLI with a linked project)
   ```

3. Copy the project URL, anon key, and service-role key into `.env.local`.

### Auth

Professional sign-in uses Supabase's email magic link (`supabase.auth.signInWithOtp`) — no password to manage. A
signed-in user's `professionals` row is matched by `auth_user_id`; the first time someone signs in they'll be
prompted to complete their profile at `/dashboard/profile` (see `upsertProfessionalProfile`).

## Project structure

```
supabase/migrations/0001_init.sql   Schema, RLS, triggers (source of truth for the data model)
src/lib/validations/                Zod schemas — lead capture, professional profile, banned-claims list
src/lib/services/                   Server-only business logic (lead capture, verification, fees, profiles)
src/lib/supabase/                   client.ts (browser, RLS), server.ts (cookie-scoped, RLS), admin.ts (service-role)
src/app/(public pages)              Directory home, professional profile + lead form, privacy policy, unsubscribe
src/app/dashboard/                  Authenticated professional workspace — leads list, lead detail + status update, profile
src/app/api/                        Route handlers (lead capture/verify, status update, profile save, unsubscribe)
```

## Key flows

- **Consumer enquiry:** directory (`/`) → professional profile (`/professionals/[id]`) → `LeadCaptureForm` → `POST
  /api/leads` (captures + sends SMS code) → verify screen → `POST /api/leads/verify` (creates the `lead_tracking`
  row and charges the lead fee).
- **Professional status update:** `/dashboard` → `/dashboard/leads/[id]` → `LeadStatusUpdater` → `PATCH
  /api/leads/tracking/[id]/status`, RLS-scoped to the signed-in professional's own rows. Every transition is
  audit-logged by a database trigger independent of this route.
- **Unsubscribe:** emailed link → `/unsubscribe?token=...` → `POST /api/unsubscribe`, token is an HMAC (no login
  required), scoped to "marketing only" or "withdraw all consent."

## Not yet built (see COMPLIANCE_AND_SAFETY.md §5)

- Admin console: professional verification (ABN/license check), fee reconciliation/invoicing, dispute handling.
- Production-grade rate limiting on the public `/api/leads` route (currently a honeypot field only — add an
  IP/phone-based limiter, e.g. Upstash Ratelimit, before launch).
- Automated tests. Given the compliance-sensitive surface (consent, banned-claims validation, fee-field
  protection), prioritize tests for: `findBannedClaim`, the Zod consent literals, and the `protect_fee_fields` /
  `stamp_and_audit_lead_tracking` triggers (via a local Supabase instance or pgTAP).

## Verifying this scaffold

This was built in a sandboxed environment without live Supabase project credentials. What **was** verified here:

- `npm run typecheck`, `npm run lint`, and `npm run build` all pass cleanly.
- The migration (`supabase/migrations/0001_init.sql`) was applied to a real local Postgres 16 instance (with `auth.users`/`auth.uid()`/`auth.role()` stubbed to approximate Supabase) and exercised end to end: consent `CHECK` constraints reject an unconsented lead insert, the `reject_promotional_hype` trigger rejects a profile containing a banned claim (this caught a real bug — Postgres advanced regex uses `\y` for word boundaries, not `\b`, which the fix in this migration accounts for), `stamp_and_audit_lead_tracking` auto-stamps stage timestamps and writes an immutable audit row on every status change, and `protect_fee_fields` blocks a non-`service_role` update from touching `commission_amount`/`lead_cost` while still allowing a status-only update through.

What was **not** verified: an actual Supabase-hosted project (RLS policies were exercised via SQL directly, not via the JS client's session-scoped requests), the interactive browser flow (`npm run dev` end-to-end through the UI), and the Resend/Twilio integrations (only the console dev-fallback path is exercised by inspection). Run `npm install && npm run dev` against a real Supabase project and click through the consumer + dashboard flows before treating this as production-verified.
