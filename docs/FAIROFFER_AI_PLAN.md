# FairOffer AI — Application Audit & Evolution Plan

**"Know if you are paying too much before you buy."**

Date: 2026-07-28
Status: Planning document — no application code written yet, by design.

---

## 0. Read this first: what the audit actually found

The brief assumed an existing FairOffer application of meaningful size. There is one, and it is real
and deployed — but it is **526 lines of a single React file with no backend, no database, no
authentication, and no AI**. That is not a criticism; it is a validated landing-page-grade funnel
that has done its job. But it changes the shape of this engagement.

**This is not an evolution of an existing platform. It is a greenfield build that inherits a proven
funnel, a domain, a brand palette, and a set of hand-tuned heuristics.** Roughly 5% of the target
product exists today. Planning as if we are refactoring will produce wrong estimates; planning as
greenfield-with-a-head-start will not.

Two other things worth stating up front, because they change what should be built first:

1. **There is no property data.** The app's "valuation" is 208 hardcoded Melbourne suburb medians
   with no source, no date, and no update mechanism. Every feature in the brief — score, comparables,
   price alerts, watchlists, daily feed — is downstream of solving data licensing. **Data is the
   critical path, not the app.** See §6.
2. **The brief specifies Supabase. The PropertyConnect architecture in this same repo explicitly
   evaluated and rejected Supabase in favour of Neon + Auth.js.** That is a real conflict and it
   needs a deliberate answer, not a silent override. My recommendation is in §7.1 — and it is to
   follow the brief and use Supabase for FairOffer, for reasons specific to FairOffer.

---

## 1. Current application audit

### 1.1 Where the code actually lives

| Repository | What it is | Relevance |
|---|---|---|
| `erhanpricefair/fair-offer-app` | **The FairOffer application.** React SPA, 5 files. | The audit subject. |
| `erhanpricefair/Formboard` | Horse racing form board (`index.html`) + PropertyConnect PRD & architecture docs. | Unrelated product; docs are relevant prior art. |
| `erhanpricefair/property-connect` | PropertyConnect implementation | Adjacent platform — likely the InvestorSource/ReferWise substrate. |
| `erhanpricefair/inspectcompare` | Not audited | Possibly relevant (inspection comparison?). |
| `erhanpricefair/AFLAPP` | Unrelated | — |

Note: `fairoffer.com.au` could not be fetched from this environment (proxy returned 403), so
production behaviour is inferred from source, not observed. Worth confirming that the deployed site
matches `main` in `fair-offer-app`.

### 1.2 Tech stack

| Layer | Current |
|---|---|
| Framework | Create React App (`react-scripts` 5.0.1), React 18.2 |
| Language | JavaScript (JSX). **No TypeScript.** |
| Styling | Inline JS style objects (`const s = {...}`). No CSS files, no Tailwind, no design tokens. |
| Routing | None. A `useState` string: `"home" \| "form" \| "result"`. |
| State | Local `useState` only. No context, no store, no server state library. |
| Data layer | None. No `fetch` call exists anywhere in the codebase. |
| Build/deploy | Vercel, `vercel.json` SPA rewrite to `/`. |
| Testing | None. |
| Linting / CI | None. |
| Dependencies | 3 (`react`, `react-dom`, `react-scripts`). |

`react-scripts` is effectively unmaintained and is a migration item regardless of everything else
in this document.

### 1.3 Frontend architecture

A single `App.jsx` (526 lines) containing constants, business logic, styling, and three screens.

```
home  ──"Check a Property"──▶  form  ──analyse()──▶  result
  ▲                              ▲                     │
  └──────────────────────────────┴─── back ────────────┘
```

- Fixed `maxWidth: 480` mobile-first shell, centred on desktop.
- Light theme only. **No dark mode.**
- Brand: green `#1B6B45`, amber `#E8943A`, cream `#F7F5F1`, Inter (400/700/900).
- Zero component decomposition — everything is inline JSX inside `App`.
- No accessibility work: land-size selectors are `<button>`s with no `aria-pressed`, no focus
  styling, no form labels beyond visual `<label>` without `htmlFor`.
- No loading, error, or empty states beyond one inline validation banner.

**Verdict:** clean, readable, well-designed for what it is. Not a foundation — a prototype. It should
be treated as a **design reference and spec**, and rewritten, not migrated.

### 1.4 Backend architecture

**There is none.** No API routes, no server, no serverless functions, no environment variables, no
secrets, no third-party integrations. The entire application runs client-side, which also means the
suburb dataset and the full scoring algorithm are publicly readable in the JS bundle.

### 1.5 Database structure

**There is none.** In place of one:

