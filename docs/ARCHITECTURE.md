# PropertyConnect — Technical Architecture

**Status:** Draft v1.0
**Owner:** Engineering
**Stack:** Next.js (App Router) · TypeScript · Tailwind · shadcn/ui · Next.js API routes · PostgreSQL (Neon) · Prisma · Auth.js · Vercel · Resend · Twilio · PostHog · OpenAI API · Inngest (background jobs)
**Design target:** hundreds of thousands of leads/enquiries, Melbourne launch → national scale

---

## 1. Architecture overview

PropertyConnect is a single Next.js application (App Router) deployed on Vercel, backed by a managed PostgreSQL database, with three categories of surface:

1. **Public consumer surface** — intake forms (Sell/Buy/Finance/Other Services), unauthenticated, high traffic, must stay fast and resilient to spam/bot load.
2. **Professional workspace** — authenticated, moderate traffic, read/write heavy on a narrow slice of data (their own leads).
3. **Admin console** — authenticated, low traffic, broad read access, sensitive write access (fees, verification, reassignment).

The system deliberately separates **request/response work** (serving pages, validating and persisting a submitted enquiry) from **asynchronous work** (matching, notification dispatch, SLA timeout re-routing, AI enrichment). Next.js API routes on Vercel are serverless functions with bounded execution time — they are well suited to "validate and persist," poorly suited to "orchestrate a multi-step workflow with retries and delays." That asynchronous work is handled by a durable background job runner — **Inngest** (decision and rationale in §8.8) — rather than by long-running API route handlers.

```
                         ┌───────────────────────┐
                         │   Vercel Edge/CDN     │
                         └──────────┬────────────┘
                                    │
                    ┌───────────────────────────────┐
                    │   Next.js App (App Router)     │
                    │  ── pages / server components  │
                    │  ── API route handlers (thin)  │
                    └───────┬───────────────┬────────┘
                            │               │
                 ┌──────────▼───┐   ┌───────▼─────────┐
                 │  Service      │   │  Background job  │
                 │  layer (lib)  │   │  runner (Inngest) │
                 └──────┬────────┘   └───────┬───────────┘
                        │                    │
        ┌───────────────┼────────────────────┼───────────────┐
        │               │                    │               │
  ┌─────▼─────┐   ┌─────▼──────┐      ┌──────▼─────┐   ┌─────▼─────┐
  │ PostgreSQL │   │  Resend    │      │   Twilio   │   │  OpenAI   │
  │ (Prisma)   │   │  (email)   │      │   (SMS)    │   │  API      │
  └────────────┘   └────────────┘      └────────────┘   └───────────┘

  PostHog: client + server event capture, wired through both the app and job runner.
```

**Why this shape:** the highest-value property this architecture needs is "an enquiry, once submitted, is never lost or silently dropped" — matching, notifications, and SLA re-routing must survive a serverless function timing out, a third-party API being briefly down, or a deploy happening mid-flow. A durable job runner with retries gives us that; hand-rolled `setTimeout`/fire-and-forget calls from an API route do not.

---

## 2. Folder structure

