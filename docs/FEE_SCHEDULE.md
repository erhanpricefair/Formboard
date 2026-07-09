# PropertyConnect — Referral Fee Schedule

**Status:** Draft v1.0 (business decision, not yet legally reviewed)
**Owner:** CTO/Product, pending legal sign-off on the underlying `ReferralAgreement` contract language
**Companion to:** `prisma/schema.prisma` (`ReferralAgreement`, `Transaction`), `prisma/seed.ts`, `docs/DATABASE.md` §9

This resolves the open item flagged in `docs/DATABASE.md` §13: *"Referral fee calculation logic... is a service-layer concern, not modeled further here."* It defines the actual numbers and the resolution logic `lib/services/fee-service.ts` implements against them.

---

## 1. The default schedule

Flat fee, payable by the partner once the linked `Transaction` reaches `SETTLED` (or the type-appropriate terminal state — see §4). All amounts **GST-exclusive**; `Invoice.tax` adds 10% GST on top at billing time, consistent with the existing `Invoice.subtotal`/`tax`/`total` split.

| `LeadType` | Fee (AUD, ex GST) | Triggering `Transaction.type` / terminal status |
|---|---:|---|
| `SELL` | **$1,500** | `SALE`, `SETTLED` |
| `BUY` | **$1,500** | `PURCHASE`, `SETTLED` |
| `FINANCE` | **$600** | `LOAN`, `SETTLED` (loan drawdown) |
| `CONVEYANCING` | **$200** | `CONVEYANCING_COMPLETED`, `SETTLED` |
| `INSPECTION` | **$100** | `INSPECTION_COMPLETED`, `SETTLED` |
| `PROPERTY_MANAGEMENT` | **$250** | `MANAGEMENT_AGREEMENT`, `SETTLED` (agreement signed) |

### Why these numbers

- **`SELL`/`BUY` at $1,500** — the given anchor. A typical Melbourne agent commission runs roughly $12,000–17,000 on a median sale; $1,500 sits around 10% of that, which is the low end of what established AU real estate referral networks charge (most run 10–20% of commission). `BUY` is set equal to `SELL` rather than lower, since the underlying commission economics are the same transaction viewed from the other side, and the instruction was "sellers or buyers."
- **`FINANCE` at $600** — mortgage broker upfront commission is typically ~0.65% of loan value (≈$3,250 on a $500k loan), plus ongoing trail commission the platform has no claim on. $600 is roughly 18% of the upfront figure — meaningfully scaled back from `SELL`/`BUY` because a broker's per-file revenue is smaller and more variable, but still generous given finance leads tend to be high-intent and fast-converting (contract finance clauses create urgency).
- **`CONVEYANCING` at $200`** — a conveyancer's entire job in Melbourne is only worth ~$800–1,500. A fee anywhere near `SELL`'s $1,500 would exceed the partner's own revenue on the job. $200 (~15–20% of job value) keeps it proportionate.
- **`INSPECTION` at $100** — inspection jobs are the platform's fastest, lowest-friction, highest-volume service, worth ~$300–600 each. $100 (~20%) is proportionate and keeps inspector margins healthy enough that they keep accepting leads.
- **`PROPERTY_MANAGEMENT` at $250** — a one-off placement fee. The property manager's real payoff is the ongoing management commission (~8% of weekly rent, recurring for years), so a modest one-off fee is still a good deal for them relative to lifetime value. **Provisional** — flagged in `docs/DATABASE.md` §4/§13 as needing a proper `PropertyManager` partner extension and dedicated matching before this lead type goes live for real; the fee number can move once real property-manager economics are confirmed.

### Explicitly not done (yet)

- **No percentage-based fee for `FINANCE`.** Loan sizes vary far more than sale prices in relative terms (a $150k refinance vs. a $2M investment loan), so a flat $600 either overcharges on small loans or undercharges on large ones. `FeeType.PERCENTAGE`/`TIERED` already exist in the schema for this — deliberately not used yet because there's no volume data to set a sensible rate/tier boundaries. Revisit once enough `FINANCE` transactions have settled to see the loan-size distribution.
- **No tiering by property value for `SELL`/`BUY`.** A flat fee is simpler to explain to agents and avoids the platform's incentives shifting toward high-value listings at the expense of matching everyone well. Reconsider only if agent feedback or unit economics data says otherwise.

---

## 2. Where this lives in the data model

`ReferralAgreement.partnerId` is now **nullable** (schema change alongside this doc): `partnerId = null` represents the platform default for a `leadType`; a non-null `partnerId` represents a partner-specific negotiated override (e.g. a high-volume agency negotiates a different rate). This is the standard "specific overrides general" pattern rather than duplicating the default onto every partner row.

`prisma/seed.ts` creates the six default rows above as `ReferralAgreement { partnerId: null, feeType: FLAT, flatAmount, active: true }` on every environment setup — the platform should never be missing a default for a `LeadType` that's actually live.

---

## 3. Resolution order (`fee-service.ts`)

When a `Transaction` reaches a terminal state and needs `referralFeeOwed` computed:

```
resolveAgreement(partnerId, leadType, asOfDate):
  1. partner-specific: ReferralAgreement
       WHERE partnerId = :partnerId AND leadType = :leadType AND active = true
         AND effectiveFrom <= asOfDate
         AND (effectiveTo IS NULL OR effectiveTo >= asOfDate)
       ORDER BY effectiveFrom DESC LIMIT 1
  2. if none: platform default: ReferralAgreement
       WHERE partnerId IS NULL AND leadType = :leadType AND active = true
         AND effectiveFrom <= asOfDate AND (effectiveTo IS NULL OR effectiveTo >= asOfDate)
       ORDER BY effectiveFrom DESC LIMIT 1
  3. if still none: this is a configuration error, not a business outcome —
     alert admin (AdminActionLog-visible), do NOT silently charge $0.