```js
const SUBURB_DATA = {
  "richmond": { house: 1420000, unit: 680000, growth: 3.2,
                competition: "very high", daysOnMarket: 18 },
  // ... 208 Melbourne suburbs
};
```

- 208 suburbs, **Melbourne only**. No NSW, QLD, WA, SA, TAS, ACT, NT.
- Fields: house median, unit median, annual growth %, competition (enum: low/medium/high/very high),
  average days on market.
- **No provenance, no `as_at` date, no update path.** Values are hardcoded and ageing silently.
- Suburb matching is string prefix/substring matching against lowercased keys (`findSuburb`), with
  no postcode or state disambiguation — "brighton" matches Melbourne's Brighton with no way to mean
  Brighton, SA or Brighton, QLD.
- `docklands` has `house: 0` with a null-guard, indicating the shape is already straining.

### 1.6 Authentication

**None.** No accounts, no sessions, no user identity of any kind. Nothing is persisted between
visits — not even `localStorage`.

### 1.7 Existing features

| Feature | State |
|---|---|
| Suburb-level price check | Working |
| Fair value range (low/high) | Working |
| Price verdict (4 bands) | Working |
| Opening offer + walk-away numbers | Working |
| Negotiation strategy (3 points) | Working — **static templates, not AI** |
| Market context (competition, DOM, growth) | Working — from static data |
| Risk flags | Working — rule-based |
| Consultation lead capture | **Working badly — see 1.9** |
| Accounts / watchlist / alerts / feed / chat / payments / broker tools / admin | **Do not exist** |

### 1.8 Existing business logic — the genuinely valuable part

This is the IP worth carrying forward. It is small, legible, and reflects real domain judgement:

```
base       = suburbMedian[propertyType]
bedAdj     = { 1:-0.32, 2:-0.12, 3:0, 4:+0.22, 5:+0.42 }[bedrooms]
landAdj    = houses only { <300:-0.12, 300-500:0, 500-700:+0.10, 700+:+0.22 }
mid        = base × (1 + bedAdj + landAdj)
low / high = mid × 0.92 / mid × 1.08          ← ±8% fair-value band
open       = low  × 0.97                       ← opening offer anchor
walk       = high × 1.03                       ← walk-away ceiling

verdict:  listing <  low×0.95   → Underpriced
          listing <= high×1.02  → Fairly Priced
          listing <= high×1.10  → Slightly High
          else                  → Overpriced

needsPro  = Overpriced | Slightly High | competition == "very high"   ← lead trigger
```

Risk flags fire on: very-high competition; listing > high×1.08 (bank valuation shortfall — a
genuinely good insight); fast-moving suburb; plus two always-on advisories (building & pest,
Section 32).

**Observations worth acting on:**
- The model is a *suburb median adjusted by two attributes*. It cannot distinguish two houses on the
  same street. Marketing it as address-level intelligence would overstate it.
- The ±8% band is fixed regardless of confidence. A thin-data suburb and a high-turnover suburb get
  identical precision, which is misleading. **Confidence must become a first-class output.**
- Bedroom and land adjustments are additive and applied to a suburb-wide median — they compound
  badly at the extremes (a 5-bed on 700sqm+ = median × 1.64).
- There is no adjustment for property age, condition, or land value share, all of which the brief
  asks for.

### 1.9 Lead generation — the biggest commercial problem

```js
window.location.href = `mailto:erhan@newpfproperty.com.au?subject=...&body=...`;
```

Leads are handed to the user's email client. Consequences:

- **Leads are lost silently.** No mail client configured (common on mobile web, universal on
  corporate desktops) = the lead evaporates with a success screen still shown to the user
  (`setConsultSent(true)` fires unconditionally).
- **No persistence, no CRM, no attribution, no follow-up, no dedupe.**
- **No consent capture** — no privacy policy link, no consent checkbox. Once name and phone are
  collected server-side this becomes a **Privacy Act 1988 / Australian Privacy Principles**
  obligation, not a nice-to-have.
- Email is unvalidated, phone is optional and unformatted.

If nothing else in this plan ships, **fixing lead capture is the highest-ROI single change** —
it converts an existing, working funnel into actual revenue.

### 1.10 Compliance & trust posture

- ✅ Already states "Not a formal valuation" in two places. Keep and strengthen this.
- ✅ Buyer-side-only positioning is a genuine trust differentiator — lean into it.
- ❌ No privacy policy, terms, or consent flow.
- ❌ No data source attribution (required by most property data licences once real data is used).
- ⚠️ Currently co-branded **NewPF Business Group**. The brief positions FairOffer as a standalone
  consumer brand alongside InvestorSource and ReferWise. **This needs a decision** (§9, open question).