```
propertyconnect/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (marketing)/                  # public marketing pages
│   │   │   └── page.tsx
│   │   ├── (consumer)/                   # public intake journeys
│   │   │   ├── sell/page.tsx
│   │   │   ├── buy/page.tsx
│   │   │   ├── finance/page.tsx
│   │   │   ├── services/
│   │   │   │   ├── inspection/page.tsx
│   │   │   │   ├── conveyancing/page.tsx
│   │   │   │   └── property-management/page.tsx
│   │   │   └── confirmation/[enquiryId]/page.tsx
│   │   ├── (professional)/
│   │   │   ├── layout.tsx                # auth-gated layout, role=PROFESSIONAL_*
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── leads/[matchId]/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── (admin)/
│   │   │   ├── layout.tsx                # auth-gated layout, role=ADMIN|SUPPORT_ADMIN
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── enquiries/[id]/page.tsx
│   │   │   ├── professionals/page.tsx
│   │   │   ├── professionals/[id]/page.tsx
│   │   │   └── fees/page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── enquiries/
│   │   │   │   ├── sell/route.ts         # POST — public, rate-limited
│   │   │   │   ├── buy/route.ts
│   │   │   │   ├── finance/route.ts
│   │   │   │   └── other-services/route.ts
│   │   │   ├── professional/
│   │   │   │   ├── leads/route.ts        # GET list
│   │   │   │   └── leads/[matchId]/
│   │   │   │       ├── accept/route.ts
│   │   │   │       ├── decline/route.ts
│   │   │   │       ├── status/route.ts
│   │   │   │       └── outcome/route.ts
│   │   │   ├── admin/
│   │   │   │   ├── enquiries/route.ts
│   │   │   │   ├── enquiries/[id]/reassign/route.ts
│   │   │   │   ├── professionals/route.ts
│   │   │   │   ├── professionals/[id]/verify/route.ts
│   │   │   │   └── fees/[id]/verify/route.ts
│   │   │   ├── webhooks/
│   │   │   │   ├── twilio/route.ts       # signature-verified
│   │   │   │   └── resend/route.ts       # signature-verified
│   │   │   └── jobs/
│   │   │       └── inngest/route.ts      # single endpoint, Inngest serves fn registry
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                           # shadcn/ui primitives (generated, lightly wrapped)
│   │   ├── forms/                        # AddressAutocomplete, BudgetRangeInput, etc.
│   │   ├── consumer/                     # journey-specific composed components
│   │   ├── professional/
│   │   └── admin/
│   ├── lib/
│   │   ├── db.ts                         # Prisma client singleton (see §8 on pooling)
│   │   ├── auth.ts                       # Auth.js config
│   │   ├── rbac.ts                       # permission checks, see §6
│   │   ├── validations/                  # zod schemas, shared client+server
│   │   │   ├── enquiry.ts
│   │   │   └── professional.ts
│   │   ├── services/                     # business logic, framework-agnostic
│   │   │   ├── enquiry-service.ts
│   │   │   ├── matching-service.ts
│   │   │   ├── notification-service.ts
│   │   │   ├── fee-service.ts
│   │   │   └── ai-service.ts             # OpenAI abstraction, see §9.4
│   │   ├── integrations/
│   │   │   ├── resend.ts
│   │   │   ├── twilio.ts
│   │   │   ├── posthog.ts
│   │   │   └── openai.ts
│   │   ├── jobs/                         # Inngest function definitions
│   │   │   ├── client.ts
│   │   │   ├── run-matching.ts
│   │   │   ├── check-sla-timeouts.ts
│   │   │   ├── send-notification.ts
│   │   │   └── enrich-enquiry-ai.ts
│   │   └── rate-limit.ts                 # Upstash Ratelimit wrapper
│   ├── middleware.ts                     # edge middleware: rate limiting, auth redirects
│   └── types/
├── .env.example
└── package.json
```

**Rationale for a few choices:**
- **Route groups `(consumer)/(professional)/(admin)`** keep three very different auth/layout/traffic profiles cleanly separated without leaking into the URL path.
- **`lib/services/` is framework-agnostic** — API routes and Inngest job functions both call into the same service layer, so business logic (e.g. "what does it mean to accept a match") is defined once, not duplicated between the HTTP handler and the background job.
- **`lib/validations/` shared client+server** — the same zod schema drives `react-hook-form` client validation and server-side validation in the route handler, so the two can never drift.
- A single `api/jobs/inngest/route.ts` endpoint is standard for Inngest — it serves the function registry; individual job logic lives in `lib/jobs/*`, not inline in the route.

---

## 3. Database design

### 3.1 Design decision: hybrid normalized + JSONB for enquiry payloads

Four journey types (Sell/Buy/Finance) plus three Other Services sub-types have different field sets, and more will be added over time. Two options: (a) one table per enquiry type, or (b) one `Enquiry` table with a `payload JSONB` column holding type-specific fields, validated at the application layer by the zod schemas in `lib/validations/enquiry.ts`.

**Decision: (b), with common cross-type fields promoted to real columns.** Fields every enquiry shares — and every one that matching, filtering, or reporting needs to query on — are real indexed columns (`type`, `status`, `suburb`, `postcode`, `createdAt`, `consumerId`). Everything else (estimated value, selling timeframe, income band, inspection type, etc.) lives in `payload`. This avoids seven near-identical tables and seven near-identical API paths while keeping the queries that actually run at scale (matching, dashboards) on indexed columns rather than JSONB traversal. A GIN index on `payload` covers the rarer ad-hoc admin search.

### 3.2 Core schema (Prisma)

