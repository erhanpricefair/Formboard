# Compliance & Safety — AU Home Energy & Retrofit Professionals Directory

This document explains how the application prevents misleading conduct and manages user data, mapped to the
guardrails in the product brief. It is written for engineers and reviewers, not consumers — the consumer-facing
policy is `src/app/privacy-policy/page.tsx`.

**Status:** MVP scaffold. Before this goes to production, an actual lawyer should review the Privacy Policy copy,
the ACL claim list, and the data retention schedule — this document describes the *mechanisms*, not legal advice.

---

## 1. Non-misleading architecture (ACL s18 / s29)

**Risk:** absolute or unsubstantiated claims ("guaranteed savings," "best installer," "government approved") in
professional profiles or platform copy could constitute misleading or deceptive conduct, or false representations
about performance/approval, under the *Australian Consumer Law*.

**Mechanism — defense in depth, two independent layers:**

1. **Application layer.** `src/lib/validations/banned-claims.ts` defines a regex pattern list of high-risk phrases
   (absolute guarantees, superlatives, false-urgency, false-endorsement). `src/lib/validations/professional.ts`
   (`professionalProfileSchema`) runs every free-text field a professional controls — business name, tagline, bio —
   through `findBannedClaim` via a Zod `superRefine`. A profile save is rejected with a specific reason before it
   ever reaches the API route's database call (`src/app/api/professionals/route.ts`).
2. **Database layer.** The same pattern list is seeded into `banned_claims_patterns` (migration
   `0001_init.sql`), and a `BEFORE INSERT OR UPDATE` trigger (`reject_promotional_hype`) on `professionals`
   re-checks `business_name`, `tagline`, and `bio` against it. This is the layer that matters if a script, a
   future admin tool, or a bug bypasses the API route — the database itself refuses the write. The pattern list is
   an editable table, not a code constant, so compliance/legal can update it without a deploy.

**Other non-misleading-conduct measures:**
- Every public page that could be mistaken for a professional's own marketing carries the mandatory Transparency
  Notice (`src/components/TransparencyNotice.tsx`): *"This platform is an independent directory. Leads are
  forwarded to participating professionals; we do not provide installation services or financial advice."* It
  appears in the site footer (every page), on every professional profile page, and on the lead capture form itself.
- The professional profile page (`src/app/professionals/[id]/page.tsx`) explicitly disclaims that pricing/savings
  claims are self-reported and unverified, and tells the consumer to get an independent itemised quote.
- The site footer disclaims that licensing/ABN details are self-reported and verified on a best-efforts basis, and
  tells consumers to confirm current licensing directly with the relevant state authority.
- No page implies a professional is "recommended," "endorsed," or "the best match" — the directory is browse-and-
  choose, not an algorithmic match presented as a personal recommendation.

**What this does not do:** it cannot catch every possible misleading statement (subtlety, context, or claims made
off-platform, e.g. in a phone call) — it catches the patterns known at write time. `banned_claims_patterns` should
be reviewed and extended periodically, and profile verification (§3) is the human backstop.

---

## 2. Privacy-by-design (Privacy Act 1988, Australian Privacy Principles)

**Explicit consent, not pre-ticked:**
- The lead capture form (`src/components/LeadCaptureForm.tsx`) renders two mandatory checkboxes — consent to
  contact, and consent to data sharing with the specific professional — both `unchecked` by default and enforced
  server-side as `z.literal(true)` in `leadCaptureSchema` (`src/lib/validations/lead.ts`). The form cannot be
  submitted, at the API layer, without both.
- Marketing consent is a **separate, genuinely optional** checkbox (`consentMarketing`), defaulting to false and
  never required to submit an enquiry — this is deliberate: bundling marketing consent with the ability to get help
  is itself a form of misleading/unfair practice.
- Consent is captured with a timestamp, IP address, user agent, and the exact privacy policy version in effect at
  the time (`leads.privacy_policy_version`, `leads.consent_captured_at`), and also written to an **append-only**
  `consent_log` table (§3.4 of the schema) — `leads` only holds current state, so `consent_log` is what lets us
  answer "what did this person actually agree to, and when" even after later changes (e.g. an unsubscribe).

**Unsubscribe / withdrawal of consent:**
- `src/app/unsubscribe/page.tsx` + `src/app/api/unsubscribe/route.ts` implement a one-click, no-login-required
  unsubscribe flow, authenticated by an HMAC-signed token (`src/lib/services/unsubscribe-service.ts`) rather than a
  session — this is what makes it "clear and accessible" from an email link.
- Two scopes: "marketing only" (turns off `consent_marketing`, enquiry stays active) and "all" (also withdraws
  contact/data-share consent and archives the lead, i.e. `leads.status = 'archived'`). Every unsubscribe event is
  itself logged to `consent_log` as a `withdrawal` row and to the `unsubscribes` table.