### 1.11 What to keep vs rebuild

| Keep | Rebuild |
|---|---|
| Scoring heuristics (as v0 baseline + fallback) | Everything structural |
| Negotiation copy & tone (as LLM few-shot examples) | The static templates themselves |
| Suburb dataset (as seed data / offline fallback) | The data pipeline |
| Brand palette, typography, mobile-first layout | The component layer |
| The 3-step funnel shape (home → form → result → lead) | The lead delivery mechanism |
| "Not a formal valuation" honesty | — |

---

## 2. Recommended architecture

### 2.1 Shape

A **TypeScript monorepo** (pnpm + Turborepo), Supabase backend, Expo mobile, Next.js web.

```
fairoffer/
├── apps/
│   ├── mobile/          Expo (iOS + Android) — Expo Router, RN 0.7x
│   ├── web/             Next.js App Router — marketing, SEO, web app,
│   │                    broker dashboard, admin console
│   └── docs/            (optional) internal runbooks
├── packages/
│   ├── scoring/         ★ FairOffer Score engine — pure, deterministic, tested
│   ├── ai/              LLM abstraction (OpenAI now, Claude later)
│   ├── db/              Supabase types, generated from schema
│   ├── api-client/      Typed client over Supabase + Edge Functions
│   ├── ui/              Design tokens + shared primitives
│   └── shared/          Zod schemas, formatters, AU address utils
├── supabase/
│   ├── migrations/      SQL migrations (source of truth)
│   ├── functions/       Edge Functions (Deno)
│   └── seed.sql
└── infra/
```

**`packages/scoring` is the single most important architectural decision in this document.** The
score must be computed by one pure, versioned, unit-tested TypeScript function that mobile, web, and
server all import. If mobile and server ever disagree about a score, the product's core trust claim
is dead.

### 2.2 The AI boundary — read this before building the score engine

> **The AI does not decide the price. The AI explains the price.**

This mirrors the principle already established in this repo's PropertyConnect architecture ("AI as
enrichment, not decisioning") and it matters more here, not less:

| Layer | Responsibility | Implementation |
|---|---|---|
| **Valuation** | Estimate fair value range + confidence | Deterministic model in `packages/scoring`. Statistics, not an LLM. |
| **Score** | Map (asking price, fair range, market signals) → 0–100 | Deterministic, documented, versioned formula. |
| **Narrative** | Report prose, strengths, concerns, questions for the agent | LLM, constrained to the numbers it is given. |
| **Negotiation** | Strategy, talking points, next steps | LLM, grounded in retrieved comparables. |
| **Chat** | Buyer's assistant | LLM + tool-calling into our own APIs. |

Why this matters commercially: an LLM asked to produce a dollar figure will produce a plausible,
confident, **unreproducible** one. Two users analysing the same property would get different
valuations. Every regulator conversation, every dispute, and every "why did my score change?"
notification becomes unanswerable. Determinism is the product.

**AI abstraction layer** (`packages/ai`) — the brief asks for OpenAI now, Claude later. Design for it
from day one:

```ts
interface LLMProvider {
  complete(req: CompletionRequest): Promise<CompletionResult>;
  stream(req: CompletionRequest): AsyncIterable<Chunk>;
}
// providers/openai.ts, providers/anthropic.ts
// Prompts live in packages/ai/prompts/*.ts — versioned, provider-agnostic,
// with a golden-output test suite so a provider swap is verifiable, not hopeful.
```

Log every call to an `ai_usage` table (user, feature, provider, model, tokens, cost, latency,
cache hit). Without this, AI margin is invisible and premium pricing is guesswork.

**Cost control** — mandatory, not optional. A property analysis costing ~$0.05–0.15 in tokens against
a $19.99/month unlimited plan is a margin risk at volume. Controls:
- Cache report narratives by `(property_fingerprint, score_version, asking_price_band)`.
- Only regenerate when inputs materially change.
- Cheap model for chat and short-form, frontier model for full reports.
- Per-user rate limits on all tiers, including "unlimited".

### 2.3 Backend on Supabase

| Concern | Approach |
|---|---|
| Data | Postgres + PostGIS (spatial queries for comparables are geographic — do not skip PostGIS) |
| Auth | Supabase Auth — email, Google, Apple (Apple is **mandatory** for iOS App Store when Google sign-in is present) |
| Authorisation | **Row Level Security on every table, from the first migration.** Retrofitting RLS is painful and dangerous. |
| Storage | Supabase Storage — property images, generated PDFs, broker logos |
| Realtime | Supabase Realtime for watchlist/score-change updates |
| Business logic | Edge Functions for anything touching secrets or AI |
| Scheduled work | `pg_cron` + Edge Functions: data ingestion, alert evaluation, digests |
| Search | Postgres FTS + trigram for address/suburb autocomplete. No Elasticsearch. |

