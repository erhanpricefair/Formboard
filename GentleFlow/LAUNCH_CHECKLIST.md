# Gentle Flow — Launch Checklist

Everything standing between the current build and a live App Store listing.
Ordered so the slow items (which involve waiting on other people) start first.

---

## Blockers — the app will be rejected without these

### 1. Get the exercise content reviewed ⚠️ most important

The movements the figure performs were **generated, not choreographed by a
qualified instructor**. They have not been checked by anyone trained in Tai
Chi or in falls prevention.

This matters more than anything else on this list, because the audience is
older adults practising balance work, some of them alone at home.

- [ ] Find a Tai Chi instructor who teaches seniors (council programs, community
      centres, and falls-prevention classes are the obvious places to look)
- [ ] Have them review and correct the poses in `TaiChiSequences.swift`, or
      film them and replace the figure with real video
- [ ] Consider launching with **fewer, verified sessions** rather than the full
      placeholder library — this also helps with guideline 4.2 below
- [ ] Consider launching with the **seated and breathing sessions first**; they
      carry far less risk than standing balance work

### Since this was written: legal/safety scaffolding added

The following are now built and should be reviewed, not re-built:

- **Pre-exercise health screening** in onboarding (`HealthScreeningStepView`,
  `HealthScreeningAnswers`) — a simplified APSS-style check. Anyone whose
  answers suggest a GP or physio chat is defaulted into seated/breathing
  sessions rather than standing balance work. Have someone with an allied
  health background sanity-check the six questions and the wording.
- **Recorded safety acceptance** (`SafetyAcceptance` on `UserProfile`) — the
  disclaimer acceptance now stores a date and a terms version, so there's an
  actual record rather than a boolean. Bump `SafetyTerms.currentVersion` in
  `OnboardingModels.swift` any time the safety copy in `DisclaimerGateView`
  changes meaningfully — this re-prompts everyone for fresh acceptance.
- **In-session safety reminder** (`StandingSafetyReminderView`) — shown before
  any standing work begins, including mid-session via the chair/standing
  toggle. Chair/rail nearby, clear floor, stop if pain or dizziness.
- **Health claims softened** across session descriptions and the Home "why
  this helps" card — causal claims like "prevent falls" and "builds balance
  reflexes" were rewritten to "many people find..." framing. Worth a final
  read-through once real, instructor-verified content replaces the
  placeholder sessions, so the copy matches what's actually being taught.

None of this replaces qualified legal or clinical review — it reduces risk
and creates a paper trail, which is what actually helps if it's ever needed.

### 2. Apple Developer Program

- [ ] Enrol at [developer.apple.com/programs](https://developer.apple.com/programs) — USD $99/year
- [ ] Allow a few days for identity verification
- [ ] Decide individual vs company enrolment (company needs an ABN and a D-U-N-S number)

### 3. Publish the legal pages

Drafts are in `legal/`. They need a real, publicly reachable home.

- [ ] Fill in every `[PLACEHOLDER]` in `legal/privacy-policy.md` and `legal/terms-of-use.md`
- [ ] Remove the developer note at the bottom of the terms
- [ ] Have a solicitor review the safety and liability sections of the terms
- [ ] Publish both pages online (a basic static site is fine)
- [ ] Update `host` in `GentleFlow/Models/AppLinks.swift` to your real domain
- [ ] Check both links open correctly from inside the app

### 4. Set up subscriptions in App Store Connect

- [ ] Create the app record using bundle ID `au.com.gentleflow.app`
- [ ] Complete **Agreements, Tax and Banking** (bank details + W-8BEN tax form)
- [ ] Apply for the **Small Business Program** — drops Apple's commission from
      30% to 15% for anyone under USD $1M/year. Not automatic, you must apply.
- [ ] Create a subscription group, then two subscriptions with IDs matching
      `GentleFlowProducts`:
      - `au.com.gentleflow.premium.monthly`
      - `au.com.gentleflow.premium.annual`
- [ ] Set AUD pricing and write the subscription descriptions
- [ ] Confirm a real purchase works in TestFlight (sandbox), not just the
      local `.storekit` file

---

## Listing materials

- [ ] Screenshots — 6.9" iPhone and 13" iPad are the required sizes; capture
      them from the Simulator with `Cmd + S`
- [ ] App description, subtitle, keywords, support URL
- [ ] Age rating questionnaire
- [ ] Privacy nutrition labels — Gentle Flow collects nothing, so this is
      short, but it must be filled in
- [ ] Category: Health & Fitness

---

## Before you submit

- [ ] Test at the largest accessibility text size — nothing clipped or unreadable
- [ ] Test with VoiceOver on
- [ ] Test with Reduce Motion on
- [ ] Test on a real device, not only the Simulator
- [ ] Confirm "Restore Purchases" works
- [ ] Confirm the app is fully usable **without** subscribing
- [ ] TestFlight with real people from the target audience before the Store

---

## Guidelines to read first

Health and fitness apps get extra scrutiny. Worth reading these three before
submitting rather than after being rejected:

- **1.4.1 Physical Harm** — the reason the content review above matters
- **3.1.2 Subscriptions** — pricing, terms and restore must all be clear
- **4.2 Minimum Functionality** — thin or placeholder content gets rejected

Review usually takes 24–48 hours. A first rejection is normal and is not a
disaster; you fix what they name and resubmit.

---

## After launch

- [ ] Apple pays out monthly, roughly 30–45 days after month end
- [ ] Talk to an accountant about GST once there's actual revenue
- [ ] Watch reviews closely — this audience will tell you plainly what confuses them
- [ ] The developer program fee renews yearly; if it lapses, the app comes down