**Privacy policy link:**
- `src/app/privacy-policy/page.tsx` explains what's collected, why, how it's shared (with the *specific*
  professional the consumer engaged, never broadcast to multiple competitors), verification, consent, rights, and
  retention. Linked from the footer of every page and from the lead form itself
  (`TransparencyNotice`).

**Minimal exposure by default:**
- `SUPABASE_SERVICE_ROLE_KEY` (which bypasses Row Level Security) is only importable from files marked
  `import "server-only"` — `src/lib/supabase/admin.ts` and everything under `src/lib/services/`. This is a
  build-time guarantee, not just a convention: a `server-only` import in a file that ends up in a client bundle is
  a Next.js build error.
- Row Level Security (migration `0001_init.sql`, §"Row Level Security") denies all access by default. A signed-in
  professional's browser session can only ever see: their own `professionals` row, `lead_tracking` rows where
  `professional_id` matches them, `leads` rows that have actually been shared with them (join through
  `lead_tracking`), their own `fee_transactions`, and audit rows for their own `lead_tracking`. There is no policy
  granting anon/authenticated access to `consent_log`, `unsubscribes`, or `banned_claims_patterns` at all — those
  are compliance/admin-only, service-role paths.
- The public directory only ever exposes the `public_professional_directory` view (verified + active rows, safe
  columns only — no ABN, no internal IDs beyond the public professional id).

---

## 3. Audit-ready data (dispute resolution & performance-based billing)

**Requirement:** every lead must be timestamped and logged with its conversion stage, because this is the
foundation for billing professionals on performance and for resolving "I never got this lead" / "that lead didn't
convert" disputes.

**Lifecycle model (two levels, deliberately separate):**

| Stage | Where it lives | Meaning |
|---|---|---|
| Captured | `leads.status = 'captured'` | Consumer submitted the form, consent recorded. Not yet billable. |
| Verified | `leads.status = 'verified'` | Phone number confirmed via SMS OTP (§4). |
| Shared | `leads.status = 'shared'`, `lead_tracking` row created | Forwarded to the one professional whose profile the consumer used. Lead fee charged. |
| New → Contacted → Inspection → Completed | `lead_tracking.status` (the literal enum from the brief) | Per-professional conversion funnel, updated by the professional from their dashboard. |

**Non-bypassable audit trail:** the `stamp_and_audit_lead_tracking` trigger on `lead_tracking` (migration
`0001_init.sql`) does two things on every status change, regardless of which client made the change:
1. Auto-stamps the relevant timestamp column (`first_contacted_at`, `inspection_booked_at`, `completed_at`) the
   first time a lead reaches that stage.
2. Inserts an immutable row into `lead_status_audit` recording the previous status, new status, who changed it
   (`auth.uid()`), their role, and when. Application code never writes to `lead_status_audit` directly — it can't
   be forgotten or skipped by a future code path, because it's a database trigger, not an application-layer
   `try`/`catch`.

This is what `src/app/dashboard/leads/[id]/page.tsx` renders as the "Audit trail" panel — a professional (and, via
the same table, an admin) can see the full history of a lead, not just its current state.

**Performance-based billing schema:** `fee_transactions` (migration `0001_init.sql`) is the ledger —
`fee_type` distinguishes the flat `lead_fee` (charged at Shared, `src/lib/services/fee-service.ts:chargeLeadFee`)
from the performance `success_commission` (calculated when a professional marks a lead Completed with a
self-reported outcome value, `recordSuccessCommission`). Each entry has its own `status` (`pending` → `invoiced` →
`paid`, or `disputed`) independent of the lead's own status, so billing state and conversion state can be
reconciled but aren't conflated.