**Non-negotiable:** the anon key ships in the mobile bundle. Every table must have RLS enabled and a
policy. `ai_usage`, `leads`, `subscriptions`, and anything cross-tenant must be service-role only.

### 2.4 Client architecture

**Mobile (Expo):** Expo Router (file-based, mirrors Next.js), TanStack Query for server state, Zustand
for the little local state needed, Expo Notifications, Expo SecureStore, RevenueCat for IAP.

> **Payments reality check:** the brief says Stripe subscriptions. On iOS and Android, selling
> digital subscriptions **must** go through App Store / Play Billing (30%/15% platform fee) — Stripe
> in-app is a rejection. Practical answer: **RevenueCat** to unify StoreKit + Play Billing + Stripe
> behind one entitlement model, with Stripe used for web checkout and for the Professional tier
> (B2B via web is allowed). Budget for the platform fee in consumer pricing. This is a pricing-model
> input, not a technical detail.

**Web (Next.js App Router):** marketing + SEO (suburb landing pages are a serious organic acquisition
channel for this product), the web app, broker dashboard, and admin console. Server Components for
data-heavy dashboard views.

**Do not** attempt one universal react-native-web codebase across consumer mobile and broker
dashboard. The interaction models are too different; sharing `packages/scoring`, `packages/ai`,
`packages/shared`, and design tokens captures ~80% of the benefit at ~20% of the pain.

### 2.5 Platform separation — FairOffer / InvestorSource / ReferWise

The brief is right that these must not merge brands. They should also **not share a database**.

```
┌─────────────┐   ┌────────────────┐   ┌──────────┐
│  FairOffer  │   │ InvestorSource │   │ ReferWise│
│  (Supabase) │   │   (own DB)     │   │ (own DB) │
└──────┬──────┘   └───────┬────────┘   └────┬─────┘
       │                  │                 │
       └────── typed HTTP contracts, webhooks, idempotency keys ──────┘
```

Integrate via **versioned API contracts**, not a shared schema. Shared schemas across separately-
branded products create coupling that makes each product harder to change independently — and this
is exactly the trap PropertyConnect's architecture doc was guarding against when it worried about
platform scope creep. FairOffer owns a `referral_dispatches` table recording what it sent and what
came back; the partner platforms own their own state.

---

## 3. Database changes required

There is no existing database, so this is a greenfield schema. Abbreviated — types and constraints
shown where they carry decisions.

### 3.1 Identity & profile

```sql
-- Extends auth.users
create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  full_name       text,
  role            user_role not null default 'consumer',
    -- enum: consumer | investor | broker | admin
  phone           text,
  location_suburb text,
  location_state  au_state,
  buying_goal     buying_goal,
    -- enum: first_home | upgrade | investor | downsizer
  budget_min      integer,
  budget_max      integer,
  preferred_suburbs text[],
  preferences     jsonb not null default '{}',   -- beds, baths, type, land
  onboarded_at    timestamptz,
  created_at      timestamptz not null default now()
);
```

Roles are a *dimension*, not a hierarchy — a broker is also a buyer. Model `role` for the primary
experience and add `organisation_members` for professional context.

### 3.2 Reference data (the moat)

```sql
create table suburbs (
  id            uuid primary key,
  name          text not null,
  state         au_state not null,
  postcode      text not null,
  sa2_code      text,                    -- ABS Statistical Area 2 — the join key
  geom          geography(polygon, 4326),
  unique (name, state, postcode)
);

create table suburb_metrics (
  suburb_id       uuid references suburbs(id),
  property_type   property_type not null,
  bedrooms        smallint,               -- null = all
  period          date not null,          -- monthly
  median_price    integer,
  sale_count      integer,                -- ← drives confidence
  median_dom      smallint,
  growth_12m      numeric(5,2),
  median_rent     integer,
  gross_yield      numeric(5,2),
  clearance_rate  numeric(5,2),
  source          text not null,          -- ← provenance, mandatory
  as_at           timestamptz not null,
  primary key (suburb_id, property_type, bedrooms, period)
);
```

Two fields fix the current model's core weaknesses: `sale_count` (thin data → wider band → lower
confidence, honestly disclosed) and `source`/`as_at` (provenance, required by data licences and by
users who will ask "says who?").

### 3.3 Properties & sales

