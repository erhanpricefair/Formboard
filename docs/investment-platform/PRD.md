# Meridian Property Partners — Product Requirements Document (PRD)

**Status:** Draft v1.0
**Owner:** Product
**Working brand name:** *Meridian Property Partners* ("Meridian") — a placeholder brand, trivially find-replaceable once a final name/domain is chosen. Signature service name **Settlement Accelerator™** is fixed per brief and should be treated as final.
**Market:** Australia-wide from day one (house-and-land packages are inherently multi-state; no single-metro constraint)
**Last updated:** 2026-07-22

> **Relationship to PropertyConnect:** this is a distinct product from `docs/PRD.md` (PropertyConnect, a general buy/sell/finance/services referral marketplace). Meridian is a premium *investment* marketplace matching investors and mortgage brokers to vetted house-and-land developer opportunities. The two share no code, schema, or brand and should be built as independent applications within this repo unless a later decision merges them.

---

## 1. Product Overview

### 1.1 What we're building
Meridian is a property **investment** marketplace and client-management platform. It connects two demand-side audiences — **investors** and **mortgage brokers / referral partners** — with vetted **house-and-land investment packages** sourced from property **developers**. Every opportunity is vetted and published only after admin approval. The platform's signature differentiator is the **Settlement Accelerator**, a nine-stage journey tracker that gives investors and brokers shared visibility from first enquiry through to property handover and management.

### 1.2 What it is not
- **Not the developer.** Meridian never holds stock, never sells its own product, and is never named as the seller of record on a contract. It is positioned as an **independent marketplace** that sources and matches opportunities — developers remain the vendor in every transaction.
- **Not a traditional listings site.** Investors do not get anonymous, unlimited browse access to every project on the internet. Access to full opportunity detail (price, contract terms, full brochure) is gated behind the onboarding questionnaire so that what an investor sees is pre-filtered to their stated goals — a curated shortlist, not a classifieds wall.
- **Not a lender, financial adviser, or credit provider.** Meridian does not provide personal financial advice, credit assistance, or product recommendations that constitute regulated advice under the *Corporations Act 2001* (Cth) or the *National Consumer Credit Protection Act 2009* (Cth). Brokers who are AFSL/ACL holders (or authorised credit representatives) provide the actual advice; Meridian's "recommendations" are general-information property matches, always labelled as such, with a clear handoff to a licensed broker before anything resembling financial advice occurs.
- **Not a project-management or construction platform.** Settlement Accelerator surfaces status updates sourced from developers/brokers/admin; it does not manage the build itself.

### 1.3 Product principles
1. **Trust before conversion.** Every page an investor sees before they've engaged a broker must reinforce vetting, independence, and transparency — this is a premium financial-adjacent product, not a lead-gen funnel.
2. **One investor, one visible journey.** From the moment an investor completes onboarding, they and (if applicable) their broker can always answer "where are we up to?" via the Settlement Accelerator — no journey is invisible.
3. **Curated, not comprehensive.** Matching quality (few, well-explained, relevant opportunities) beats catalogue size. An investor who sees 200 undifferentiated listings has been under-served, not well-served.
4. **Developers are vendors, not customers of convenience.** Every listing enters the platform unpublished; nothing reaches an investor without admin approval. The vetting step is a brand promise, not a formality.
5. **Brokers are partners, not bystanders.** Anywhere an investor has an attached broker, the broker has equal visibility into progress and equal ability to act on the investor's behalf (with consent), because broker-referred investors are a primary growth channel.
6. **Every match is explainable.** "We think this fits you" is only credible if the platform can say *why* in plain language tied to the investor's own stated criteria — this applies to both the AI matching engine and any human-curated recommendation.
7. **Compliance is structural, not a checkbox.** Financial-advice boundaries, consent capture, and vendor-disclosure requirements are enforced by what the schema and UI allow, not by a disclaimer users scroll past.

### 1.4 Goals for v1 (MVP)
- Launch the full investor funnel: premium homepage → onboarding questionnaire → matched dashboard → saved/compared properties → consultation booking, nationally (state/suburb preference is investor-selected, not hard-coded to one metro).
- Launch broker and developer portals sufficient for a founding cohort of brokers to manage referred clients, and a founding cohort of developers to submit projects for admin approval.
- Ship Settlement Accelerator as a working nine-stage tracker visible to investor, attached broker, and admin, with an append-only event history.
- Ship a deterministic, explainable matching engine (rules/scoring based — see §5.3) as the v1 "AI matching" implementation, with the schema and service boundary designed so an LLM-based scorer/explainer can be swapped in without a data-model change (see Architecture doc §5).
- Prove the admin approval workflow prevents any unvetted listing from reaching an investor.

