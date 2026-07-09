# PropertyConnect — Product Requirements Document (PRD)

**Status:** Draft v1.0
**Owner:** Product
**Market:** Melbourne, Victoria (launch) → national (scale)
**Last updated:** 2026-07-09

---

## 1. Product Overview

### 1.1 What we're building
PropertyConnect is a property-services referral marketplace. Consumers enter a property journey (selling, buying, financing, or requiring a related service) through a guided intake form. The platform matches them with a vetted professional (real estate agent, mortgage broker, buyers agent, building inspector, conveyancer, or property manager) suited to their needs and location, tracks the relationship from first contact through to a successful outcome, and generates revenue via a referral fee paid on that outcome (e.g. settlement, loan drawdown).

### 1.2 What it is not
- Not a public directory or classifieds site — consumers do not browse and pick a professional themselves; the platform matches them.
- Not a lead-selling business — professionals do not pay to receive contact details; they pay (or owe a fee) only when a match converts to a paid outcome.
- Not (initially) a transaction platform — PropertyConnect does not execute the sale, loan, or inspection; it connects and tracks, the professional delivers the service.

### 1.3 Product principles
1. **One enquiry, one clear path.** A consumer should never wonder "what happens next."
2. **Exclusivity builds professional trust.** A lead sent to five agents is worth less to each than a lead sent to one.
3. **Every state transition is recorded.** If we can't answer "who has this lead and what happened to it" at any point, the ledger has failed its job.
4. **Manual override always available.** Admin/ops can intervene in any automated decision — matching is allowed to be wrong occasionally; being unable to fix it is not.
5. **Melbourne first, structured for national.** Geography, licensing rules, and service types are configuration, not hardcoded assumptions.

### 1.4 Goals for v1 (MVP)
- Launch all four consumer journeys (Sell, Buy, Finance, Other Services) in the Melbourne metro area.
- Onboard a founding cohort of verified professionals across agent, broker, inspector, conveyancer, and property manager categories.
- Achieve reliable enquiry → assignment → first-contact tracking with an auditable outcome ledger, even where outcome confirmation is initially manual/self-reported.
- Prove the referral-fee model works operationally before investing in automation (scoring models, payments-in-platform, external data integrations).

---

## 2. Target Users

| User group | Role in the platform | Primary motivation |
|---|---|---|
| **Consumers** | Submit an enquiry describing their property need | Get matched to a trustworthy professional quickly, without being spammed by multiple cold calls |
| **Real estate agents** | Receive seller (and some buyer) leads | Exclusive, locally relevant, ready-to-transact leads |
| **Mortgage brokers** | Receive finance leads | Compliant, consented leads with enough financial detail to act |
| **Buyers agents** | Receive qualified buyer leads (future-phase active matching; MVP may route to selling agents) | Genuine, budget-qualified buyer intent |
| **Building inspectors** | Receive inspection requests | Fast, transactional, high-volume/low-friction leads |
| **Conveyancers** | Receive conveyancing requests | Fast, transactional leads tied to a specific settlement timeline |
| **Property managers** | Receive rental-management leads | Ongoing-relationship leads (landlords seeking a managing agent) |
| **Administrators / Ops** | Operate the platform | Full visibility into every enquiry's lifecycle; ability to intervene, reconcile fees, resolve disputes |

---

## 3. User Personas

### 3.1 Sarah — "The Seller"
- 52, homeowner in Glen Waverley, VIC. Downsizing after kids moved out.
- Not tech-savvy beyond everyday apps; wants to feel like a human will call her, not a bot.
- Anxious about picking the "wrong" agent and overpaying commission or getting a bad price.
- **Needs:** a credible local agent recommendation, fast; reassurance that her data isn't going to five agents at once.

### 3.2 Ben — "The Buyer"
- 34, upgrading from an apartment to a house in the eastern suburbs with his partner.
- Actively looking, has done research, wants efficiency not hand-holding.
- Already has a mortgage pre-approval in progress elsewhere, or may need one.
- **Needs:** access to relevant listings/agent relationships and, if relevant, a finance connection — without duplicate effort re-entering the same information twice.

### 3.3 Priya — "The Finance Seeker"
- 29, first home buyer, has a signed contract (or is about to) and needs finance sorted quickly.
- Time-sensitive — finance clauses in contracts have deadlines.
- **Needs:** to be connected to a broker within hours, not days; wants to submit financial details once, securely.