```sql
create table properties (
  id             uuid primary key,
  address_line   text not null,
  suburb_id      uuid references suburbs(id),
  postcode       text,
  state          au_state,
  geom           geography(point, 4326),
  property_type  property_type,
  bedrooms       smallint, bathrooms smallint, car_spaces smallint,
  land_size_sqm  integer,
  build_year     smallint,
  features       jsonb default '{}',
  external_ids   jsonb default '{}',     -- {domain: "...", corelogic: "..."}
  address_hash   text unique,            -- normalised, for dedupe
  created_at     timestamptz default now()
);

create table sales (                      -- comparable evidence
  id            uuid primary key,
  property_id   uuid references properties(id),
  sale_price    integer not null,
  sale_date     date not null,
  sale_method   text,                     -- auction | private | ...
  source        text not null,
  as_at         timestamptz not null
);
create index on sales using gist (
  (select geom from properties where id = property_id)
);  -- see note: in practice denormalise geom onto sales for the spatial index

create table listings (
  id             uuid primary key,
  property_id    uuid references properties(id),
  asking_price_min integer, asking_price_max integer,
  price_text     text,                    -- "Offers above $850,000"
  status         listing_status,          -- active | under_offer | sold | withdrawn
  listed_at      date, agent_name text, agency_name text,
  source         text not null
);

create table listing_price_history (
  listing_id  uuid references listings(id),
  price_min   integer, price_max integer,
  observed_at timestamptz not null,
  primary key (listing_id, observed_at)
);
```

`listing_price_history` is what makes "12 Smith Street dropped $20,000" possible. It must be written
by the ingestion job on **every** poll, not only on change detection.

### 3.4 Analyses & scores

```sql
create table analyses (
  id                uuid primary key,
  user_id           uuid references profiles(id),
  property_id       uuid references properties(id),
  input             jsonb not null,       -- exact user input, replayable
  asking_price      integer not null,
  score             smallint not null check (score between 0 and 100),
  score_band        score_band not null,  -- excellent|good|fair|caution|poor
  fair_value_low    integer not null,
  fair_value_mid    integer not null,
  fair_value_high   integer not null,
  confidence        confidence_level not null,  -- high | medium | low
  price_position    price_position not null,    -- below | fair | above
  suggested_open    integer,
  walk_away         integer,
  engine_version    text not null,        -- ← "v1.2.0" — never omit
  inputs_snapshot   jsonb not null,       -- market data used, frozen
  created_at        timestamptz default now()
);

create table analysis_comparables (
  analysis_id uuid references analyses(id) on delete cascade,
  sale_id     uuid references sales(id),
  similarity  numeric(4,3),
  adjusted_price integer,
  primary key (analysis_id, sale_id)
);

create table reports (
  id           uuid primary key,
  analysis_id  uuid references analyses(id),
  sections     jsonb not null,            -- overview, strengths, concerns, ...
  model        text not null, provider text not null,
  prompt_version text not null,
  generated_at timestamptz default now()
);
```

`engine_version` + `inputs_snapshot` make every historical score reproducible and explainable. When
a user asks "why did my score change from 82 to 76?", you can answer precisely: the engine version,
or the market data, or the asking price. Without this, score-change notifications are unsupportable —
and score-change notifications are a core retention mechanic in the brief.

### 3.5 Engagement

```sql
create table watchlists            (id, user_id, name, created_at);
create table watchlist_items       (id, watchlist_id, property_id, listing_id,
                                    latest_analysis_id, notes, status,
                                    notifications_enabled bool default true,
                                    added_at);
create table alert_rules           (id, user_id, type, params jsonb, active);
create table notifications         (id, user_id, type, title, body, data jsonb,
                                    read_at, sent_at, channel);
create table push_tokens           (id, user_id, token, platform, last_seen_at);
create table saved_searches        (id, user_id, criteria jsonb, notify bool);
```

### 3.6 Commercial

```sql
create table subscriptions (
  id uuid primary key, user_id uuid references profiles(id),
  tier subscription_tier,          -- free | premium | professional
  status text,                     -- active | past_due | cancelled | trialing
  provider text,                   -- stripe | apple | google  ← multi-provider from day 1
  provider_subscription_id text,
  current_period_end timestamptz,
  cancel_at_period_end bool default false
);

create table usage_counters (       -- enforces the free tier's 3/month
  user_id uuid, period date, analyses_used int default 0,
  ai_chat_messages int default 0,
  primary key (user_id, period)
);

create table leads (
  id uuid primary key, user_id uuid, analysis_id uuid, property_id uuid,
  category lead_category,   -- negotiation|mortgage_broker|buyers_agent|
                            -- building_inspection|conveyancer|insurance
  name text not null, email text not null, phone text,
  message text,
  consent_given bool not null,          -- ← never nullable
  consent_text text not null,           -- ← the exact wording shown, for audit
  consent_at timestamptz not null,
  status lead_status, source text, utm jsonb,
  created_at timestamptz default now()
);

create table referral_dispatches (
  id uuid primary key, lead_id uuid references leads(id),
  platform text not null,               -- investorsource | referwise
  external_id text, category text,
  status text,                          -- queued|sent|accepted|assigned|
                                        -- contacted|converted|lost
  commission_amount numeric(10,2), commission_status text,
  idempotency_key text unique not null, -- ← never double-send a lead
  dispatched_at timestamptz, last_event_at timestamptz
);

create table ai_usage (
  id uuid primary key, user_id uuid, feature text, provider text, model text,
  input_tokens int, output_tokens int, cost_usd numeric(10,6),
  latency_ms int, cache_hit bool, created_at timestamptz default now()
);
```