---

## 2. Target Users

| User group | Role in the platform | Primary motivation |
|---|---|---|
| **Investors** | Complete onboarding questionnaire, receive matched opportunities, save/compare, book consultations, track their Settlement Accelerator journey | Find a small number of well-explained, credible investment-grade house-and-land opportunities without wading through a generic listings site |
| **Mortgage brokers / referral partners** | Manage a book of referred/existing clients on the platform, view available projects, share opportunities, track referral commissions and Settlement Accelerator status | Give existing clients a differentiated, branded property-sourcing service that keeps the broker visible and central to the relationship (not disintermediated) |
| **Developers** | Submit projects and individual listings (pricing, rental estimates, docs, images) for admin approval and publication | Reach a vetted, warm pool of investment-ready buyers without running their own marketing/sales funnel |
| **Administrators / Ops** | Approve/reject listings, manage all four user types, monitor leads and Settlement Accelerator progress across the platform, run analytics | Full control over what gets published (brand risk), full visibility into pipeline health and conversion |

---

## 3. User Personas

### 3.1 David — "The First-Time Investor"
- 33, Sydney-based PAYG professional, household income ~$155k combined with partner, no investment property yet.
- Has $60–80k saved, doesn't fully understand yield vs. growth trade-offs, is nervous about being "sold to" by a developer's in-house sales team.
- **Needs:** plain-language education, a small number of credible options rather than an overwhelming catalogue, reassurance that the platform isn't the vendor and has no bias toward any one developer.