```prisma
// --- Auth.js required models -------------------------------------------

model User {
  id            String    @id @default(cuid())
  email         String?   @unique
  phone         String?   @unique
  emailVerified DateTime?
  name          String?
  image         String?
  role          Role      @default(CONSUMER)
  createdAt     DateTime  @default(now())

  accounts      Account[]
  sessions      Session[]
  professional  ProfessionalProfile?
  adminActions  AdminActionLog[]

  @@index([role])
}

model Account {
  // standard Auth.js Account fields (provider, providerAccountId, tokens...)
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

enum Role {
  CONSUMER
  AGENT
  BUYERS_AGENT
  BROKER
  INSPECTOR
  CONVEYANCER
  PROPERTY_MANAGER
  SUPPORT_ADMIN
  ADMIN
}

// --- Professional side ---------------------------------------------------

model ProfessionalProfile {
  id                String    @id @default(cuid())
  userId            String    @unique
  user              User      @relation(fields: [userId], references: [id])
  businessName      String
  abn               String
  serviceType       EnquiryType   // AGENT/BROKER etc. map 1:1 to the enquiry types they serve
  licenseNumber     String?
  licenseStatus     LicenseStatus @default(PENDING)
  active            Boolean       @default(false)
  capacity          Int           @default(10)   // max concurrent open leads
  responseRateScore Float         @default(1.0)  // decays on timeout/decline, feeds routing priority
  avgResponseMins   Int?

  serviceAreas      ProfessionalServiceArea[]
  matches           Match[]
  referralFees      ReferralFee[]

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([serviceType, active])
}

enum LicenseStatus {
  PENDING
  VERIFIED
  REJECTED
  SUSPENDED
}

model ProfessionalServiceArea {
  id             String   @id @default(cuid())
  professionalId String
  professional   ProfessionalProfile @relation(fields: [professionalId], references: [id], onDelete: Cascade)
  suburb         String
  postcode       String
  state          String   @default("VIC")

  @@unique([professionalId, postcode])
  @@index([postcode])
  @@index([suburb])
}

// --- Consumer / Enquiry ---------------------------------------------------

model ConsumerProfile {
  id        String   @id @default(cuid())
  email     String?
  phone     String?
  name      String?
  createdAt DateTime @default(now())
  enquiries Enquiry[]

  @@index([email])
  @@index([phone])
}

enum EnquiryType {
  SELL
  BUY
  FINANCE
  INSPECTION
  CONVEYANCING
  PROPERTY_MANAGEMENT
}

enum EnquiryStatus {
  NEW
  MATCHING
  ASSIGNED
  ACCEPTED
  IN_PROGRESS
  OUTCOME_PENDING
  CLOSED_WON
  CLOSED_LOST
  UNMATCHED
  UNSERVICEABLE
  WITHDRAWN
}

model Enquiry {
  id           String        @id @default(cuid())
  type         EnquiryType
  status       EnquiryStatus @default(NEW)
  consumerId   String
  consumer     ConsumerProfile @relation(fields: [consumerId], references: [id])

  suburb       String
  postcode     String
  state        String        @default("VIC")
  payload      Json          // type-specific fields, see §3.1

  sourceEnquiryId String?    // set when created via cross-sell (e.g. Buy -> Finance)

  consentRecordId String?    @unique
  consentRecord   ConsentRecord? @relation(fields: [consentRecordId], references: [id])

  matches      Match[]
  events       EnquiryEvent[]
  referralFees ReferralFee[]

  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  @@index([type, status])
  @@index([postcode])
  @@index([createdAt])
  @@index([status, createdAt])   // admin dashboard's primary query pattern
}

model ConsentRecord {
  id           String   @id @default(cuid())
  textVersion  String
  consentType  String   // e.g. "GENERAL_CONTACT", "FINANCIAL_DISCLOSURE"
  acceptedAt   DateTime @default(now())
  ipAddress    String
  enquiry      Enquiry?
}

// --- Matching / routing ---------------------------------------------------

enum MatchStatus {
  ASSIGNED
  ACCEPTED
  DECLINED
  EXPIRED
  WITHDRAWN
}

model Match {
  id             String      @id @default(cuid())
  enquiryId      String
  enquiry        Enquiry     @relation(fields: [enquiryId], references: [id])
  professionalId String
  professional   ProfessionalProfile @relation(fields: [professionalId], references: [id])
  status         MatchStatus @default(ASSIGNED)
  slaDeadline    DateTime
  assignedAt     DateTime    @default(now())
  respondedAt    DateTime?
  assignedBy     String?     // "SYSTEM" or admin userId, for audit

  @@index([enquiryId])
  @@index([professionalId, status])
  @@index([status, slaDeadline])   // SLA-timeout sweep query
}

// --- Audit log (append-only) ----------------------------------------------

model EnquiryEvent {
  id        String   @id @default(cuid())
  enquiryId String
  enquiry   Enquiry  @relation(fields: [enquiryId], references: [id])
  type      String   // CREATED, MATCHED, ACCEPTED, STATUS_UPDATE, OUTCOME_RECORDED, REASSIGNED, ...
  actorType String   // SYSTEM | CONSUMER | PROFESSIONAL | ADMIN
  actorId   String?
  metadata  Json?
  createdAt DateTime @default(now())

  @@index([enquiryId, createdAt])
}
// Note on scale: this is the fastest-growing table (multiple events per enquiry).
// Partitioned by month at scale — see §8.3.

// --- Referral fee ledger ---------------------------------------------------

enum FeeStatus {
  PENDING_VERIFICATION
  VERIFIED
  DISPUTED
  VOIDED
  PAID
}

model ReferralFee {
  id             String    @id @default(cuid())
  enquiryId      String
  enquiry        Enquiry   @relation(fields: [enquiryId], references: [id])
  professionalId String
  professional   ProfessionalProfile @relation(fields: [professionalId], references: [id])
  status         FeeStatus @default(PENDING_VERIFICATION)
  amount         Decimal   @db.Decimal(10, 2)
  evidence       Json?
  verifiedById   String?
  verifiedAt     DateTime?
  createdAt      DateTime  @default(now())

  @@index([status])
  @@index([professionalId, status])
}

// --- Admin audit -------------------------------------------------------------

model AdminActionLog {
  id        String   @id @default(cuid())
  adminId   String
  admin     User     @relation(fields: [adminId], references: [id])
  action    String   // REASSIGN_ENQUIRY, VERIFY_FEE, SUSPEND_PROFESSIONAL, ...
  targetType String
  targetId   String
  metadata   Json?
  createdAt  DateTime @default(now())

  @@index([targetType, targetId])
}
```