Storing `consent_text` verbatim, not just a boolean, is what makes an APP-compliance response
possible a year later.

### 3.7 Professional

```sql
create table organisations   (id, name, type, logo_url, brand_colour, abn);
create table org_members     (org_id, user_id, role);
create table clients         (id, org_id, name, email, phone, budget_min,
                              budget_max, goal, notes, status);
create table client_analyses (client_id, analysis_id, shared_at, shared_by);
create table shared_reports  (id, analysis_id, org_id, token unique,
                              expires_at, view_count);  -- public share links
```

### 3.8 RLS posture

- `profiles`, `watchlists`, `analyses`, `notifications`: owner-only.
- `clients`, `client_analyses`: organisation-scoped via `org_members`.
- `suburbs`, `suburb_metrics`, `properties`, `sales`: public read (subject to §6 licensing).
- `leads`, `referral_dispatches`, `ai_usage`, `subscriptions`: **service role only.** Never client-readable.
- Admin access via a security-definer function checking `role = 'admin'`, never a client-side flag.

---

## 4. The FairOffer Score engine

### 4.1 Structure

Deterministic, documented, and versioned. A defensible proposal:

```
Fair value estimate (the hard part — §4.2)
   ↓
Score components (weights tunable, sum to 100):
   • Price vs fair value range          40   ← dominant, correctly
   • Comparable sales support           20
   • Suburb momentum (growth, DOM,
     clearance rate)                    15
   • Property attributes vs suburb norm 10
   • Rental yield / investment metrics  10
   • Data confidence penalty            -5..0
   ↓
Score 0–100  →  band  →  plain-English label
   85–100 Excellent value
   70–84  Good value
   55–69  Fair value
   40–54  Proceed with caution
   0–39   Likely overpriced
```

**Every score must ship with its component breakdown.** "85/100 — Good value" is a number; "85/100,
of which price-vs-fair-value contributed 36/40 and low comparable coverage cost you 4" is a product.
The breakdown is also what the LLM narrates — it never invents reasoning, it explains the arithmetic.

### 4.2 Valuation approach, staged honestly

| Stage | Method | Accuracy | Requires |
|---|---|---|---|
| **v0 (today)** | Suburb median × bed/land adjustment | ±15–25% | Nothing new |
| **v1 (MVP)** | Median + hedonic adjustments (beds, baths, land, age, type), calibrated on real sales | ±10–15% | Sales data licence |
| **v2** | Comparable-sales model: nearest-neighbour on geography + attributes + time-adjusted | ±8–12% | Address-level sales + geocoding |
| **v3** | Gradient-boosted AVM trained on historical sales | ±5–8% | 2+ years of data, ML pipeline |

**Ship v1 at MVP. Do not claim v3 accuracy at v1.** Publish the confidence band and the sale count
behind it. A product that says "estimate based on 7 comparable sales — low confidence" is more
trustworthy, and more defensible, than one that always projects certainty.

### 4.3 Legal framing — must be enforced in code, not just copy

- Persistent, unmissable: **"This is an AI-assisted estimate, not a formal valuation."**
- Never use the words *valuation*, *appraisal*, or *certified* in product copy. Use *estimate*,
  *analysis*, *guide*.
- Never say "you will save $X" or "this property is worth $X".
- Show data source and date on every figure.
- Australian context to confirm with a lawyer before launch: Australian Consumer Law (misleading and
  deceptive conduct, s18) is the primary exposure; state valuer registration regimes matter if the
  framing drifts toward formal valuation; and if investment framing is added ("good for investment"),
  **personal financial advice** licensing under the Corporations Act becomes a live question. The
  investor persona in the brief is the risk vector here, not the home buyer.

---

## 5. Feature roadmap

### Phase 1 — MVP (weeks 1–10)
Auth (email/Google/Apple) · onboarding · address & suburb search · **FairOffer Score v1** · AI report ·
watchlist · price-change alerts · **real lead capture** (DB + CRM + email/SMS) · free-tier limits ·
Stripe/RevenueCat premium · web + iOS + Android.