### 3.4 Tom — "The Mid-Transaction Consumer"
- 41, has an offer accepted on a house, needs a building inspection and a conveyancer arranged within days.
- Transactional mindset — he already knows exactly what he needs, wants minimal friction.
- **Needs:** fast turnaround, clear pricing expectations, no journey-long form when he only needs one thing.

### 3.5 Alex — "The Agent" (professional persona)
- 38, sales agent at a mid-size Melbourne agency, handles 15–20 active listings.
- Judges lead quality in the first 10 seconds — will disengage from the platform if leads are stale, fake, or shared with 3 competitors.
- **Needs:** exclusivity, fast notification, easy accept/decline, minimal admin overhead.

### 3.6 Maria — "The Broker" (professional persona)
- 45, mortgage broker, aggregator-affiliated, subject to NCCP responsible-lending obligations.
- Needs proper consent captured before she can act on a lead's financial information.
- **Needs:** compliant data handoff, clear record of consumer consent, enough financial detail to triage without a live call.

### 3.7 Olivia — "The Ops Admin" (internal persona)
- Platform operations lead. Monitors enquiry flow daily, resolves professional disputes ("I never got this lead" / "that lead didn't convert"), manually re-routes when a professional doesn't respond.
- **Needs:** a single console showing every enquiry's state, ability to override matches, ability to mark/verify outcomes and generate fee records.

---

## 4. User Journeys

### 4.1 Sell Property journey
1. Consumer lands on "Sell my property" entry point.
2. Enters property address → address auto-suggests suburb/postcode (AU address lookup).
3. Enters property type, estimated value (range picker or free text), selling timeframe, current situation, contact details.
4. Consents to being contacted by a matched agent (explicit checkbox, not pre-ticked).
5. Submits → sees a confirmation screen with expected response time ("An agent will contact you within X hours").
6. Matching engine assigns to one agent covering that suburb.
7. Agent notified, accepts/declines within SLA.
8. Consumer receives confirmation of which agent will contact them (name, agency, photo if available).
9. Agent updates status over time (contacted → appraisal booked → listed → sold/settled) or admin updates on their behalf.
10. On settlement confirmation, referral fee ledger entry created.

### 4.2 Buy Property journey
1. Consumer lands on "Buy a property" entry point.
2. Enters preferred locations (multi-suburb selector), budget range, finance status (pre-approved / need finance / cash buyer), property type, buying timeframe.
3. Consents to contact.
4. If finance status = "need finance," offered an inline option to also start the Finance journey (pre-filled where data overlaps) rather than re-entering details later.
5. Submits → confirmation screen.
6. Matched to a buyers agent (if available in area) or a selling agent with relevant stock, per matching rules.
7. Same accept/decline/notify/status flow as Sell.

### 4.3 Finance journey
1. Consumer lands on "Get finance" entry point (directly, or via cross-sell from Buy/Sell journeys).
2. Enters purchase price, deposit amount, income, finance requirements (loan type/purpose, e.g. first home, investment, refinance).
3. Explicit consent screen covering credit-related data handling (distinct, stronger consent language than general contact consent, reflecting NCCP/privacy obligations).
4. Submits → confirmation screen.
5. Matched to one mortgage broker.
6. Broker accepts/declines within SLA (finance leads have a tighter SLA given contract-clause deadlines).
7. Status updates: contacted → application lodged → conditional approval → unconditional/settled.
8. Referral fee ledger entry created on loan settlement/drawdown.

### 4.4 Other Services journey
1. Consumer lands on "Other services" entry point (or is cross-sold from Sell/Buy — e.g. a buyer who just accepted an offer is prompted "need a building inspector or conveyancer?").
2. Selects service type: Building Inspection / Conveyancing / Property Management.
3. Form fields adapt to the selected service (see §5.4).
4. Consents to contact.
5. Submits → confirmation screen with expected turnaround (these are typically faster-turnaround, transactional leads).
6. Matched to one professional of the relevant type.
7. Accept/decline/notify/status flow, simplified relative to Sell/Buy (fewer status stages — e.g. inspection: booked → completed).