### 3.3 Why this shape survives to hundreds of thousands of rows

- **`Match` and `EnquiryEvent` are the two tables that grow fastest** (one-to-many off `Enquiry`), and both have the composite indexes their actual query patterns need (`status + slaDeadline` for the SLA sweep job; `enquiryId + createdAt` for timeline rendering).
- **`payload Json`** avoids schema migrations every time a form field is added/changed per journey — a real operational concern once professionals and consumers are live and iteration needs to be fast — while the columns that gate routing and reporting stay relational and indexed.
- **`ConsumerProfile` is deliberately separate from `User`/Auth.js** — most consumers never authenticate (per PRD, MVP intake is frictionless/no-login), so consumer identity is just enough to detect duplicates and enable future self-service, without forcing every enquiry through the auth system.

---

## 4. API architecture

### 4.1 Conventions

- **Route handlers are thin.** Every handler: (1) parses/validates input with the shared zod schema, (2) calls exactly one service function, (3) maps the result to an HTTP response. No business logic in `route.ts` files.
- **Public vs. authenticated vs. internal** routes are physically separated (`api/enquiries/*` public, `api/professional/*` and `api/admin/*` session-gated via Auth.js middleware, `api/jobs/*` and `api/webhooks/*` gated by shared-secret/signature rather than session).
- **Idempotency:** all state-mutating professional/admin actions (`accept`, `decline`, `verify`) accept an idempotency key or are naturally idempotent (re-accepting an already-accepted match is a no-op, not an error), because notification retries and flaky mobile connections will cause duplicate submissions in practice.
- **Response shape:** consistent `{ data }` / `{ error: { code, message } }` envelope; validation errors return field-level detail so the client form can highlight the right input.

### 4.2 Key endpoints

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/enquiries/sell` | POST | Public (rate-limited) | Create a SELL enquiry, enqueue matching job |
| `/api/enquiries/buy` | POST | Public (rate-limited) | Create a BUY enquiry; may enqueue linked FINANCE enquiry per consent |
| `/api/enquiries/finance` | POST | Public (rate-limited) | Create a FINANCE enquiry, records financial-disclosure consent |
| `/api/enquiries/other-services` | POST | Public (rate-limited) | Create INSPECTION/CONVEYANCING/PROPERTY_MANAGEMENT enquiry |
| `/api/professional/leads` | GET | Session (PROFESSIONAL_*) | List own matches, filterable by status |
| `/api/professional/leads/[matchId]/accept` | POST | Session, ownership check | Accept a match; reveals contact detail; emits `MATCHED_ACCEPTED` event |
| `/api/professional/leads/[matchId]/decline` | POST | Session, ownership check | Decline; triggers re-routing job |
| `/api/professional/leads/[matchId]/status` | PATCH | Session, ownership check | Append a status-update event |
| `/api/professional/leads/[matchId]/outcome` | POST | Session, ownership check | Record outcome; creates `ReferralFee` (PENDING_VERIFICATION) |
| `/api/admin/enquiries` | GET | Session (ADMIN/SUPPORT_ADMIN) | Dashboard/search query |
| `/api/admin/enquiries/[id]/reassign` | POST | Session (ADMIN/SUPPORT_ADMIN) | Manual override of matching engine |
| `/api/admin/professionals/[id]/verify` | POST | Session (ADMIN) | Mark license verified/rejected |
| `/api/admin/fees/[id]/verify` | POST | Session (ADMIN) | Move fee PENDING_VERIFICATION → VERIFIED/DISPUTED |
| `/api/webhooks/twilio` | POST | Twilio signature | SMS delivery status callbacks |
| `/api/webhooks/resend` | POST | Resend signature | Email delivery/bounce callbacks |
| `/api/jobs/inngest` | POST/PUT/GET | Inngest signing key | Job runner registry endpoint |

### 4.3 Asynchronous workflow (matching, notifications, SLA)

Enquiry creation is the one path that must stay fast under public, adversarial-ish traffic (bots, load spikes from marketing campaigns). The route handler does the minimum synchronous work — validate, persist `Enquiry` + `ConsentRecord`, return a confirmation to the browser — then emits an event (`enquiry.created`) that the job runner picks up:

```
POST /api/enquiries/sell
  → validate (zod)
  → rate-limit check (Upstash, by IP + phone/email hash)
  → duplicate check (recent enquiry, same address+contact)
  → db.enquiry.create(...)  [+ ConsentRecord in same transaction]
  → inngest.send("enquiry.created", { enquiryId })
  → return 201 { enquiryId } to browser  — target: <500ms server time
