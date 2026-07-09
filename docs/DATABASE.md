# PropertyConnect — Database Schema Explanation

**Companion to:** `prisma/schema.prisma` (source of truth for the model)
**Status:** Draft v1.0

This document explains every table in the schema, how they relate, and the reasoning behind the less obvious design choices. It supersedes the illustrative schema sketch in `docs/ARCHITECTURE.md` §3 wherever the two differ — naming was tightened to match this task's requested entity list: `Enquiry → Lead`, `ProfessionalProfile → Partner`, `Match → LeadAssignment`, `EnquiryEvent → LeadStatusHistory`.

**Toolchain note:** the schema is pinned to **Prisma ORM 6.x**, not the newly-released 7.x. Prisma 7 removes `url`/`directUrl` from `datasource` in favor of a separate `prisma.config.ts` and driver-adapter-based connections — a real paradigm shift, not a syntax tweak, and one the wider ecosystem (Auth.js's Prisma adapter, community examples, most current tutorials) hasn't fully caught up to yet. Pinning to 6.x keeps the schema-embedded `DATABASE_URL`/`DIRECT_URL` pattern already assumed in `docs/ARCHITECTURE.md` §8.1 and §8.8. Revisit this pin once the ecosystem stabilizes around 7.x. The schema in this repo has been validated (`prisma validate`, `prisma format`, `prisma generate`) against Prisma 6.19.3.

---

## 1. Entity overview

Every table the task asked for is present, plus a small number of supporting tables that are structurally unavoidable (join tables, Auth.js's required models, invoice line items) or previously committed to (`AdminActionLog`, from the security posture in `docs/ARCHITECTURE.md` §7). Each is called out below.

| Requested entity | Table(s) in schema | Notes |
|---|---|---|
| Users | `User`, `Account`, `Session`, `VerificationToken` | Last three are Auth.js's required schema |
| Consumers | `Consumer` | |
| Partners | `Partner` | Base table for every professional type |
| Agents | `Agent` | 1:1 extension of `Partner` |
| Mortgage brokers | `MortgageBroker` | 1:1 extension of `Partner` |
| Inspectors | `Inspector` | 1:1 extension of `Partner` |
| Conveyancers | `Conveyancer` | 1:1 extension of `Partner` |
| Leads | `Lead` | Plus `ConsentRecord`, `LeadSuburbPreference` |
| Properties | `Property` | |
| Suburbs | `Suburb` | Plus `PartnerServiceArea` join |
| Lead assignments | `LeadAssignment` | |
| Lead status history | `LeadStatusHistory` | |
| Appointments | `Appointment` | |
| Transactions | `Transaction` | |
| Referral agreements | `ReferralAgreement` | |
| Payments | `Payment` | |
| Invoices | `Invoice` | Plus `InvoiceLineItem` |
| Notes | `Note` | |
| Documents | `Document` | |
| Notifications | `Notification` | |
| Analytics | `AnalyticsDailyMetric` | Precomputed rollups, see §10 |

---

## 2. Users & authentication

**`User`** is the Auth.js identity table — anyone who logs in has exactly one row here, regardless of whether they're a consumer, a partner, or an admin. `role` is a coarse authorization enum (`CONSUMER | PARTNER | SUPPORT_ADMIN | ADMIN`); which *kind* of partner someone is lives on `Partner.type`, not here, keeping the auth-level role small and stable while partner categories can grow.

`passwordHash` is nullable because consumers (per the PRD's frictionless-intake requirement) never set a password — if they ever authenticate, it's via magic link. Partners and admins always have one, enforced at the application layer during onboarding, not by the schema (a DB-level constraint here would have to be conditional on `role`, which Prisma/Postgres can't express cleanly without a trigger — not worth it for this).

`Account`, `Session`, `VerificationToken` are Auth.js's own required models, included verbatim — don't rename or restructure these, the adapter depends on the exact shape.

---

## 3. Consumers

**`Consumer`** is deliberately decoupled from `User`. Per the PRD, most consumers submit a lead and never create an account — forcing every lead through the auth system would add friction to the one flow that most needs to stay frictionless. `Consumer.userId` is nullable and only gets populated if/when a consumer later opts into self-service status tracking (a future feature).

`email`/`phone`/`name` live directly on `Consumer` rather than requiring a `User` row, so duplicate-detection and re-contact can work immediately at submission time regardless of whether an account ever exists.

---

## 4. Partners and type-specific extensions

**`Partner`** holds everything common to *any* professional on the platform: business identity (`businessName`, `abn`), licensing state (`licenseNumber`, `licenseStatus`), operational fields that drive matching (`active`, `capacity`, `responseRateScore`, `avgResponseMins`), and every relation that doesn't differ by professional type (service areas, lead assignments, appointments, transactions, referral agreements, invoices, payments, notes, documents, notifications).

**`Agent`, `MortgageBroker`, `Inspector`, `Conveyancer`** are 1:1 extensions — each holds only the handful of fields specific to that profession:
- `Agent.agentType` distinguishes selling agents from buyers agents from partners who do both, so a single table covers what would otherwise be two overlapping professional categories.
- `MortgageBroker.creditLicenseNumber` captures the ACL/ACR number — this is the field the NCCP-compliance requirement in the PRD hinges on; a Finance lead should never route to a broker without one verified.
- `Inspector.inspectionTypes` and `Conveyancer.practicingCertificateNumber` are similarly narrow.

**Design pattern: table-per-type extension, not a single polymorphic table with a JSON blob.** Each professional type has a genuinely small, stable field set and (unlike leads, which change fast during early product iteration) these fields are unlikely to churn — real, indexable, foreign-key-capable columns are worth the four extra tables here. This is a deliberate contrast with the `Lead.payload` JSON approach in §7 — normalize where fields are stable and few, use JSON where fields are numerous and still evolving.

**Known gap, intentionally left open:** the platform's full persona list (from the earlier product discussion) also includes **Property Managers** and a fully distinct **Buyers Agent** matching flow, neither of which was in this task's requested entity list. `Agent.agentType = BUYERS` covers buyers agents adequately for now (they share the same field shape as selling agents). Property management is *not* modeled with its own extension table — a `PROPERTY_MANAGEMENT` lead currently has nowhere correct to route unless an `Agent` is manually tagged as also offering that service, which is a real product gap, not an oversight to gloss over. Recommend adding a `PropertyManager` extension table (mirroring the other four) before `PROPERTY_MANAGEMENT` leads go live for real — flagged here rather than silently patched over.

---

## 5. Suburbs and properties

**`Suburb`** is a reference/lookup table (name, postcode, state, LGA, reporting region) that replaces the free-text suburb/postcode strings from the earlier architecture sketch. Normalizing this matters for three things that all depend on exact, consistent suburb identity: partner service-area coverage matching, a buyer's multi-suburb preference list, and suburb-level analytics rollups. `@@unique([name, postcode, state])` — not just `name` — because suburb names are not nationally unique (and even within a state, rare postcode splits exist).

**`Property`** is a first-class entity, not a JSON blob on `Lead`, because the same physical property legitimately shows up across multiple leads over time (a homeowner sells it — `SELL` lead — and years later a new owner wants it professionally managed — `PROPERTY_MANAGEMENT` lead) and because `Transaction` needs a stable property reference independent of any one lead. `Lead.propertyId` is nullable because `BUY` leads usually don't have a specific property yet at creation time — the consumer is searching, not transacting on a known address (see `LeadSuburbPreference` in §7 for how "where" is captured for that case instead).

**`PartnerServiceArea`** is the join table between `Partner` and `Suburb` — a partner covers zero or more suburbs; the matching engine's core query (§4.3/§4.6 of `docs/ARCHITECTURE.md`) is essentially "find active, verified partners of type X whose `PartnerServiceArea` includes this lead's suburb and who have `capacity` remaining."

---

## 6. Leads

**`Lead`** is the central table — every consumer journey (Sell/Buy/Finance/Other Services) produces one row here, distinguished by `type`. Fields that every matching/reporting/admin query actually filters or sorts on are real, indexed columns: `type`, `status`, `consumerId`, `propertyId`, `createdAt`. Everything journey-specific — estimated value and selling timeframe for `SELL`, budget range and finance status for `BUY`, income and deposit for `FINANCE`, required-by date for `INSPECTION`, and so on — lives in `payload Json`.

This hybrid (a handful of real columns + a JSON payload) is a deliberate carry-over from the reasoning in `docs/ARCHITECTURE.md` §3.1: the fields that gate routing and admin filtering need to be indexed relational columns; the fields that are numerous, per-journey-specific, and will keep changing as the product iterates don't need seven near-duplicate tables to hold them. The **documented payload shape per type** (application-level contract, enforced by the zod schemas referenced in the architecture doc, not by the database):

| `type` | Expected `payload` keys |
|---|---|
| `SELL` | `estimatedValue`, `sellingTimeframe`, `currentSituation` |
| `BUY` | `budgetMin`, `budgetMax`, `financeStatus`, `buyingTimeframe` |
| `FINANCE` | `purchasePrice`, `deposit`, `income`, `financeRequirements` |
| `INSPECTION` | `inspectionType`, `requiredByDate` |
| `CONVEYANCING` | `transactionType`, `expectedSettlementDate` |
| `PROPERTY_MANAGEMENT` | `currentStatus`, `desiredManagementStartDate` |

**`ConsentRecord`** is a separate table, 1:1 with `Lead`, rather than boolean flags on `Lead` itself — because what needs to be provable later isn't just "did they consent" but *exactly what text they agreed to and when* (`textVersion`, `acceptedAt`, `ipAddress`). This is the audit evidence the PRD's NCCP/Privacy-Act requirements (FR-5, NFR table) depend on; a mutable boolean on `Lead` couldn't survive a future edit to the consent copy without losing what was actually agreed to at submission time.

**`LeadSuburbPreference`** is the many-to-many between `Lead` and `Suburb`, used specifically by `BUY` leads (a buyer can prefer several suburbs) — modeled as a real join table rather than an array of suburb names in `payload`, because it needs to participate in matching queries ("find agents covering *any* of this buyer's preferred suburbs"), which a JSON array can't do efficiently or safely (no referential integrity against `Suburb`).

**`sourceLeadId`** (self-relation, `LeadCrossSell`) records when a lead was created via a cross-sell prompt from another lead (e.g. a `BUY` lead spawning a `FINANCE` lead per PRD FR-2) — preserves the origin without needing a separate cross-sell tracking table.

---

## 7. Lead assignment and status history

**`LeadAssignment`** represents one attempt to route a lead to one partner. A lead can accumulate several of these over its life (assigned → declined/expired → re-routed → assigned to the next partner) — this is why it's a separate table from `Lead` rather than a `currentPartnerId` column: the history of *who was tried and what happened* is itself required data (for professional response-rate scoring, and for resolving "I never got this lead" disputes). `slaDeadline` plus the `[status, slaDeadline]` index is exactly what the SLA-timeout sweep job queries against.

**`LeadStatusHistory`** is the append-only audit trail for status transitions specifically — `fromStatus`/`toStatus`/`actorType`/`actorId`/`note`, one row per transition, never updated or deleted. This is narrower than the more general `EnquiryEvent` concept from the earlier architecture sketch (renamed and refocused per this task's naming), on the reasoning that free-text commentary now has its own home in `Note` (§9) — `LeadStatusHistory` stays strictly structured (status-to-status), which keeps it cheap to query for the timeline view and safe to partition by date at scale (per `docs/ARCHITECTURE.md` §8.3).

---

## 8. Appointments

**`Appointment`** covers any scheduled, time-boxed interaction tied to a lead — an agent's appraisal visit, an inspector's site visit, a broker's phone consultation. It links to both `Lead` and `Partner` directly (not only through `LeadAssignment`) because an appointment is meaningful even if queried independently of assignment history, but it also optionally references the specific `LeadAssignment` it came from, so "show me everything that happened under this particular assignment" stays answerable.

`type` and `status` are separate enums (`AppointmentType` vs `AppointmentStatus`) rather than one combined enum, since the two vary independently — an `INSPECTION` appointment can be `SCHEDULED`, `COMPLETED`, or `NO_SHOW` just as easily as an `APPRAISAL` can.

---

## 9. Transactions, referral agreements, invoices, payments

This is the revenue-critical cluster — the part of the schema that turns "a lead converted" into "money is owed and collected."

**`ReferralAgreement`** is the *contract*: what fee structure applies to a given partner for a given lead type (`FLAT`, `PERCENTAGE`, or `TIERED`, with `minFee`/`maxFee` guardrails), and for what date range (`effectiveFrom`/`effectiveTo`). This exists as its own table — separate from the transaction that eventually references it — because fee terms can be negotiated per partner and can change over time; a `Transaction` needs to record *which* agreement (and therefore which terms) applied at the time, not just today's default rate.

`partnerId` is **nullable**: `partnerId = null` represents the platform's default fee for that `leadType`, seeded by `prisma/seed.ts`; a non-null `partnerId` represents a partner-specific negotiated override. The fee-service resolves partner-specific first, falling back to the default row — see `docs/FEE_SCHEDULE.md` for the actual default numbers and the full resolution algorithm.

**`Transaction`** is the *outcome record* — a specific sale, purchase, loan, completed inspection, completed conveyancing job, or signed management agreement, linked to the `Lead` that produced it, the `Property` and `Partner` involved, and the `ReferralAgreement` whose terms apply. `referralFeeOwed` is the computed amount once the agreement's terms are applied to `transactionValue` — computed and stored (not derived on every read) because it needs to survive the agreement itself later changing.

`status` (`PENDING → UNCONDITIONAL → SETTLED`, or `FELL_THROUGH`) exists because — as flagged in the earlier CTO-level risk analysis — a transaction that looked done can still collapse (finance declined, contract falls over) after a fee was already anticipated; `FELL_THROUGH` is a first-class state, not a deletion.

**`Invoice`** aggregates one or more transactions' referral fees into a single billable document per partner, with **`InvoiceLineItem`** as the necessary child table connecting each line back to the `Transaction` it came from (an invoice needs line-item detail; a bare `Invoice.total` wouldn't let a partner or admin see which specific deals it covers). This wasn't in the requested entity list by name but is structurally required for `Invoice` to mean anything beyond a total dollar figure.

**`Payment`** is the actual money-movement record against an `Invoice` — separate from `Invoice` itself because an invoice can be partially paid, disputed, or paid via multiple installments/methods in principle, and because payment processor reconciliation (`reference`) is a different concern from billing.

**Why four tables instead of one "fees" table:** each answers a different question — *what are the terms* (`ReferralAgreement`), *what happened and what's owed* (`Transaction`), *what was billed* (`Invoice`/`InvoiceLineItem`), *what was actually paid* (`Payment`) — and each of those states can legitimately be true independently (a transaction can settle with a fee owed before any invoice is raised; an invoice can be sent and go unpaid past its due date). Collapsing these into one table would force awkward nullable fields for whichever stage hasn't happened yet.

---

## 10. Notes, documents, notifications, analytics

**`Note`** and **`Document`** share the same structural pattern: **multiple nullable foreign keys** (`leadId?`, `partnerId?`, `transactionId?`, and `propertyId?` for documents) rather than a single polymorphic `(entityType, entityId)` pair. Postgres/Prisma can't enforce referential integrity on a stringly-typed polymorphic reference — a typo'd `entityType` or a dangling `entityId` would fail silently. With a small, fixed set of attachable entities, explicit nullable FKs cost a few unused columns per row but keep every reference real and checkable by the database. The application layer enforces "exactly one of these is set" (documented invariant, not a DB constraint — Prisma doesn't support conditional check constraints declaratively; this could be added as a raw SQL `CHECK` in a migration if it becomes a real data-quality problem in practice).

**`Notification`** logs every outbound email/SMS, following the same multi-nullable-FK pattern for its recipient (`consumerId?`, `partnerId?`, `userId?` for admins) plus an optional `leadId` for context. `providerMessageId` and `status` (`QUEUED → SENT → DELIVERED/FAILED/BOUNCED`) are what the Resend/Twilio webhook handlers (`docs/ARCHITECTURE.md` §9.1–9.2) update as delivery events arrive.

**`AnalyticsDailyMetric`** is a precomputed rollup table, not a raw event log — raw event capture is PostHog's job (`docs/ARCHITECTURE.md` §9.3), and duplicating that into the primary transactional database would be redundant and would put analytics write load on the same database the matching engine depends on for correctness. This table exists for the metrics that need to sit *alongside* transactional data for SQL-level reporting/joins the admin console needs (e.g. "leads created per suburb per day," "conversion rate by lead type") without recomputing expensive aggregations on every dashboard load — populated by a scheduled job, not written to in the request path.

`AnalyticsDailyMetric.partnerId` is deliberately a plain string with **no foreign key**, unlike `suburbId` which does have one. This is intentional, not an inconsistency: `Suburb` rows are permanent reference data that will essentially never be deleted, so a hard FK is safe; `Partner` rows may eventually need to be deleted for compliance reasons (e.g. a data-deletion request), and historical analytics rollups should survive that even if the underlying partner record doesn't — a hard FK would force an awkward choice between blocking the deletion or cascading it into rewriting historical reporting data.

---

## 11. Admin audit (supporting table)

**`AdminActionLog`** wasn't in this task's requested entity list, but is included because `docs/ARCHITECTURE.md` §7 already committed to it as a security control ("a compromised admin session or an internal bad actor can't quietly rewrite history"). It logs admin-initiated actions specifically (`REASSIGN_LEAD`, `VERIFY_LICENSE`, `VERIFY_FEE`, `SUSPEND_PARTNER`, …) as a append-only complement to `LeadStatusHistory`, which only captures lead-status transitions, not every admin action (e.g. suspending a partner touches no `Lead` row at all, and would otherwise go unlogged).

---

## 12. Relationship summary (ERD in prose)

```
User 1───1 Consumer            User 1───1 Partner
User 1───* Account, Session

Partner 1───1 Agent | MortgageBroker | Inspector | Conveyancer   (exactly one, by Partner.type)
Partner *───* Suburb   (via PartnerServiceArea)

Suburb 1───* Property
Suburb *───* Lead       (via LeadSuburbPreference — BUY leads only)

Consumer 1───* Lead
Property 1───* Lead              (nullable — BUY leads often have none)
Lead 1───1 ConsentRecord
Lead 1───* Lead                  (self-relation: cross-sell origin)

Lead 1───* LeadAssignment ───* Partner
Lead 1───* LeadStatusHistory
Lead 1───* Appointment ───* Partner
Lead 1───* Transaction ───* Partner, ─── Property, ─── ReferralAgreement

Partner 0───* ReferralAgreement       (partner-specific overrides; partnerId IS NULL rows are platform defaults)
ReferralAgreement 1───* Transaction

Partner 1───* Invoice 1───* InvoiceLineItem ─── Transaction
Invoice 1───* Payment ─── Partner

Lead | Partner | Transaction | Property  ◄──(nullable FKs)── Note
Lead | Partner | Transaction | Property  ◄──(nullable FKs)── Document
Lead | Consumer | Partner | User(admin)  ◄──(nullable FKs)── Notification

Suburb, LeadType, Partner(soft ref) ── AnalyticsDailyMetric (rollup, no lead-level FK)
```

---

## 13. Open items carried forward

- **Property Manager and dedicated Buyers Agent extension tables** are not yet modeled (see §4) — needed before `PROPERTY_MANAGEMENT` leads or distinct buyers-agent matching go live for real, per the earlier PRD's noted future scope.
- **`Note`/`Document`'s "exactly one parent FK" invariant** is enforced at the application layer only; add a Postgres `CHECK` constraint via a raw migration if this proves error-prone in practice.
- **Referral fee calculation logic** (turning a `ReferralAgreement`'s `feeType`/`percentageRate`/`flatAmount` into `Transaction.referralFeeOwed`) — **resolved**, see `docs/FEE_SCHEDULE.md` for the default fee schedule and the resolution algorithm `lib/services/fee-service.ts` implements.
- **Prisma 7 migration** — revisit the version pin in §0 once Auth.js's adapter and the broader ecosystem have caught up to the new `prisma.config.ts`/driver-adapter model.