### 4.5 Professional journey (all lead types)
1. Professional receives notification (email + SMS) of a new lead assignment.
2. Opens workspace, views lead detail (only after accepting — see FR-8 for what's visible pre-accept).
3. Accepts or declines within SLA window.
4. If declined or SLA expires, lead automatically re-routes to next-priority professional; admin notified if it exhausts the routing pool.
5. Professional updates lead status as the relationship progresses.
6. Professional marks outcome (won/lost/no outcome) with relevant detail (e.g. settlement date) when known.

### 4.6 Admin journey
1. Admin views live dashboard of all enquiries by state (new / assigned / in-progress / outcome-pending / closed).
2. Filters/searches by professional, suburb, service type, date range.
3. Manually reassigns a lead (e.g. professional unresponsive, consumer complaint).
4. Verifies self-reported outcomes where needed, creates/adjusts referral fee ledger entries.
5. Onboards and verifies new professionals (license check, coverage area, service type).
6. Resolves disputes (professional claims non-payment, consumer complains about conduct).

---

## 5. Functional Requirements

Each requirement includes acceptance criteria in Given/When/Then form. IDs are stable references for engineering/QA traceability.

### 5.1 FR-1: Sell Property intake form

**Description:** Consumer-facing form capturing seller enquiry details.

**Fields:** property address (street-level), suburb (derived/confirmed from address), property type (house/unit/townhouse/land/other), estimated value (range), selling timeframe (ASAP / 1–3 months / 3–6 months / just researching), current situation (free text or structured: e.g. "already bought elsewhere," "need to sell before buying," "just exploring"), contact details (name, phone, email).

**Acceptance criteria:**
- Given a consumer on the Sell entry point, when they begin typing a property address, then an AU address autocomplete suggests matching addresses and auto-populates suburb and postcode on selection.
- Given a consumer has not selected a valid address from the autocomplete, when they attempt to submit, then the form blocks submission and shows "please select a valid address" (free-text-only addresses are not accepted, to preserve match quality).
- Given all required fields (address, suburb, property type, timeframe, contact details) are completed, when estimated value is left blank, then the form still allows submission (estimated value is optional — many sellers don't know it).
- Given a consumer enters a phone number, when the number does not match a valid AU mobile/landline format, then an inline validation error is shown before submission.
- Given a consumer has not checked the contact-consent checkbox, when they attempt to submit, then submission is blocked with a message explaining consent is required to proceed.
- Given a consumer submits a valid form, when submission succeeds, then an `Enquiry` record is created with type=SELL, status=NEW, and the consumer sees a confirmation screen stating expected response time.
- Given a consumer submits the form, when the suburb is outside the current Melbourne service area, then the consumer still sees a confirmation screen but is informed the platform will notify them if coverage expands (enquiry stored as status=UNSERVICEABLE, not routed).
- Given the same phone number or email submits a SELL enquiry for the same address within 30 days, when a second submission is attempted, then the system flags it as a possible duplicate for admin review rather than silently creating a duplicate active enquiry.

### 5.2 FR-2: Buy Property intake form

**Fields:** preferred locations (multi-select suburb picker, at least one required), budget (min/max range), finance status (pre-approved / applying / need to start / cash buyer), property type preference, buying timeframe.

**Acceptance criteria:**
- Given a consumer is selecting preferred locations, when they search a suburb name, then matching Melbourne-metro suburbs are suggested (typo-tolerant); non-serviceable suburbs are visibly marked as such but still selectable for future-coverage tracking.
- Given a consumer selects a budget range, when the minimum exceeds the maximum, then the form auto-corrects or blocks submission with an inline error.
- Given a consumer selects finance status = "need to start" or "applying," when they reach the confirmation step, then they are offered an inline prompt: "Would you also like to be connected with a mortgage broker?" — accepting pre-fills a Finance enquiry with any overlapping data (budget → purchase price estimate) rather than starting from a blank form.
- Given a consumer declines the finance cross-sell prompt, when they finish submission, then only the BUY enquiry is created (no FINANCE enquiry is created without explicit consent).
- Given a valid BUY form is submitted, then an `Enquiry` record is created with type=BUY, status=NEW, and matching runs against buyers agents/agents covering at least one selected suburb.

### 5.3 FR-3: Finance intake form

**Fields:** purchase price, deposit amount, income (gross annual, or range), finance requirements (loan purpose: first home / upgrade / investment / refinance; loan type if known).

**Acceptance criteria:**
- Given a consumer reaches the Finance form, when they view it, then a distinct consent statement is shown covering the collection and disclosure of financial information to a licensed broker, separate from the general contact-consent checkbox, and both must be explicitly checked before submission.
- Given a consumer enters deposit amount greater than purchase price, when they attempt to submit, then an inline validation warning is shown ("deposit exceeds purchase price — please check") but submission is not hard-blocked (edge cases like inherited property exist).
- Given a consumer enters income, when the value is entered, then it accepts either an exact figure or a banded range selection (some consumers are uncomfortable giving an exact figure — offering a range increases completion rate).
- Given a valid Finance form is submitted, then an `Enquiry` record is created with type=FINANCE, status=NEW, with an audit-logged timestamped record of the specific consent text version the consumer agreed to (required for NCCP/privacy compliance evidence).
- Given a Finance enquiry is created, when matching runs, then it is assigned to exactly one mortgage broker with coverage of the consumer's area and capacity available, and the professional-facing SLA for accept/decline is shorter than for Sell/Buy (see FR-6).

### 5.4 FR-4: Other Services intake

**Sub-flow: Building Inspection**
Fields: property address, inspection type (pre-purchase / pre-sale / pest / building & pest combined), required-by date, contact details.

**Sub-flow: Conveyancing**
Fields: transaction type (buying / selling), property address, expected settlement date, contact details.

**Sub-flow: Property Management**
Fields: property address, property type, current status (currently rented / vacant / owner-occupied moving to rental), desired management start date, contact details.

**Acceptance criteria:**
- Given a consumer selects "Other services," when the service-type selector is shown, then choosing Building Inspection, Conveyancing, or Property Management dynamically renders the correct field set without a full page reload.
- Given a consumer selects Building Inspection and enters a "required-by" date in the past, when they attempt to submit, then an inline validation error blocks submission.
- Given a consumer selects Conveyancing and provides an expected settlement date, when the date is within 5 business days, then the enquiry is flagged as urgent priority for matching (faster SLA, see FR-6).
- Given a valid Other Services form is submitted, then an `Enquiry` record is created with type=INSPECTION / CONVEYANCING / PROPERTY_MANAGEMENT respectively, status=NEW.
- Given a consumer arrives at Other Services via a cross-sell prompt from a Buy or Sell journey (e.g. after accepting an offer), when the prompt is accepted, then contact details and property address are pre-filled from the originating enquiry.
- Given a consumer completes a Property Management enquiry, when matching runs, then it is routed to a property manager with coverage in that suburb (property management leads use a simpler single-stage outcome — "management agreement signed" — rather than the multi-stage transaction lifecycle used for Sell/Buy/Finance).

### 5.5 FR-5: Consumer consent & data handling

**Acceptance criteria:**
- Given any consumer form, when the consent checkbox is presented, then it links to a plain-language explanation of what data is shared with which type of professional and why (not just a link to a long legal privacy policy).
- Given a consumer has consented and been matched, when they wish to withdraw consent, then a mechanism exists (support contact at MVP; self-service in future) to stop further contact and mark the enquiry withdrawn.
- Given any enquiry is created, then the specific consent text version and timestamp are stored immutably against that enquiry record, independent of future privacy-policy edits.

### 5.6 FR-6: Matching & routing engine

**Description:** Rules-based engine assigning each enquiry to exactly one active, eligible professional (with admin override always available). MVP scope excludes ML-based scoring.

**Acceptance criteria:**
- Given a new enquiry is created with status=NEW, when the matching engine runs, then it identifies all active professionals of the correct type whose service area covers the enquiry's suburb and who have available capacity, and assigns the enquiry to exactly one of them (priority order: e.g. response-rate score, then round-robin) — never to zero or more than one professional simultaneously, except where admin explicitly enables a multi-send rule for a specific service type.
- Given no eligible professional exists for an enquiry's suburb/service type, when matching runs, then the enquiry is set to status=UNMATCHED and surfaced on the admin dashboard for manual handling (never silently dropped).
- Given a professional is assigned an enquiry, when they do not respond (accept/decline) within the SLA window (configurable per service type — e.g. 2 hours for Finance/urgent Conveyancing, 24 hours for Sell/Buy), then the enquiry automatically re-routes to the next eligible professional and the original professional's response-rate score is decremented.
- Given a professional explicitly declines an enquiry, then it immediately re-routes to the next eligible professional without waiting for the SLA window to expire.
- Given an enquiry has been declined or timed out against every eligible professional in its area, then it is set to status=UNMATCHED and an admin alert is raised.
- Given an admin views an enquiry, when they choose to manually reassign it, then the manual assignment overrides the automated match, is logged with the admin's identity and reason, and the previously assigned professional (if any) is notified the lead has been withdrawn.
- Given a professional's service area, capacity, or active status changes, when matching next runs for pending enquiries, then it reflects the updated eligibility (no stale routing to a paused professional).

### 5.7 FR-7: Professional onboarding & verification

**Acceptance criteria:**
- Given a prospective professional applies to join, when they submit their application, then required fields include business name, ABN, professional license/registration number (where applicable — real estate agents and mortgage brokers legally require this in Victoria), service area(s), and service type.
- Given a professional's application includes a license number, when admin reviews it, then admin can mark the license as verified/unverified/rejected against the relevant public register (manual lookup at MVP), and only verified professionals can receive live leads.
- Given a professional is approved, then their account status is set to Active and they become eligible for matching; given a professional is rejected or later suspended, then they are immediately excluded from matching without needing a system restart or batch job.
- Given an active professional wants to pause receiving leads (e.g. at capacity), when they toggle availability off in their workspace, then they are excluded from matching until they toggle it back on.

### 5.8 FR-8: Professional workspace (lead management)

**Acceptance criteria:**
- Given a professional is notified of a new lead, when they open the workspace before accepting, then they see enough information to decide (suburb, service type, timeframe/urgency) but not full contact details, which are revealed only after acceptance (protects consumer privacy and prevents contact-detail harvesting without commitment).
- Given a professional accepts a lead, then full consumer contact details and enquiry detail become visible immediately, and the enquiry status updates to ASSIGNED_ACCEPTED.
- Given a professional views their active leads list, then they can filter by status and see time-since-assignment for each.
- Given a professional updates a lead's status (e.g. contacted, appraisal booked, offer made, settled/lost), then the change is timestamped and appended to the enquiry's event history (not overwritten).
- Given a professional marks a lead as resulting in a successful outcome, when they submit outcome detail (e.g. settlement date, sale price if willing to disclose), then a referral-fee ledger entry is created in pending-verification state (see FR-10).

### 5.9 FR-9: Notifications

**Acceptance criteria:**
- Given a consumer submits an enquiry, then they receive an immediate email confirmation; given they are matched, then they receive a second notification identifying the professional who will contact them.
- Given a professional is assigned a lead, then they receive both an email and SMS notification within 1 minute of assignment, containing a direct link into the workspace.
- Given a professional's SLA window is about to expire (e.g. 75% elapsed) without a response, then a reminder notification is sent before automatic re-routing occurs.
- Given an admin is required to intervene (unmatched enquiry, disputed outcome), then an internal alert (email or dashboard flag, Slack in future) is generated.

### 5.10 FR-10: Outcome tracking & referral ledger

**Acceptance criteria:**
- Given an enquiry is created, then it has an associated append-only event log recording every state transition (created, matched, accepted, declined, re-routed, status update, outcome, closed) with actor and timestamp — no transition is ever destructively edited or deleted.
- Given a professional or admin records a successful outcome, then a `ReferralFee` record is created linked to the enquiry, with status=PENDING_VERIFICATION, expected fee amount (per the applicable fee schedule for that service type/professional), and supporting detail entered.
- Given admin reviews a PENDING_VERIFICATION fee, when they confirm it, then status moves to VERIFIED and it becomes payable/invoiceable; when they reject it (insufficient evidence), then status moves to DISPUTED and both admin and the professional can add notes.
- Given a transaction that generated a referral fee later falls through (e.g. finance declined post-approval, sale collapses), when this is reported, then the fee record can be moved to VOIDED with a reason, never silently deleted.
- Given any enquiry, then admin can view its complete lifecycle (every event, timestamp, and actor) on a single timeline view.

### 5.11 FR-11: Admin console

**Acceptance criteria:**
- Given an admin logs in, then they see a dashboard summarizing enquiry counts by status, service type, and suburb for a selected date range.
- Given an admin searches for a specific enquiry (by consumer name, phone, email, or address), then matching enquiries are returned with current status and assigned professional.
- Given an admin views a professional's profile, then they see that professional's lead history, acceptance rate, average response time, and current referral-fee balance (pending/verified/disputed).
- Given an admin needs to onboard, suspend, or edit a professional's service area/capacity, then they can do so directly in the console, with changes taking effect on the next matching run.
- Given an admin needs to manually create or adjust a `ReferralFee` record (e.g. a professional reports an outcome by phone rather than through the workspace), then they can do so, with the manual action logged against their identity.

### 5.12 FR-12: Authentication & access control

**Acceptance criteria:**
- Given a consumer submits an enquiry, then no account/login is required at MVP (frictionless intake); a lightweight magic-link/OTP mechanism may be used only if the consumer wants to check enquiry status later.
- Given a professional or admin logs in, then authentication requires a password meeting minimum complexity plus (for admin) multi-factor authentication.
- Given a professional attempts to access another professional's leads via URL manipulation or API call, then access is denied and the attempt is logged.
- Given an admin account, then role-based permissions distinguish at minimum: full admin (can adjust fees, verify licenses) vs. support/ops (can view and reassign leads, cannot adjust financial records).

---

## 6. Non-Functional Requirements

| Category | Requirement | Acceptance criteria |
|---|---|---|
| **Performance** | Consumer-facing forms must feel instant | Given a consumer interacts with any intake form, when they move between steps, then each step transition renders in under 300ms and full form submission completes in under 2 seconds under normal load. |
| **Availability** | Platform must be reliably reachable | Given production operation, then the consumer intake path targets ≥99.9% uptime; a full outage during business hours directly costs live enquiries, so incident response for the intake path is highest priority. |
| **Scalability** | Must handle Melbourne-scale traffic with headroom | Given current Melbourne launch volumes, then the system architecture must support at least a 10x increase in concurrent enquiries without redesign (geography/service-type as config, not hardcoded, supports this). |
| **Security** | Protect consumer PII and financial data | Given any data in transit or at rest, then it is encrypted (TLS in transit, encryption at rest for the database); financial data collected in the Finance journey receives the same or higher protection standard as general PII. |
| **Privacy compliance** | Comply with Australian Privacy Act 1988 (APPs) | Given any consumer data collection, then purpose of collection, and third parties it will be disclosed to, are clearly stated before consent is captured; data retention and deletion policies are defined and enforced. |
| **Credit/finance compliance** | Support NCCP-adjacent obligations for Finance journey | Given a Finance enquiry, then explicit, separately recorded consent is captured before financial data is disclosed to a broker, and the platform does not itself provide credit advice or "assess" loan suitability (referral only). |
| **Professional licensing compliance** | Only route to verified license holders where legally required | Given a real estate agent or mortgage broker professional account, then no lead is routed to that account unless their license/registration has been marked verified by admin. |
| **Auditability** | Every meaningful action must be traceable | Given any state change on an enquiry, professional account, or fee record, then it is recorded in an append-only audit log with actor, timestamp, and prior/new value. |
| **Accessibility** | Consumer forms usable by people with disabilities | Given the consumer intake forms, then they meet WCAG 2.1 AA (keyboard navigable, screen-reader labeled, sufficient color contrast). |
| **Mobile responsiveness** | Majority of consumer traffic will be mobile | Given a consumer on a mobile device, then all intake journeys are fully usable (no horizontal scrolling, tap targets ≥44px) without a dedicated native app at MVP. |
| **Data integrity** | Referral-fee-relevant data must never be silently lost | Given any ledger or enquiry-event record, then deletion is disallowed at the application layer; corrections are made via new compensating events, not edits/deletes. |
| **Observability** | Ops must detect failures quickly | Given a critical failure (e.g. matching engine stops assigning leads), then automated alerting notifies engineering/ops within 5 minutes. |
| **Localization** | Australian-specific formats throughout | Given any address, phone number, or currency field, then it validates against Australian formats (AU phone numbering, AU postcodes, AUD currency) by default. |
| **Browser support** | Broad consumer reach | Given the consumer-facing site, then it supports the current and prior major version of Chrome, Safari, Firefox, and Edge on both desktop and mobile. |

---

## 7. MVP Features

**In scope for MVP (Melbourne launch):**

1. Consumer intake — all four journeys: Sell, Buy, Finance, Other Services (Inspection / Conveyancing / Property Management), per FR-1 through FR-4.
2. Cross-sell prompts between journeys where a clear data/need overlap exists (Buy→Finance, Sell/Buy→Other Services) per FR-2 and FR-4.
3. Consent capture and audit trail per FR-5.
4. Rules-based matching/routing engine (postcode/suburb + service type + capacity + simple priority scoring), with automatic re-routing on SLA timeout, and full admin override, per FR-6.
5. Professional onboarding with manual license verification by admin, per FR-7.
6. Professional workspace: accept/decline, status updates, outcome reporting, per FR-8.
7. Email + SMS notifications for consumers and professionals, per FR-9.
8. Append-only enquiry event log and referral-fee ledger with manual verification workflow, per FR-10.
9. Admin console: dashboard, search, professional management, manual fee adjustment, per FR-11.
10. Basic authentication: frictionless consumer flow, secured professional/admin login with role-based access, per FR-12.
11. Core non-functional baseline: HTTPS everywhere, encrypted data at rest, AU data validation, WCAG AA on intake forms, mobile-responsive, audit logging.

**Explicitly deferred from MVP** (see §8): buyers-agent-specific matching logic (MVP routes buyer leads to selling agents unless a buyers agent pool exists), ML-based/predictive matching, in-platform payments, external settlement-verification integrations, consumer self-service accounts/status tracking, native mobile apps, multi-market/national expansion, reviews and ratings, property manager as a fully-featured ongoing-relationship workspace (MVP treats it as a single-outcome referral like the other Other Services).

---

## 8. Future Features

Grouped by theme, roughly in order of expected priority post-MVP:

**Matching intelligence**
- Predictive/ML-based lead scoring (likelihood to convert, best-fit professional) replacing pure rules-based routing.
- Dynamic, performance-based professional prioritization (top performers get first-look on high-value leads).
- Multi-professional competitive matching for select service types (with clear consumer-facing disclosure), as an alternative to strict exclusivity.

**Outcome verification & payments**
- Integration with external data sources (e.g. CoreLogic, PEXA-adjacent settlement data feeds where accessible) to reduce reliance on self-reported outcomes.
- In-platform invoicing and payment collection from professionals (replacing manual invoicing).
- Automated dispute-resolution workflows with evidence upload.

**Consumer experience**
- Self-service consumer accounts: track enquiry status, message the matched professional in-platform, re-open/update an enquiry.
- Post-outcome review/ratings of professionals, feeding back into matching quality.
- Property journey "hub" — a consumer who sells is proactively offered buy/finance/other-services journeys as their situation evolves, with a persistent journey history.

**Professional experience**
- Native mobile app / push notifications for professional workspace.
- CRM-lite features (notes, follow-up reminders, calendar integration) inside the professional workspace.
- Subscription or tiered-capacity models for professionals (beyond pure per-outcome fees), if warranted by unit economics data gathered post-MVP.

**Platform expansion**
- Buyers agents as a fully active, distinctly matched persona (rather than MVP's fallback-to-selling-agent routing).
- Property managers as a full ongoing-relationship workspace, not a single-outcome referral.
- Geographic expansion beyond Melbourne, using the config-driven service-area model established at MVP.
- Public API / partner integrations (e.g. agency CRM systems receiving leads directly).

**Trust & compliance**
- Automated license-verification integration with relevant Victorian/national regulatory registers, replacing manual admin lookup.
- Enhanced fraud/bot detection on consumer intake (behavioral signals, device fingerprinting) beyond MVP's OTP/duplicate-detection baseline.
- Consumer-facing transparency dashboard (e.g. "here's what happens to your data").

---

## Open questions carried from architecture discussion (unresolved, tracked for follow-up)
- Exact referral-fee schedule per service type/professional category — needed before FR-10's fee-schedule logic can be finalized.
- Legal confirmation on Finance-journey consent language and NCCP positioning.
- Whether MVP treats buyers agents as a real matching pool or defers entirely to selling agents for buyer leads (affects FR-2 and FR-6 default routing rule).