```

```
Inngest: run-matching  (triggered by enquiry.created)
  step 1: load enquiry + eligible professionals (active, verified, area match, capacity)
  step 2: score/select per priority rules → create Match (status=ASSIGNED, slaDeadline=now+SLA)
  step 3: enquiry.status = ASSIGNED; append EnquiryEvent
  step 4: send.notification (email+SMS to professional)          [fan-out job]
  step 5: schedule sla-check (Inngest sleepUntil slaDeadline)
  — if step 1 finds zero eligible professionals: enquiry.status = UNMATCHED, alert admin, stop
```

```
Inngest: check-sla-timeouts  (cron, every 5 min, sweeps Match where status=ASSIGNED and slaDeadline < now)
  → mark Match EXPIRED, decrement professional responseRateScore
  → re-invoke run-matching for the same enquiry, excluding already-tried professionals
  → if pool exhausted: enquiry.status = UNMATCHED, alert admin
```

Running matching, notification delivery, and SLA timeouts as durable, retryable steps (rather than inline in the request or a bare `setTimeout`) means a Resend/Twilio outage, a Vercel function timeout, or a deploy mid-flow does not silently lose a lead — Inngest retries the failed step and the workflow resumes from there, and every step still writes to the `EnquiryEvent` audit log.

### 4.4 AI enrichment (non-blocking)

`enrich-enquiry-ai` runs as a fire-and-forget Inngest job after `enquiry.created`, in parallel with matching — it must never block or gate the matching/notification path. See §9.4 for what it does and the failure-mode guarantee (AI service failure never blocks a lead from being routed).

---

## 5. Authentication strategy (Auth.js)

Three distinct populations, one Auth.js configuration, differentiated by provider and role:

- **Consumers:** no account required for MVP intake (per PRD). If/when self-service status tracking ships, consumers authenticate via **email magic link** (Resend as the email provider) or phone OTP (Twilio Verify) — no passwords, since password reuse/reset overhead isn't worth it for an infrequent, low-stakes login.
- **Professionals:** **email + password (Credentials provider)**, with mandatory email verification before first login, since a professional account is where fee/dispute-relevant contact data lives. Session strategy: **database sessions** (not JWT) so that suspending a professional (e.g. license revoked, fraud suspected) takes effect immediately rather than waiting for a JWT to expire.
- **Admins:** email + password + **mandatory TOTP MFA** (Auth.js supports this via a custom Credentials flow with a second verification step, or a provider like Auth.js's built-in two-factor pattern). Database sessions, short idle timeout (e.g. 30 min), given admin access touches fee records and PII broadly.

```ts
// lib/auth.ts (shape, not full implementation)
export const authOptions: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [
    EmailProvider({ /* Resend transport, magic link — consumer self-service */ }),
    CredentialsProvider({ /* bcrypt/argon2 password check — professional & admin */ }),
  ],
  callbacks: {
    session: async ({ session, user }) => {
      session.user.role = user.role;
      session.user.professionalId = user.professional?.id;
      return session;
    },
  },
};
```

Route protection is enforced in two layers, not one: `middleware.ts` performs a coarse redirect (no session → login) for `(professional)` and `(admin)` route groups, and every individual API route additionally re-checks role and — for professional routes — resource ownership (a professional's session must own the `Match` they're acting on). Middleware-only protection is a known foot-gun (it can be bypassed by calling the API route directly); the API layer is the actual enforcement point.

---

## 6. User permissions (RBAC)

| Action | CONSUMER | AGENT / BROKER / etc. | SUPPORT_ADMIN | ADMIN |
|---|:---:|:---:|:---:|:---:|
| Submit enquiry | ✅ (public) | – | – | – |
| View own submitted enquiry status | ✅ (future, via magic link) | – | – | – |
| View assigned lead (post-accept detail) | – | ✅ own only | ✅ all | ✅ all |
| Accept/decline a match | – | ✅ own only | – | ✅ (override) |
| Update lead status | – | ✅ own only | – | ✅ |
| Record outcome | – | ✅ own only | – | ✅ |
| Reassign an enquiry | – | – | ✅ | ✅ |
| View admin dashboard | – | – | ✅ | ✅ |
| Verify/reject professional license | – | – | – | ✅ |
| Suspend a professional | – | – | – | ✅ |
| Verify/dispute a referral fee | – | – | – | ✅ |
| Adjust/void a referral fee | – | – | – | ✅ |
| View cross-professional fee balances | – | ✅ own only | ✅ | ✅ |

Implementation: a single `can(user, action, resource)` function in `lib/rbac.ts`, called at the top of every API route handler — not scattered ad hoc `if (role === ...)` checks. Ownership checks (a professional acting only on their own `Match`) are enforced by scoping the Prisma query itself (`where: { id: matchId, professionalId: session.professionalId }`), so an authorization bug can't leak another professional's lead by returning `404` instead of `403` — either way, no data crosses the boundary.

`SUPPORT_ADMIN` vs `ADMIN` split exists specifically because financial actions (fee verification, professional suspension) are higher-consequence than day-to-day lead reassignment — this maps directly to the PRD's FR-11 requirement.

---

## 7. Security considerations

- **Transport & storage:** TLS everywhere (Vercel default); database encryption at rest (Neon provides this by default — see §8.8 for provider decision); no PII in logs (structured logging with explicit allow-listed fields, not `console.log(req.body)`).
- **Secrets:** all third-party keys (Resend, Twilio, OpenAI, database URL, Auth.js secret, Inngest signing key) in Vercel environment variables, scoped per environment (dev/preview/prod), never committed; PostHog uses a public client key by design (client-side analytics) but server-side capture uses a separate server key.
- **Input validation:** every public endpoint validates with zod before touching the database; address/phone/email formats validated server-side (never trust client-side validation alone) per the PRD's AU-format NFRs.
- **Rate limiting & bot protection:** Upstash Ratelimit at the edge middleware layer on all `/api/enquiries/*` routes, keyed by IP and by a hash of phone/email to catch distributed-but-same-identity abuse; consider a CAPTCHA/challenge (e.g. Cloudflare Turnstile) on intake forms if bot volume becomes material — flagged as a launch-readiness decision, not deferred indefinitely, since hundreds of thousands of leads at scale makes the platform a bot target.
- **Duplicate/fraud detection:** phone/email verification (OTP via Twilio Verify) before an enquiry is routed to a professional is the strongest lever against fake leads poisoning professional trust (called out as a risk in the CTO-level analysis) — recommended as a pre-launch gate rather than a future feature, even though it adds a step to the consumer flow.
- **Webhook security:** Twilio and Resend webhook endpoints verify provider signatures (Twilio's `X-Twilio-Signature`, Resend's Svix-based signing) before processing — unverified webhook calls are a direct path to forging delivery events or, worse, spoofing status callbacks.
- **Authorization boundary:** as above, enforced at the API layer via `lib/rbac.ts` plus query-level ownership scoping, not just UI-level hiding of buttons.
- **PII minimization on the professional side:** full consumer contact detail is withheld until a professional explicitly accepts a match (per PRD FR-8) — enforced server-side by the `leads` list endpoint returning a redacted shape pre-accept and the full shape only after the `Match.status` transition is persisted.
- **Audit trail as a security control, not just a business one:** `EnquiryEvent` and `AdminActionLog` being append-only (no `UPDATE`/`DELETE` grants on those tables at the database role level, not just "the app doesn't expose an edit button") means a compromised admin session or an internal bad actor can't quietly rewrite history.
- **CSRF:** Auth.js's built-in CSRF protection covers session-based routes by default; public POST endpoints (`/api/enquiries/*`) don't carry authenticated sessions so classic CSRF doesn't apply there, but they still need the rate-limit/bot protections above.
- **Dependency/AI-specific risk:** the OpenAI integration only ever processes consumer-submitted free text for enrichment (summarization/classification) and never has tool access or the ability to take actions in the system — treat any AI output as untrusted data to display/store, not as an instruction to execute (avoids prompt-injection-via-consumer-input turning into anything more than a bad classification result).

---

## 8. Scalability considerations

The target — hundreds of thousands of leads — is comfortably within PostgreSQL's capability with correct indexing; the real risks are (a) serverless connection exhaustion, (b) the fastest-growing tables becoming unindexed scan targets, and (c) synchronous work blocking the public intake path. Addressed in order:

### 8.1 Database connections
Vercel serverless functions scale horizontally by spinning up many concurrent function instances, each historically opening its own DB connection — this exhausts Postgres's connection limit fast under real traffic. Mitigation: use a serverless-native Postgres provider with built-in pooling. Two connection strings are used per Prisma's recommended pattern for this class of provider: a pooled connection (PgBouncer-style, transaction mode) for the app's runtime queries, and a direct connection reserved for migrations. The Prisma client is instantiated as a single module-level singleton (`lib/db.ts`) to avoid connection-per-invocation churn within a warm function instance. Provider choice: see §8.8.

### 8.2 Read/write separation
Admin dashboard and reporting queries (broad, filterable, can tolerate slight staleness) are routed to a **read replica** once volume justifies it, keeping the write path (enquiry creation, match updates) on the primary uncontended. Not needed at MVP Melbourne volume; the schema and connection layer are structured so it's a configuration change (a second Prisma datasource) rather than a rearchitecture later.

### 8.3 Table growth management
`EnquiryEvent` (audit log) and `Match` grow strictly with enquiry volume and, for events, faster than 1:1. At hundreds-of-thousands-of-enquiries scale:
- **Partition `EnquiryEvent` by month** (Postgres native range partitioning) — keeps indexes small and recent-data queries (which dominate real usage — nobody's paging through 2-year-old events in normal operation) fast; old partitions can be moved to cheaper storage or archived.
- **Composite indexes matched to actual query patterns** (already reflected in §3.2: `status+slaDeadline` for the SLA sweep, `status+createdAt` for the admin dashboard) rather than indexing every column — over-indexing slows writes on the highest-write-volume tables.
- **`Enquiry.payload` (JSONB)** gets a GIN index only if/when ad-hoc payload search becomes a real product need; not added speculatively, since GIN indexes are expensive to maintain on a high-write table.

### 8.4 Decoupling synchronous from asynchronous work
Already covered in §4.3 — this is the single biggest scalability lever. If matching + two notification sends + AI enrichment all ran inline in the `POST /api/enquiries/sell` handler, the public-facing response time would be at the mercy of three third-party APIs' latency and the Vercel function's max duration. Moving that to the Inngest job runner means the public path stays fast and cheap regardless of matching complexity or notification volume, and the job runner scales its own concurrency independently.

### 8.5 Caching
- **Matching engine's "eligible professionals for suburb X" lookup** is a candidate for a short-TTL cache (Redis/Upstash, ~60s TTL) once professional volume grows — professional availability doesn't change every second, and this lookup runs on every single enquiry.
- **PostHog** and **static/marketing pages** are served via Vercel's CDN/ISR where content doesn't need to be live per-request.

### 8.6 Horizontal scaling posture
Vercel's serverless model auto-scales the stateless app tier without capacity planning; the deliberate architectural work is keeping the **database** (the one stateful, harder-to-scale component) off the hot path wherever possible — via the async job pattern, indexing discipline, and a clear, config-driven path to read replicas and partitioning rather than needing to invent it under pressure once traffic arrives.

### 8.7 Multi-region / national expansion
Suburb/postcode/state are already plain data columns (§3.2), not hardcoded assumptions — expanding beyond Melbourne/Victoria is a data and matching-rule change (new `ProfessionalServiceArea` rows, new state values), not a schema migration. Vercel's edge network already serves the frontend close to users nationally; the database region becomes the only thing to reconsider (single Australian region, e.g. Sydney, is fine for a national AU-only product — no need for multi-region DB complexity unless expanding outside Australia).

### 8.8 Decided: job runner and database provider

Two choices flagged as open in earlier drafts are now decided:

**Job runner: Inngest.** The workflow in §4.3 needs multi-step orchestration with automatic per-step retries and a native delayed-execution primitive (`sleepUntil` the SLA deadline, rather than a separately-run cron doing date-math on every sweep). Inngest gives us that plus first-class Next.js/Vercel support and a local dev server for testing workflows without deploying. Trigger.dev is a reasonable second choice but has been through multiple breaking architectural rewrites (v2→v3), which is a stability signal to weigh against for infrastructure a startup will depend on for years. QStash is simpler but is a plain queue/scheduler — it would push step-orchestration and retry logic back into our own code, which is exactly the complexity we want Inngest to absorb.

**Database: Neon**, provisioned through Vercel's native Postgres integration (Vercel's own "Vercel Postgres" offering is Neon under the hood, so this is really one decision, not two). Reasons: (1) database branching — every preview deployment can get its own ephemeral DB branch off production data, which matters a lot for a schema that will iterate quickly through MVP; (2) serverless-native pooling built in, directly addressing §8.1 without bolting on a separate PgBouncer instance to operate; (3) tight Vercel env-var wiring reduces deploy-config surface area. Supabase was considered and rejected for this project specifically because it bundles an auth/storage/realtime platform we don't need — we've already committed to Auth.js, and a second overlapping platform identity invites scope creep (someone reaching for Supabase Auth "since it's already there") rather than reducing complexity.

---

## 9. Third-party integration architecture

All third-party calls are wrapped in a thin adapter under `lib/integrations/`, never called directly from route handlers or job functions — this keeps provider-specific SDKs and error handling in one place and makes swapping a provider later (e.g. Twilio → another SMS vendor) a one-file change.

### 9.1 Resend (email)
Transactional templates (confirmation, match notification, SLA reminder) as React Email components, versioned in-repo. Sent exclusively from Inngest job steps (never inline in a request handler) so retries are automatic on transient failure.

### 9.2 Twilio (SMS)
Used for (a) professional lead notifications and (b) optionally, consumer phone verification (Twilio Verify) as the fraud-mitigation control from §7. SMS delivery status webhooks update a `Notification` log (not modeled in full above, but structurally identical to the pattern of `EnquiryEvent`) for deliverability monitoring.

### 9.3 PostHog (analytics)
Dual capture: client-side (`posthog-js`) for funnel/UX analytics on the consumer journeys (drop-off per form step is a critical MVP metric — directly informs which journey step is losing consumers), and server-side (`posthog-node`) for events that must be reliable regardless of client-side ad-blockers/JS failures (`enquiry_created`, `match_accepted`, `outcome_recorded`). Feature flags used to gate rollout of matching-algorithm changes to a percentage of traffic before full rollout.

### 9.4 OpenAI API (AI layer)
Scoped deliberately narrow at MVP — **enrichment, not decisioning**:
- **Free-text signal extraction:** the Sell journey's "current situation" free-text field and similar open fields are summarized/classified (e.g. urgency signal, "must sell before buying" flag) to enrich the enquiry for professionals and inform routing priority — but this *augments* the rules-based matching engine's scoring input, it does not replace or bypass it (per the PRD's explicit MVP scope: rules-based matching, not ML-based).
- **Admin copilot (future-leaning, stub at MVP):** summarizing a long enquiry event history into a one-paragraph brief for admin dispute resolution.
- **Failure isolation:** `ai-service.ts` calls are wrapped with a timeout and try/catch that **never blocks or fails the matching/notification pipeline** — if OpenAI is slow or errors, the enquiry is still matched and routed on schedule with enrichment simply absent, logged, and retryable separately. AI enrichment is additive, not load-bearing, for the core business flow.
- Consumer-submitted text sent to OpenAI is limited to what's necessary for enrichment (not full PII payloads), consistent with the privacy-minimization posture in §7.

---

## 10. Summary of key architectural decisions

| Decision | Chosen approach | Alternative considered | Why |
|---|---|---|---|
| Enquiry data model | Base table + JSONB payload | One table per enquiry type | Avoids schema churn as journeys evolve; common fields still indexed |
| Async workflow | Durable job runner (Inngest) | Trigger.dev, QStash, inline `await`/bare cron | Native step retries + `sleepUntil` fit the SLA-timeout workflow directly; Trigger.dev's repeated breaking rewrites and QStash's lack of step-orchestration were both weighed and rejected |
| Database provider | Neon (via Vercel's native Postgres integration) | Supabase, self-managed Postgres + PgBouncer | Serverless-native pooling + DB branching per preview deploy, without bundling an unused auth/storage platform |
| Auth session strategy | Database sessions | JWT sessions | Immediate effect when suspending a professional/admin account |
| Audit trail | Append-only `EnquiryEvent`/`AdminActionLog`, DB-level no-update/delete | Mutable status field only | Fee disputes and security incidents both need an unforgeable history |
| AI role | Enrichment only, non-blocking, additive | AI-driven matching decisions | Keeps the core revenue-critical path deterministic and debuggable; AI failure can't stop a lead being routed |
| DB scaling | Indexing + partitioning + read replica, deferred until needed | Sharding / NoSQL | Hundreds of thousands of rows is well within single-Postgres-instance capability with correct indexes; added complexity isn't justified yet |
