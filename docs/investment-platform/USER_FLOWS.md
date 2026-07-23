# InvestorSource — User Flow Diagrams

**Status:** Draft v1.0
Companion to `PRD.md` (journeys in §4, requirements FR-1…FR-16) and `ARCHITECTURE.md`. Diagrams use Mermaid.

---

## 1. Investor funnel — homepage to matched dashboard (FR-1, FR-2, FR-3, FR-4)

```mermaid
flowchart TD
    A[Homepage] -->|"Find My Investment Opportunity"| B[Onboarding Questionnaire]
    A -->|"Broker Login"| Z[Broker Auth]
    B --> B1[Step 1: Personal details\nname, email, phone]
    B1 --> B2[Step 2: Experience level]
    B2 --> B3[Step 3: Budget and deposit]
    B3 --> B4[Step 4: Preferred states/suburbs]
    B4 --> B5[Step 5: Growth vs cash flow preference]
    B5 --> B6[Step 6: Owner-occupier or investment]
    B6 --> B7[Step 7: Finance status]
    B7 --> B8[Step 8: Timeframe]
    B8 --> C{Account exists?}
    C -->|No| D[Create investor account\nmagic-link/OTP, transparent]
    C -->|Yes, returning| E[Update investor_profiles]
    D --> F[Matching engine runs\nlib/matching/score.ts]
    E --> F
    F --> G[Investor Dashboard]
    G --> H[Ranked matches\nwith plain-language explanations]
    G --> I[Saved properties]
    G --> J[Comparison tool]
    G --> K[Brochure downloads\ngated: profile must be complete]
    G --> L[Book consultation]
    G --> M[Settlement Accelerator tracker]
    L --> N[settlement_journeys created\nStage 1: Investor Enquiry]
    N --> O[Stage 2: Strategy Consultation\non booking confirmation]
```

---

## 2. AI matching — worked example (PRD §4.2)

```mermaid
flowchart LR
    In["Investor profile\nbudget=$700k, deposit=$70k,\ngrowth_yield_score=80 (growth-leaning), state=VIC"]
    In --> Filter{"Eligibility filter\nprice <= 700k AND\ndeposit_required <= 70k AND\nstatus = published"}
    Filter -->|excluded| X[Listing dropped from candidate set]
    Filter -->|eligible| Score["Weighted score:\ngrowthFit x0.35 + yieldFit x0.35\n+ locationFit x0.20 + timeframeFit x0.10"]
    Score --> Rank[Rank candidates by total_score]
    Rank --> Top["Top result: Melbourne growth-corridor\ntownhouse package"]
    Top --> Explain["explain() reads score_breakdown\nand listing.growth_drivers"]
    Explain --> Out["'This matches your $700k budget and $70k\ndeposit, and is weighted toward growth —\nthis project sits in a designated growth\ncorridor with confirmed rail and\ntown-centre infrastructure investment,\nwhich is the growth driver you told us\nmatters most to you.'"]
```

---

## 3. Broker-referred investor flow (PRD §4.3, FR-6)

```mermaid
sequenceDiagram
    participant Broker
    participant Client as Prospective Investor
    participant Platform
    Broker->>Platform: Generate/share referral link (broker_profiles.referral_link_slug)
    Broker->>Client: Sends link
    Client->>Platform: Opens link, completes onboarding questionnaire
    Platform->>Platform: Create investor account + investor_profiles row
    Platform->>Platform: Insert broker_clients (source=referral_link)
    Platform->>Broker: Client now visible in roster (dashboard/clients)
    Client->>Platform: Views matched dashboard, saves/compares listings
    Broker->>Platform: Opens client detail, sees matches + journey stage
    Broker->>Client: (optional) Shares a specific listing directly
    Platform->>Client: Listing flagged "shared by your broker" on dashboard
    Client->>Platform: Books consultation
    Platform->>Broker: Consultation routed to broker (already linked), notified
    Platform->>Platform: settlement_journeys created, broker_id set
    Note over Platform: Journey progresses; on Stage 5 (Contract Signed)+,<br/>a referrals row is created (status=pending) against the broker
```

---

## 4. Developer submission → admin approval → publish (PRD §4.4, FR-8, FR-9)

```mermaid
stateDiagram-v2
    [*] --> draft: Developer creates listing
    draft --> draft: Developer edits fields,\nuploads images/docs
    draft --> pending_review: Developer submits for review
    pending_review --> approved: Admin approves
    pending_review --> rejected: Admin rejects + reason
    rejected --> pending_review: Developer revises, resubmits\n(new review cycle; prior rejection kept in history)
    approved --> published: Developer or admin publishes
    published --> published: Developer edits price/availability\n(flagged for lightweight re-check,\nnot auto-unpublished)
    published --> paused: Admin pauses\n(sold out / compliance issue)
    paused --> published: Admin resumes
    published --> archived: Admin archives
    paused --> archived: Admin archives
    archived --> [*]

    note right of pending_review
        Never visible to investors,
        matching engine, or filters
        while in draft or pending_review.
    end note
    note right of published
        Only status eligible for
        investor-facing display and
        lib/matching/score.ts candidates.
    end note
```