```

`asOfDate` is the date the `LeadAssignment` was **accepted** by the partner, not the date the `Transaction` later settles. Rationale: a partner should be charged the rate that was in effect when they took on the lead, not whatever rate happens to be current months later when it finally settles — otherwise a mid-year fee increase would retroactively apply to deals already in flight, which is the kind of thing that (rightly) generates disputes.

`Transaction.referralFeeOwed` is computed once, at the point the transaction reaches its terminal `SETTLED` status, and stored — not recomputed live — so it survives the agreement itself changing later (same reasoning as `docs/DATABASE.md` §9).

For `FLAT` fee type: `referralFeeOwed = flatAmount`. `PERCENTAGE`/`TIERED` calculation logic is unimplemented (no lead type uses them yet) — build when `FINANCE` moves off flat-fee (see §1).

---

## 4. Terminal-state and fall-through handling

- A fee is only created (`ReferralFee`/`Transaction.referralFeeOwed`, per `docs/DATABASE.md` §9) once `Transaction.status` reaches `SETTLED`. `UNCONDITIONAL` is not sufficient — as already flagged in the CTO-level risk analysis, deals can still fall over between unconditional and settlement (finance declines, contract collapses).
- If a `Transaction` moves to `FELL_THROUGH` after a fee was already invoiced, the existing `Invoice`/`Payment` records are not deleted — void the relevant `InvoiceLineItem` and issue a corrected invoice, preserving the audit trail (consistent with the platform's append-only posture elsewhere).

---

## 5. Review cadence

This schedule is a starting point, not a permanent contract. Revisit after the first meaningful batch of settled transactions per lead type (recommend: after the first ~20 settlements per type, or quarterly, whichever comes first) — real conversion and dispute data will say more than the market-rate estimates used here. Any change to the default schedule should be added as a **new** `ReferralAgreement` row with `effectiveFrom` set going forward (per §3, existing in-flight leads keep the old rate) rather than editing the existing row in place, preserving history for any later dispute.