### 3.2 Priya — "The Experienced Investor"
- 47, owns two investment properties already, looking for a third, cash-flow-focused (she's approaching serviceability limits and wants yield over pure growth).
- Time-poor, wants efficient filtering (yield %, price band, completion timeline) more than hand-holding.
- **Needs:** fast access to hard numbers (yield, rental estimate, comparison tools), minimal friction, direct broker access for finance structuring.

### 3.3 Maria — "The Broker" (professional persona)
- 44, mortgage broker with an established client book, aggregator-affiliated, holds an Australian Credit Licence authorisation.
- Wants a value-add she can offer clients (property sourcing) without losing the client relationship to a third party, and wants visibility into what her clients are doing on the platform even when she isn't the one who drove them there.
- **Needs:** a client roster view, referral/commission tracking she can trust, and Settlement Accelerator visibility so she isn't blindsided by a client's status changing without her knowledge.

### 3.4 James — "The Developer BDM" (professional persona)
- 39, business development manager at a mid-size house-and-land developer active in two growth corridors.
- Judges the platform on whether it sends genuinely qualified, finance-ready buyers versus tyre-kickers, and on how easy it is to keep listing data (price, availability, docs) current.
- **Needs:** simple project/listing submission, visibility into approval status, confidence that only serious investor leads reach his sales team.

### 3.5 Olivia — "The Ops Admin" (internal persona)
- Platform operations lead, gatekeeper for every listing and every developer/broker application.
- **Needs:** a single approval queue, ability to see every investor's matched opportunities and journey stage, ability to intervene (reassign a broker, pause a listing, adjust a match) and see platform-wide analytics.

---

## 4. User Journeys

### 4.1 Investor journey (primary funnel)
1. Investor lands on the homepage via the primary CTA "Find My Investment Opportunity."
2. Completes the onboarding questionnaire (§5.2): personal details, investor experience level, budget, deposit, preferred states/suburbs, growth-vs-cash-flow preference, owner-occupier-vs-investment intent, finance status, timeframe.
3. Account is created (or linked, if the investor arrived via a broker's shared referral link — see §4.3) and the matching engine runs immediately.
4. Investor lands on their dashboard: a ranked shortlist of matched opportunities, each with a plain-language "why this matches you" explanation.
5. Investor can save properties, build a side-by-side comparison, download brochures (gated — requires a completed profile), and book a consultation with a broker.
6. Booking a consultation (or a developer/admin manually attaching a broker) creates the investor's **Settlement Accelerator** journey, starting at Stage 1 (Investor Enquiry) and immediately advancing to Stage 2 (Strategy Consultation) once booked.
7. As the investor progresses (finance assessment → property selection → contract → construction → settlement → handover → property management), their dashboard's progress tracker reflects the current Settlement Accelerator stage in real time.

### 4.2 Investor journey — matching example (worked, per brief)
- **Investor input:** budget $700,000; deposit available $70,000 (10%); preference = capital growth over cash flow; preferred state = VIC.
- **System behaviour:** the matching engine filters published, approved listings to price ≤ budget and deposit-required ≤ stated deposit, then ranks by a weighted score favouring listings tagged with high growth-driver scores (infrastructure spend, population growth, upzoning) over listings tagged for high rental yield.
- **Example result:** a townhouse package in a Melbourne growth-corridor project (e.g. Officer/Clyde/Wyndham-type corridor) scores highest.
- **Explanation shown to investor (plain language, generated from the same inputs that produced the score):** *"This matches your $700k budget and $70k deposit, and is weighted toward capital growth — this project sits in a designated growth corridor with confirmed rail and town-centre infrastructure investment, which is the growth driver you told us matters most to you."* See Architecture §5 for how the score → explanation mapping works and how it upgrades to an LLM-generated explanation without changing the underlying data contract.

### 4.3 Broker-referred investor journey
1. Broker shares a personalised referral link (or manually adds a client record) from their broker dashboard.
2. Client completes the same onboarding questionnaire as a direct investor; the referral link pre-associates the resulting investor account with that broker (`broker_clients` relationship, see Database doc).
3. Broker's dashboard shows the client's status, matched opportunities, and Settlement Accelerator stage as it progresses — broker does not need the investor to manually share anything.
4. When the client progresses to a settlement outcome, a referral/commission record is created against the broker per the applicable commission schedule (§8, deferred to Future for full automation — MVP captures the record, payment is manual/off-platform).

### 4.4 Developer journey
1. Developer (or their team member) logs into the developer portal and creates a **project** (a development/estate) then one or more **listings** (individual house-and-land packages within it) — location, land size, build size, price, deposit required, rental estimate, growth drivers, nearby infrastructure, completion timeline, images, floor plans, brochure.
2. Listing is saved in `DRAFT`, then submitted for review (`PENDING_REVIEW`).
3. Admin reviews the listing against vetting criteria (documentation completeness, pricing sanity, developer standing) and either approves (`APPROVED` → visible to matching/investors once also marked `PUBLISHED`) or rejects with a reason (`REJECTED`, developer can revise and resubmit).
4. Developer can update availability/pricing on a published listing; material changes (price, availability) re-trigger a lightweight review flag rather than unpublishing outright (configurable).

### 4.5 Admin journey
1. Admin views the listing approval queue (all `PENDING_REVIEW` items) and processes each with approve/reject + notes.
2. Admin views platform-wide dashboards: investors by stage, brokers by client count/conversion, developers by listing count/approval rate, leads and conversion funnel, Settlement Accelerator stage distribution.
3. Admin can manually attach/reassign a broker to an investor, override a match, pause/unpublish a listing, and suspend a broker/developer account.
4. Admin manages role-based user accounts across all four roles (§Auth) and can impersonate-view (read-only) any account's dashboard for support purposes.

### 4.6 Settlement Accelerator journey (cross-cutting)
A single, append-only, nine-stage tracker attached to one investor↔listing engagement (an investor may have more than one active Settlement Accelerator journey if pursuing multiple opportunities, though this is expected to be rare):

1. **Investor Enquiry** — created automatically when onboarding completes or a consultation is requested.
2. **Strategy Consultation** — broker (or admin, if unassigned) has an initial strategy call with the investor.
3. **Finance Assessment** — broker confirms borrowing capacity / pre-approval status.
4. **Property Selection** — investor confirms a specific listing to proceed with (links the journey to a `listing_id`).
5. **Contract Signed** — investor has executed a contract of sale with the developer.
6. **Construction Updates** — periodic status updates through the build (sub-events, not sub-stages — see Database doc).
7. **Settlement Preparation** — pre-settlement checklist / solicitor and lender coordination status.
8. **Handover** — keys/handover complete.
9. **Property Management** — property is tenanted/managed; journey reaches its terminal "active management" state rather than closing outright.

Visible to: the investor, their attached broker (if any), and admin. Every stage transition is a timestamped, actor-attributed, append-only event (mirrors the audit-log principle used in PropertyConnect's enquiry ledger — see `settlement_stage_events` in the Database doc).

---

## 5. Functional Requirements

Acceptance criteria in Given/When/Then form, IDs stable for engineering/QA traceability.

### 5.1 FR-1: Homepage & conversion funnel

**Description:** Premium marketing homepage designed to convert visitors into onboarding starts.

**Acceptance criteria:**
- Given a visitor lands on the homepage, then they see: hero (headline "Access Australia's Property Investment Opportunities", subheadline, primary CTA "Find My Investment Opportunity", secondary CTA "Broker Login"), trust signals (vetting process, independence statement), developer-partnership social proof, a "how it works" section, a "why investors use us" section, a Settlement Accelerator explainer, testimonials, and an FAQ.
- Given a visitor clicks the primary CTA, then they are taken directly into the onboarding questionnaire (§5.2), not a generic sign-up form.
- Given a visitor clicks "Broker Login," then they are routed to broker authentication, not the investor flow.
- Given the homepage is viewed on mobile, then all sections remain single-column, tap targets ≥44px, no horizontal scroll (mirrors PropertyConnect's mobile-responsiveness NFR).
- Given the homepage renders, then no content or copy implies Meridian is the developer/vendor of any listed property — all copy uses "we match you with vetted opportunities from developers" framing.

### 5.2 FR-2: Investor onboarding questionnaire

**Description:** Multi-step questionnaire collecting the data the matching engine and broker handoff depend on.

**Fields:** name, email, phone (personal); investor experience (first property / experienced investor); budget range; deposit available; preferred state(s); preferred suburb(s) (optional, multi-select, typo-tolerant search); capital-growth-vs-cash-flow preference (slider or 3-point scale); owner-occupier or investment intent; finance status (pre-approved / applying / not started / cash); purchase timeframe.

**Acceptance criteria:**
- Given an investor is on the questionnaire, when they move between steps, then progress is saved incrementally (no full-form loss on browser refresh/close).
- Given an investor has not completed the required fields (name, email, phone, budget, deposit, at least one preferred state, growth/cash-flow preference, finance status, timeframe), when they attempt to finish, then submission is blocked with inline errors on the incomplete fields; preferred suburb is optional.
- Given an investor enters a deposit greater than their stated budget, when they attempt to proceed, then an inline validation warning is shown (not hard-blocked — deposits can legitimately include equity release calculations the tool doesn't model).
- Given an investor completes the questionnaire, then an `investor_profile` record is created/updated, the matching engine runs synchronously (or near-synchronously — target <3s, see NFR table) and the investor is routed to their dashboard with results already populated.
- Given an investor arrived via a broker referral link, when they complete the questionnaire, then their resulting account is automatically linked to that broker's client roster without additional steps.
- Given a returning investor logs in, when they wish to update their investment profile, then they can re-open and edit the questionnaire from their dashboard, and the matching engine re-runs on save.

### 5.3 FR-3: Matching engine

**Description:** v1 is a deterministic, weighted-scoring engine over investor preferences and published-listing attributes, designed with an explanation layer that can be upgraded to LLM-generated copy without a schema change (see Architecture §5 for the algorithm and upgrade path).

**Acceptance criteria:**
- Given an investor profile and the set of `PUBLISHED` listings, when matching runs, then only listings with price ≤ investor budget and required deposit ≤ investor's stated deposit are eligible candidates.
- Given eligible candidates, when scored, then listings are ranked using a weighted combination of: growth-driver score vs. investor's growth/cash-flow preference, rental-yield score vs. the same preference (inverse-weighted to growth), state/suburb match, and completion-timeframe fit — weights documented in Architecture §5.2.
- Given a ranked result set, then each listing surfaced to the investor includes a short, plain-language explanation string generated from the specific score components that drove its ranking (not generic marketing copy) — see the worked example in §4.2.
- Given fewer than 3 eligible listings exist for an investor's criteria, then the dashboard explicitly says so and offers to widen criteria (e.g. adjacent price band, additional states) rather than silently showing an empty or padded-with-irrelevant-results list.
- Given a new listing is published or an existing listing's price/availability changes, then matching re-runs for active investors on the next scheduled batch (not necessarily instantly — see NFR table) and dashboards reflect updated matches on next load.

### 5.4 FR-4: Investor dashboard

**Acceptance criteria:**
- Given an investor logs in, then their dashboard shows: ranked recommended opportunities with match explanations, a saved-properties list, a comparison tool (select 2–4 listings side-by-side on price/yield/growth/land+build size/completion date), brochure download links (gated behind a completed profile), a "book a consultation" CTA, and a Settlement Accelerator progress tracker (if a journey exists) or a prompt to start one.
- Given an investor selects "compare" on 2–4 saved/matched listings, then a side-by-side table renders the core investment attributes (§5.5 fields) without a page reload.
- Given an investor clicks "download brochure," when their profile is incomplete, then they are prompted to complete onboarding first (protects developer content from unqualified scraping while keeping friction minimal for genuine investors).
- Given an investor books a consultation, then a `consultation_booking` record is created, the investor's assigned broker (existing or auto-assigned round-robin/admin-assigned if none) is notified, and the Settlement Accelerator journey is created/advanced to Stage 2.

### 5.5 FR-5: Property listings & filtering

**Fields per listing:** project name, location (address/suburb/state), developer, land size, build size, price, deposit required, rental estimate, expected yield (derived: rental estimate ÷ price), growth drivers (structured tags + free text), nearby infrastructure (structured tags + free text), completion timeline, images (gallery), floor plans, brochure (PDF download).

**Acceptance criteria:**
- Given the listings surface (dashboard matches or a broader browse view — see §Open Questions on whether unauthenticated browse is in scope), then listings are filterable by location (state/suburb), price range, yield range, property type, and completion-date range, with filters combinable (AND logic).
- Given a listing is displayed, then all fields above are shown, with images/floor plans in a gallery component and the brochure as a discrete download action (download events are logged for developer/admin analytics).
- Given a listing has `status != PUBLISHED`, then it is never returned by any investor-facing query, filter, or matching run, regardless of admin/developer view state elsewhere in the platform.

### 5.6 FR-6: Broker portal — client management

**Acceptance criteria:**
- Given a broker logs in, then they see a client roster: each client's name, onboarding-completion status, matched-opportunity count, Settlement Accelerator stage, and last-activity date.
- Given a broker adds a client manually (email invite) or shares a referral link, then the resulting investor account is linked to that broker per §4.3.
- Given a broker opens a client record, then they see that client's full investor profile, matched/saved/compared properties, and Settlement Accelerator timeline (read/comment access; stage-advancing actions are limited to the stages a broker is authorised to progress — see Architecture §4 RBAC matrix).
- Given a broker wants to share a specific opportunity with a client (rather than relying on matching alone), then they can do so directly from the project/listing view, and the client sees it flagged as "shared by your broker" on their dashboard.

### 5.7 FR-7: Broker referral tracking & commissions

**Acceptance criteria:**
- Given a broker's referred client reaches Settlement Accelerator Stage 5 (Contract Signed) or later, then a `referral` record is created/updated against that broker with status `PENDING`, linked to the specific investor↔listing engagement.
- Given admin reviews a `PENDING` referral, when they confirm the outcome (e.g. against developer-reported settlement), then status moves to `CONFIRMED`; MVP does not calculate or pay commission automatically — the record exists for tracking, with commission amount as a manually entered field (mirrors PropertyConnect's MVP approach of self-reported/admin-verified outcomes before automating payment).
- Given a broker views their dashboard, then they see a referral summary (pending/confirmed count and, where entered, value) — full commission-schedule automation is explicitly deferred (§8).

### 5.8 FR-8: Developer portal — project & listing submission

**Acceptance criteria:**
- Given a developer creates a project, then required fields are project name, developer entity, and at least one location; a project can contain multiple listings.
- Given a developer creates a listing under a project, then all §5.5 fields are capturable, with images/floor plans/brochure uploaded to storage (see Architecture §7) and validated for file type/size before accepting.
- Given a developer saves a listing without submitting, then it remains `DRAFT`, visible only to that developer's team and admin.
- Given a developer submits a listing for review, then status moves to `PENDING_REVIEW` and it enters the admin approval queue (§5.9); the developer cannot self-approve under any account permission level.
- Given a developer edits price or availability on an already-`PUBLISHED` listing, then the change applies immediately but is flagged for a lightweight admin re-check (does not unpublish automatically).

### 5.9 FR-9: Admin approval workflow

**Acceptance criteria:**
- Given a listing enters `PENDING_REVIEW`, then it appears in the admin approval queue with all submitted fields, developer standing (approval history/rejection rate), and any flags (e.g. missing brochure, price outlier vs. comparable listings).
- Given an admin approves a listing, then status moves to `APPROVED`; the developer can then toggle it live (`PUBLISHED`) or admin can publish directly — both paths logged with actor.
- Given an admin rejects a listing, then status moves to `REJECTED` with a required reason field, visible to the developer, and the developer can revise and resubmit (creates a new review cycle, prior rejection remains in history, not deleted).
- Given a listing is `PUBLISHED`, when admin needs to pull it (e.g. sold out, developer request, compliance issue), then they can set it to `ARCHIVED`/`PAUSED`, which immediately excludes it from matching and browse without deleting its historical data (referenced by existing Settlement Accelerator journeys and saved/compared lists).

### 5.10 FR-10: Settlement Accelerator journey tracker

**Acceptance criteria:**
- Given an investor's journey exists, then its current stage (of the nine in §4.6) and full stage-event history are visible to the investor, their attached broker, and admin, each timestamped and actor-attributed.
- Given a stage-advancing action occurs (e.g. broker confirms finance assessment complete, admin marks contract signed), then a new `settlement_stage_event` is appended — no existing event is edited or deleted (mirrors PropertyConnect's append-only enquiry ledger principle).
- Given Stage 6 (Construction Updates) is current, then sub-updates can be posted without changing the stage itself (construction is a single stage with many updates, not multiple stages).
- Given a journey reaches Stage 9 (Property Management), then it is treated as the terminal active state (not "closed") — the platform continues to show it as the investor's current status rather than archiving it.
- Given admin needs to correct a mis-recorded stage, then they can append a correcting event with a reason (never delete/edit the erroneous one), preserving full audit history.

### 5.11 FR-11: Consultation booking

**Acceptance criteria:**
- Given an investor requests a consultation, when they have an attached broker, then the booking routes to that broker; when they have none, then it routes to an available broker per a simple round-robin/admin-configurable assignment rule, or to admin for manual assignment if no broker capacity is configured.
- Given a consultation is booked, then both investor and broker receive a confirmation notification (email at MVP; see NFR table for timing) and the Settlement Accelerator journey is created/advanced as described in §5.4.

### 5.12 FR-12: AI investor assistant chatbot (foundation)

**Acceptance criteria:**
- Given an investor is on their dashboard or a listing detail page, then a chat entry point is available (MVP scope: foundational — see Architecture §8 for what ships as working vs. stubbed).
- Given an investor asks a question the assistant can answer from platform data (their own matches, a listing's published attributes, their own Settlement Accelerator stage), then it answers from that data, not from unconstrained generation — the assistant never fabricates listing attributes or gives personal financial/credit advice; any question crossing into advice is deflected to "speak with your broker" with a booking CTA.
- Given the assistant is asked something outside its grounded data (e.g. general market speculation), then it declines or gives clearly-labelled general information, never presenting itself as a licensed adviser.

### 5.13 FR-13: AI suburb summaries & investment explanations

**Acceptance criteria:**
- Given a listing's suburb, then a cached, periodically-refreshed AI-generated summary (growth drivers, infrastructure, demographic trend framing) is available to show alongside the listing — cached rather than generated per page view (cost/latency control, see Architecture §8.2).
- Given a match is shown to an investor, then its explanation (§5.3) is generated from the same structured inputs whether produced by the v1 deterministic template or a later LLM upgrade — the investor-facing contract (a short, criteria-grounded explanation string) does not change across that upgrade.
- Given any AI-generated suburb/investment content is displayed, then it is visibly labelled as AI-assisted general information, not personalised financial advice.

### 5.14 FR-14: Automated follow-up emails (foundation)

**Acceptance criteria:**
- Given an investor completes onboarding but does not book a consultation within a configurable window, then an automated follow-up email is queued (foundation: the trigger/queue mechanism ships in MVP; sophisticated content personalisation is deferred, see §8).
- Given an investor's Settlement Accelerator stage advances, then a status-update email is sent to the investor (and broker, if attached) summarising the change.
- Given any automated email is sent, then the send is logged (recipient, template, trigger reason, timestamp) for admin visibility and to prevent duplicate sends on retry.

### 5.15 FR-15: Authentication & role-based access control

**Acceptance criteria:**
- Given a new user registers, then they are assigned exactly one of four roles at creation: `investor`, `broker`, `developer`, `admin` — role is not self-service-changeable after creation (admin-only reassignment, logged).
- Given a broker, developer, or admin account, then login requires email+password (or magic link) at minimum, with MFA required for `admin` accounts.
- Given an investor completes onboarding without a pre-existing account, then a lightweight account (magic-link/OTP) is created transparently as part of that flow — no separate "create an account" friction step before matching value is shown.
- Given any authenticated request, then row-level access is enforced server-side (not just hidden in the UI) such that a broker can only read clients explicitly linked to them, a developer can only read/write their own projects/listings, and an investor can only read their own profile/matches/journey — admin bypasses these scopes for support purposes only, and every such bypass is logged.

### 5.16 FR-16: Admin analytics dashboard

**Acceptance criteria:**
- Given an admin logs in, then they see summary metrics: investor signups and onboarding-completion rate, matches generated, consultations booked, listings by status (draft/pending/approved/published/archived), broker referral pipeline (pending/confirmed), and Settlement Accelerator stage distribution across all active journeys — filterable by date range.
- Given an admin searches for a specific investor, broker, developer, or listing, then matching records are returned with current status and quick links into full detail.
- Given an admin needs to manage any user account (suspend, reassign role, reassign broker↔investor link), then they can do so directly, with the action logged against their identity.

---

## 6. Non-Functional Requirements

| Category | Requirement | Acceptance criteria |
|---|---|---|
| **Performance** | Onboarding and dashboard must feel instant | Given an investor completes onboarding, then matching results render within 3 seconds under normal load; step transitions within the questionnaire render in under 300ms. |
| **Availability** | Public funnel must be reliably reachable | Given production operation, then the homepage/onboarding path targets ≥99.9% uptime. |
| **Scalability** | National launch, not single-metro | Given the data model, then state/suburb, developer, and listing entities are fully data-driven (no hardcoded metro assumptions), supporting national scale without redesign. |
| **Security** | Protect investor PII and financial-profile data | Given any data in transit or at rest, then it is encrypted (TLS in transit, encryption at rest); budget/deposit/finance-status data receives the same protection standard as general PII. |
| **Privacy compliance** | Comply with the Australian Privacy Act 1988 (APPs) | Given any investor data collection, then the purpose of collection and which third parties (brokers, developers) it may be disclosed to are clearly stated before/at the point of consent. |
| **Financial-services compliance** | No unlicensed financial/credit advice | Given any platform-generated content (match explanations, AI chatbot, suburb summaries), then it is presented as general information only, never as personal financial or credit advice, with a clear handoff to a licensed broker before any advice-adjacent conversation proceeds. |
| **Vendor-independence integrity** | Never imply Meridian is the developer/vendor | Given any investor- or broker-facing surface, then copy and UI must attribute each listing to its actual developer and must not present Meridian as seller of record. |
| **Auditability** | Every meaningful state change must be traceable | Given any change to a listing's status, a Settlement Accelerator stage, or a broker↔investor link, then it is recorded in an append-only log with actor, timestamp, and prior/new value. |
| **Accessibility** | Investor-facing surfaces usable by people with disabilities | Given the homepage, onboarding, and dashboard, then they meet WCAG 2.1 AA. |
| **Mobile responsiveness** | Investment decisions increasingly start on mobile | Given a user on a mobile device, then onboarding, dashboard, and listing browsing are fully usable without horizontal scrolling, tap targets ≥44px. |
| **Data integrity** | Settlement/referral-relevant data must never be silently lost | Given any Settlement Accelerator or referral record, then deletion is disallowed at the application layer; corrections are new compensating events, not edits/deletes. |
| **Observability** | Ops must detect failures quickly | Given a critical failure (e.g. matching engine stops producing results, admin approval queue stalls), then automated alerting notifies engineering/ops promptly. |
| **Localisation** | Australian-specific formats throughout | Given any address, phone, or currency field, then it validates against Australian formats (AU phone numbering, AU postcodes, AUD currency) by default. |
| **Browser support** | Broad reach across investor and professional users | Given the platform, then it supports the current and prior major version of Chrome, Safari, Firefox, and Edge on desktop and mobile. |

---

## 7. MVP Scope

**In scope for MVP:**
1. Premium homepage with full conversion-funnel content per FR-1.
2. Investor onboarding questionnaire and account creation per FR-2.
3. Deterministic weighted-scoring matching engine with template-based plain-language explanations per FR-3 (LLM-generated explanations are a fast-follow, not MVP-blocking, since the explanation *contract* is designed to be stable across that upgrade).
4. Investor dashboard: recommendations, saved properties, comparison tool, gated brochure download, consultation booking, Settlement Accelerator tracker per FR-4.
5. Property listings with full attribute set and filtering per FR-5.
6. Broker portal: client roster, add/link clients, view client detail and journey, share opportunities per FR-6.
7. Broker referral tracking (record-keeping, not automated payment) per FR-7.
8. Developer portal: project/listing submission with media/document upload per FR-8.
9. Admin approval workflow enforcing that nothing reaches investors unvetted, per FR-9.
10. Settlement Accelerator nine-stage tracker with append-only events, per FR-10.
11. Consultation booking with broker routing per FR-11.
12. Role-based authentication for all four roles per FR-15.
13. Admin analytics dashboard per FR-16.
14. AI foundations that actually function at MVP: cached suburb summaries (FR-13) and follow-up email triggers/logging (FR-14). Chatbot (FR-12) ships as a working, narrowly-grounded assistant scoped to platform data — not a general-purpose LLM surface.

**Explicitly deferred from MVP** (see §8): automated commission calculation/payment, LLM-generated match explanations (v1 uses template-based explanations grounded in the same score data), external settlement-verification integrations (developer-reported/self-reported at MVP, mirroring PropertyConnect's approach), native mobile apps, public unauthenticated listings browse (MVP gates full detail behind onboarding — see Open Questions), featured-listing paid placement tooling, subscription billing, multi-currency/international expansion.

---

## 8. Future Features

**Matching intelligence**
- LLM-generated match explanations and an LLM-assisted suburb-summary refresh pipeline, replacing the v1 template layer (schema already supports this — see Architecture §5.3, §8.2).
- Predictive scoring using historical match→consultation→settlement conversion data.

**Broker & commission automation**
- Automated commission calculation against a configurable fee schedule per developer/listing, with invoicing.
- Broker performance leaderboards and tiered access to featured/early-access listings.

**Developer tooling**
- Bulk listing import (CSV/API) for developers with large catalogues.
- Developer-facing analytics (views, saves, brochure downloads, match-inclusion rate per listing).

**Consumer experience**
- Public (pre-onboarding) limited browse of anonymised/aggregated opportunity data, as a top-of-funnel SEO/trust layer, distinct from the gated full-detail investor dashboard.
- In-platform messaging between investor and broker (beyond consultation booking).
- Mobile app / push notifications for Settlement Accelerator updates.

**Platform expansion**
- Featured-listing paid placement and subscription tiers for developers, per the business model in the brief.
- Property-management-phase tooling beyond a static "terminal stage" (rent tracking, statements) if Meridian extends into ongoing management rather than referral-only.

**Trust & compliance**
- Formal AFSL/ACL-aware content review workflow for any AI-generated investor-facing copy.
- Enhanced fraud/duplicate-lead detection on the onboarding funnel.

---

## Open questions carried forward for follow-up
- Whether any anonymised/limited listing content should be publicly browsable pre-onboarding for SEO/trust purposes, or whether full gating behind the questionnaire (as specified in the brief: "download brochures" implies a completed profile) is the permanent policy, not just an MVP simplification.
- Exact commission schedule and structure per developer/listing category — needed before FR-7's automated-payment fast-follow can be scoped.
- Legal review of AI chatbot and match-explanation copy against ASIC general-advice-vs-personal-advice guidance before FR-3/FR-12 ship broker-facing (not just internal-review) content.
- Whether an investor may have more than one concurrent Settlement Accelerator journey (pursuing multiple opportunities in parallel) as a supported case, or whether product wants to constrain to one active journey at a time to keep broker/admin views simpler.