---

## 5. Admin approval queue operation (FR-9, FR-16)

```mermaid
flowchart TD
    A[Listing enters pending_review] --> B[Appears in admin approvals queue]
    B --> C[Admin reviews:\nfield completeness, pricing sanity\nvs comparables, developer standing]
    C --> D{Decision}
    D -->|Approve| E[status = approved]
    E --> F{Who publishes?}
    F -->|Developer toggles live| G[status = published]
    F -->|Admin publishes directly| G
    G --> H[Listing enters matching candidate pool\non next batch re-match]
    D -->|Reject| I[status = rejected\nrejection_reason required]
    I --> J[Developer notified, can revise]
    J --> A
```

---

## 6. Settlement Accelerator — full state machine (PRD §4.6, FR-10)

```mermaid
stateDiagram-v2
    [*] --> investor_enquiry: Onboarding completed OR consultation requested
    investor_enquiry --> strategy_consultation: Broker/admin confirms consult booked
    strategy_consultation --> finance_assessment: Broker confirms strategy call complete
    finance_assessment --> property_selection: Broker confirms borrowing capacity/pre-approval
    property_selection --> contract_signed: Investor confirms specific listing\n(journey.listing_id set)
    contract_signed --> construction_updates: Contract executed with developer
    construction_updates --> construction_updates: Periodic sub-updates\n(not sub-stages)
    construction_updates --> settlement_preparation: Build nears completion
    settlement_preparation --> handover: Solicitor/lender coordination complete
    handover --> property_management: Keys/handover complete
    property_management --> property_management: Terminal active state\n(not archived/closed)

    note right of contract_signed
        Referral record (status=pending)
        created/updated against the
        investor's linked broker here
        or later, per referrals table.
    end note
    note left of investor_enquiry
        Every transition is an append-only
        settlement_stage_events row —
        actor-attributed, never edited/deleted.
        Corrections are new events with
        is_correction = true.
    end note
```

**Stage-advance authorization** (enforced in `lib/settlement-accelerator/stages.ts` and re-validated by a Postgres trigger, per `ARCHITECTURE.md` §6 / `DATABASE_SCHEMA.md` §8):

| Transition | Allowed actors |
|---|---|
| → Investor Enquiry | Investor (via onboarding/consultation request), admin |
| → Strategy Consultation | Broker, admin |
| → Finance Assessment | Broker, admin |
| → Property Selection | Investor, broker, admin |
| → Contract Signed | Broker, admin |
| → Construction Updates (+ sub-updates) | Developer, admin |
| → Settlement Preparation | Broker, admin |
| → Handover | Broker, admin, developer |
| → Property Management | Admin, developer |

---

## 7. Admin journey — cross-cutting oversight (PRD §4.5)

```mermaid
flowchart TD
    A[Admin logs in, MFA required] --> B[Admin Dashboard]
    B --> C[Approvals queue]
    B --> D[Investors list/search]
    B --> E[Brokers list/search]
    B --> F[Developers list/search]
    B --> G[Analytics:\nsignups, onboarding completion,\nmatches, consultations, listing\nstatus mix, referral pipeline,\nSettlement Accelerator stage mix]
    D --> D1[Reassign broker<->investor link]
    D --> D2[View full investor journey\nread access to all stages]
    E --> E1[Suspend broker account]
    F --> F1[Suspend developer account]
    C --> C1[Approve/reject listing]
    D1 & E1 & F1 & C1 --> H[(audit_log entry\nactor + before/after + reason)]
```

---

## 8. Cross-journey summary (how the four roles intersect)

```mermaid
flowchart LR
    subgraph Investor
        I1[Onboards] --> I2[Matched] --> I3[Books consultation] --> I4[Progresses through\nSettlement Accelerator]
    end
    subgraph Broker
        B1[Shares referral link] --> B2[Client roster grows]
        B2 --> B3[Views client match/journey]
        B3 --> B4[Advances qualifying stages]
    end
    subgraph Developer
        D1[Submits project/listings] --> D2[Awaits admin approval]
        D2 --> D3[Listing published,\nenters matching pool]
        D3 --> D4[Posts construction updates]
    end
    subgraph Admin
        A1[Approves/rejects listings]
        A2[Oversees all journeys]
        A3[Manages all accounts]
    end

    I1 -.->|referral link| B1
    D3 -.->|candidate for| I2
    B4 -.->|stage events| I4
    D4 -.->|stage events| I4
    A1 -.->|gates| D3
    A2 -.->|visibility into| I4
```