**Fee-field integrity:** a professional can move their own lead through New → Contacted → Inspection → Completed
and attach a self-reported outcome value, but cannot set `lead_tracking.commission_amount` or `lead_tracking.
lead_cost` themselves — the `protect_fee_fields` trigger raises an exception on any such attempt where
`auth.role() <> 'service_role'`. Only the admin/service-role path (`fee-service.ts`, invoked server-side after the
professional's own RLS-scoped update succeeds) can write those fields. This is what makes the ledger trustworthy
for a professional disputing a bill: they could not have altered it themselves.

**Provisional vs. verified outcomes:** a self-reported "Completed" outcome value produces a `fee_transactions` row
in `pending` status, not `paid` — it is provisional until an admin verifies it (mirroring how any performance-fee
marketplace has to handle self-reported outcomes). Building the admin verification console itself is flagged as
follow-up work (see README "Not yet built").

---

## 4. Lead verification (basic contact verification)

**Why:** performance-based billing only works if professionals are actually paying for real contactable people —
unverified leads erode trust and cost professionals money for nothing.

**Mechanism:** `src/lib/services/verification-service.ts` generates a random 6-digit code, stores only its salted
SHA-256 hash (`leads.verification_code_hash`) with a 10-minute expiry, and sends it via SMS (default) or email
through a small provider abstraction (`src/lib/integrations/sms.ts`, `email.ts`) that falls back to a console
logger in development and switches to Twilio/Resend automatically once the relevant environment variables are set
— so there's no code branch to remember to flip for production.

- Maximum 5 incorrect attempts before the code is locked out (`verification_attempts`).
- A lead is only shared with a professional (`shareLeadWithProfessional` in `lead-service.ts`) — and only then is
  the lead fee charged — after `verification_status = 'verified'`. The API route enforces this
  (`src/app/api/leads/verify/route.ts`); there is no path that creates a `lead_tracking` row for an unverified lead.
- A honeypot field (`website`) on the public form silently accepts-but-drops obvious bot submissions without
  revealing that a spam check exists.

**What this does not do:** it is identity verification, not fraud-proofing — a determined bad actor with access to
a real phone number can still pass it. It is deliberately basic (matching the brief's "basic contact verification"
ask); a production system serving real commission-bearing leads should add rate limiting per IP/phone (see README)
and consider a third-party phone-validity check before SMS send to control cost.

---

## 5. Admin console

Migration `0002_admin.sql` and `src/app/admin/` implement the admin surface referenced throughout this document.

**Admin identity is not self-serve.** Access is membership in the `admins` table (`auth_user_id` → `auth.users.id`),
and there is no UI, API route, or RLS policy anywhere in the app that can insert a row into `admins` — it's
provisioned out-of-band by whoever holds direct database access (see README "Provisioning an admin"). Every admin
API route calls `requireAdmin()` (`src/lib/services/admin-service.ts`), which re-derives the caller's identity from
their own session (never trusts a client-supplied flag) and checks `admins` membership before doing anything
privileged.

**Professional verification** (`/admin/professionals`, `PATCH /api/admin/professionals/[id]/verification`) is the
only path that can move `professionals.verification_status` to `verified` — and therefore into the public
directory (`public_professional_directory` only shows `verified` + `active` rows). This closes a gap that existed
in the original `0001` RLS: `professionals_update_own` let a professional update *any* column on their own row,
including `verification_status` and `active`, i.e. a professional could have self-verified. Migration `0002`'s
`protect_verification_fields` trigger blocks that — verification/active fields can only change under
`auth.role() = 'service_role'` — independent of which route or client attempts the write, the same pattern already
used for fee fields (§3). Verified with a real Postgres instance: an `authenticated` session editing its own
tagline succeeds; the same session attempting to set `verification_status = 'verified'` on itself is rejected.

**Fee reconciliation** (`/admin/fees`, `PATCH /api/admin/fees/[id]/status`) moves a `fee_transactions` row through
`pending → invoiced → paid` (or `disputed` at any point, with a required reason). This is what turns a
professional's self-reported "Completed" outcome value (§3 "Provisional vs. verified outcomes") into an actual
invoiced, collectible amount — nothing is paid on a professional's say-so alone.

**Leads overview** (`/admin/leads`) is a read-only, platform-wide view across `lead_tracking` for the "who has this
lead and what happened to it" dispute-resolution requirement. It is deliberately read-only in this scaffold —
building reassignment (a professional's number bounces, a lead needs to move to someone else) requires deciding
commercial semantics this brief didn't specify (does the original lead fee get refunded? charged again to the new
professional? split?), so it's left as a flagged decision rather than guessed at.

**Admin read access without admin write access.** Migration `0002` adds RLS policies letting a session with an
`admins` row read `professionals` (any status), `leads`, `lead_tracking`, `lead_status_audit`, `fee_transactions`,
`consent_log`, and `unsubscribes` in full — but reading is all these policies grant. Every actual mutation an admin
performs still goes through the service-role client after `requireAdmin()`, so the trigger-enforced protections in
§2–3 apply to admin actions exactly the same as anyone else's; "admin" is a read-visibility and API-authorization
concept, not a bypass of the write-protection triggers.

---

## 6. What's still not built

- **Lead reassignment.** `/admin/leads` is read-only (see §5) — reassigning a lead to a different professional
  needs a commercial decision (refund/re-charge/split the lead fee) that this brief didn't specify.
- **Production-grade rate limiting** on the public `POST /api/leads` route. Currently just a honeypot field; add an
  IP/phone-based limiter (e.g. Upstash Ratelimit) before launch to stop SMS-bombing via the verification send.
- **Automated tests.** Given the compliance-sensitive surface, prioritize: `findBannedClaim` (banned-claims regex
  parity between Zod and the DB trigger), the `z.literal(true)` consent checks, and the three protective triggers
  (`protect_fee_fields`, `protect_verification_fields`, `stamp_and_audit_lead_tracking`) via a local Supabase
  instance or pgTAP — these were verified manually against a local Postgres instance while building this scaffold
  (see README "Verifying this scaffold") but that verification isn't repeatable/CI-enforced yet.
- **A live Supabase project.** Everything here has been verified against a locally-stubbed Postgres instance, not
  an actual hosted Supabase project or through the JS client's session-scoped requests — see README for exactly
  what that gap covers.