### Phase 2 — Engagement & Pro (weeks 11–20)
AI negotiation assistant · AI buyer's chat (tool-calling) · daily property feed · full alert suite ·
investor metrics (yield, cashflow, growth) · broker dashboard · client management · branded PDF
reports · shareable report links.

### Phase 3 — Network (weeks 21–32)
InvestorSource lead integration · ReferWise referral engine + commission tracking · service
marketplace · admin console v2 · analytics · multi-state expansion · AVM v2/v3.

### Explicitly deferred
Agent-side tools · buyer's agent marketplace with payments · auction-day live tools · white-label ·
API product · mortgage calculators beyond basic · conveyancing workflow.

---

## 6. Data sources — the actual critical path

**Nothing in Phase 1 ships without resolving this. Start here, this week, before any code.**

| Source | Coverage | Cost (indicative) | Notes |
|---|---|---|---|
| **Domain API** | Listings, some sold, suburb performance | Free tier → ~$500+/mo | Best developer experience. Realistic MVP choice. |
| **PropTrack / REA** | Listings, AVM | Enterprise | Largest listing inventory. Slow commercial process. |
| **CoreLogic (RP Data)** | Sales, valuations, rental — the industry standard | $$$$ | Most complete. Expensive, restrictive licence, redistribution limits. |
| **PriceFinder** | Sales, comparables | $$ | Mid-tier alternative worth quoting. |
| **NSW Valuer General** | **Free bulk property sales data** | Free | Genuinely open. NSW only. |
| **VIC / QLD / SA / WA** | Varies — some open aggregate, some paid | Free–$$ | VIC is notably less open than NSW. |
| **ABS** | Census, SA2 demographics, price indexes | Free | Excellent for suburb context and momentum. |
| **RBA** | Cash rate, lending indicators | Free | Market-conditions inputs. |
| **PSMA / Geoscape G-NAF** | Authoritative AU address file | $$ | Solves address normalisation and dedupe properly. |

**Recommended MVP data strategy:**
1. **Domain API** for listings and suburb performance — fastest path to a working product.
2. **NSW VG free sales data** to build and validate the comparable-sales model at zero cost.
3. **ABS + RBA** for market context and momentum, free.
4. Existing hardcoded medians as **seed and offline fallback only**, with `as_at` set honestly.
5. Negotiate CoreLogic or PriceFinder once the product proves demand — not before.

**Licensing constraints that shape the schema and the UI:** most commercial property data licences
restrict caching duration, prohibit bulk redistribution, require attribution, and forbid building a
competing dataset. This affects what can be stored, for how long, and what can be shown to
non-subscribers. **Read the licence before designing the caching layer**, not after.

---

## 7. Key decisions and conflicts

### 7.1 Supabase vs the PropertyConnect Neon decision — recommendation: use Supabase for FairOffer

`docs/ARCHITECTURE.md` in this repo rejected Supabase for PropertyConnect, reasoning that it
"bundles an auth/storage/realtime platform we don't need." That reasoning was correct **for
PropertyConnect** — a web-only lead-routing app already committed to Auth.js.

**FairOffer's requirements are the inverse.** It needs exactly the bundle PropertyConnect didn't:
native mobile auth SDKs with Apple Sign-In, file storage for property images and PDFs, realtime for
score and watchlist updates, and RLS for multi-tenant data accessed directly from a mobile client.
Rebuilding those on Neon + Auth.js for a React Native app is significant avoidable work.

**Recommendation: FairOffer on Supabase, PropertyConnect stays on Neon, no shared database.** Two
products, two data stores, integrated over versioned HTTP contracts (§2.5). This is not
inconsistency — it is each product picking the right tool, with the integration boundary made
explicit rather than implicit.

### 7.2 Where I'd push back on the brief

Stated plainly, then built as asked unless you say otherwise:

1. **Sequencing: ship web first, mobile second.** The existing funnel is web, the domain has web
   traffic, SEO suburb pages are a real acquisition channel, and web iterates without app-store
   review. Building Expo + Next.js simultaneously in Phase 1 roughly doubles surface area before
   demand is validated. Suggested change: Phase 1 = Next.js web (with the Expo monorepo scaffolded
   and `packages/scoring` shared); mobile apps early Phase 2. **The brief's own goal — "launch
   quickly, validate demand" — argues for this.**
2. **Payments.** Stripe alone cannot serve iOS/Android consumer subscriptions (§2.4). RevenueCat +
   platform billing, with Stripe on web and for Professional. Price with the 30%/15% fee in mind.
3. **"Unlimited analyses" at $19.99.** With per-analysis LLM cost, unlimited is a margin risk.
   Suggest "unlimited fair use" with a documented cap and aggressive report caching.
4. **The daily feed needs inventory.** "Top value properties" requires scoring the whole market
   continuously, not on demand — a batch scoring pipeline plus the data licence to support it.
   It is a Phase 2/3 feature that looks like a Phase 1 feature. Budget for it accordingly.
5. **Melbourne-first, not Australia-first.** All existing data, all domain expertise, and the
   NewPF service business are Melbourne. Launch deep in Melbourne, expand by state once the AVM is
   calibrated. National coverage at launch multiplies data cost and dilutes accuracy.
6. **Do the lead-capture fix now.** It is days of work against the existing app and it stops losing
   revenue immediately, independent of everything else in this plan.

---

## 8. MVP development plan

Assumes 2–3 engineers. Weeks are elapsed, not ideal.

**Week 0 — Data & legal (blocking, start immediately)**
Apply for Domain API access · download NSW VG sales data · legal review of disclaimers and the
investor-advice question · confirm the NewPF/FairOffer branding decision · draft privacy policy
and consent wording.

**Weeks 1–2 — Foundation**
Monorepo + TypeScript + CI · Supabase project, migrations, **RLS from migration one** · auth
(email/Google/Apple) · onboarding flow · design tokens from the existing palette, extended to
dark mode · app shell.

**Weeks 3–4 — Data pipeline**
Ingestion jobs · address normalisation and dedupe (`address_hash`) · suburb + metrics tables
populated · autocomplete search · seed from existing hardcoded medians with honest `as_at`.

**Weeks 5–6 — Score engine** ★
`packages/scoring` as a pure function · hedonic adjustments calibrated against real sales ·
comparable selection · confidence model · component breakdown · **backtest against known sale
prices and publish the error distribution internally** · full unit test suite · versioning.

**Weeks 7–8 — AI layer**
`packages/ai` provider abstraction · report prompts with golden-output tests · report generation
and caching · `ai_usage` logging and cost dashboard · streaming UI · fallback when the LLM fails
(the score must still render).

**Weeks 9–10 — Engagement, monetisation, launch**
Watchlist · price-change alerts + push · free-tier counters · Stripe/RevenueCat · **real lead
capture with consent, CRM, and notification** · analytics · privacy policy and terms live ·
App Store / Play submission (if mobile in scope for Phase 1) · beta with real Melbourne buyers.

### Definition of done for MVP
- A buyer can analyse a Melbourne property and get a score, range, and report in under 15 seconds.
- The score is reproducible, versioned, and explainable to the component level.
- Backtested error is measured and internally published — no accuracy claim exceeds it.
- Leads are captured server-side, with consent, and reach a human within minutes.
- Every dollar figure shows its source and date.
- The disclaimer is present, unmissable, and legally reviewed.
- Free-tier limits are enforced server-side (never client-side).
- RLS verified: no cross-user data access from a client with only the anon key.

---

## 9. Open questions for you

1. **Branding:** does FairOffer AI drop NewPF co-branding, or keep "by NewPF Business Group" as a
   trust signal? This affects design, copy, and the lead-handoff story.
2. **Data budget:** what is the monthly ceiling for property data? Domain (~$500/mo) vs CoreLogic
   (materially more) changes what MVP can honestly claim.
3. **Web-first or mobile-first?** (§7.2, item 1 — my recommendation is web-first.)
4. **Do InvestorSource and ReferWise exist as running systems with APIs today**, or are they to be
   built? `erhanpricefair/property-connect` looks adjacent — is that the substrate for one of them?
5. **Geographic scope at launch:** Melbourne (recommended), Victoria, or national?
6. **Existing lead volume:** how many consultation requests does the current app generate per month?
   That number sizes the entire business case and should drive prioritisation.
7. **Legal counsel:** is there existing advice on the valuation-estimate framing, or should that
   review be scoped as part of Week 0?

---

## 10. Immediate next steps

1. Answer the Week 0 blocking items — particularly the data source decision.
2. **Fix lead capture in the current app this week** — mailto → API + database + notification +
   consent. Small, isolated, immediately revenue-positive.
3. Approve the architecture in §2, especially the Supabase decision (§7.1) and the AI boundary (§2.2).
4. Scaffold the monorepo and port the existing heuristics into `packages/scoring` as v0 with tests —
   this locks in the current behaviour as a regression baseline before improving on it.

---

*Audit performed against `erhanpricefair/fair-offer-app` @ `1fec45e` (2026-06-20).
`fairoffer.com.au` was unreachable from the audit environment (proxy 403); production behaviour is
inferred from source and should be confirmed.*
