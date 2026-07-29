# Makeup by Aphrodite — one-page website

**Live at: https://makeupbyaphrodite.netlify.app**
Hosted on Netlify (free tier), deployed by dragging the `site` folder onto Netlify Drop.
To update: drag the folder onto the **Deploys** tab of the Netlify project — not `/drop`, which would create a second site.

A single self-contained `index.html`. No build step, no dependencies, no framework. Open it in a browser to preview.

---

## Before it goes live — fill these in

Search `index.html` for square brackets and replace each one:

| Placeholder | Where it appears |
|---|---|
| `[DATE]` | Booking section — next class date |
| `[VENUE NAME]` / `[SUBURB]` / `[STATE]` | Booking section and footer |
| `[YOUR BOOKING LINK]` | The main "Book your seat" button |
| `[PHONE]` | Booking section and footer |
| `[EMAIL]` | Footer |

Also check: the Instagram handle is set to `@makeupbyaphrodite` in three places — update if the real handle differs.

---

## Images

Create an `images/` folder next to `index.html` and add these files. Until they exist, striped placeholder blocks show where each one goes, labelled with its filename.

| File | What it should be | Suggested source |
|---|---|---|
| `hero.jpg` | Portrait in soft natural makeup, subject low in frame | **Shoot fresh** — an everyday look, not bridal |
| `kit.jpg` | Kit or product close-up | The cream/powder palette photograph |
| `work-1.jpg` | Portfolio | Bridal veil, colour |
| `work-2.jpg` | Portfolio | Bridal veil, black & white |
| `work-3.jpg` | Portfolio | Palette close-up |
| `work-4.jpg` | Portfolio | A new everyday-look shot |
| `about.jpg` | Aphrodite, ideally working | Shoot fresh |

**Sizing:** hero around 1600×2000px, the rest around 1200×1500px. Compress before uploading — [squoosh.app](https://squoosh.app) is free and will cut file sizes by 70% with no visible loss. A slow-loading site costs bookings.

**Note on the hero:** the strongest available photograph is the bridal veil shot, but leading with bridal signals "glamour" to a beginner who is already unsure she belongs. Shoot an everyday look for the hero and keep bridal in the "My Work" strip, where it does its job as a credential.

---

## Hosting

Any of these work, and all are free:

| Option | Cost | Notes |
|---|---|---|
| **Netlify Drop** | Free | Drag the folder onto [app.netlify.com/drop](https://app.netlify.com/drop). Live in about 30 seconds. Easiest by a distance. |
| **Cloudflare Pages** | Free | Similar, slightly more setup, very fast hosting |
| **GitHub Pages** | Free | Free, but assumes some git familiarity |
| **Squarespace / Wix** | $15–25/mo | Only worth it if you want to edit it yourself without touching HTML |

**Domain:** `makeupbyaphrodite.com.au` or `.com`, roughly $15–20/year through Namecheap or Cloudflare. Worth buying even before the site launches, so nobody else takes it.

---

## What's on the page

Nav (sticky) → Hero → What you'll learn (6 items) → What's included → Who it's for (4 cards) → My Work → Pricing (4 tiers) → About → FAQ (8 questions) → Booking → Footer

**Design notes:**
- Brand palette and fonts are declared as CSS variables at the top of the file — change them in one place and the whole page follows
- Fully responsive; the layout collapses to a single column below 860px
- The FAQ uses native `<details>` elements, so it works with no JavaScript
- Open Graph tags are set, so the link previews properly when shared to Instagram, Facebook or WhatsApp
- Every "Book" button anchors to the booking section, which holds the single external booking link — so there's one place to update when the class date changes

---

## After launch

- [ ] Add the site link to the Instagram bio
- [ ] Submit to Google Business Profile so it appears in local search
- [ ] Add a Google Analytics or Plausible snippet if you want visitor numbers
- [ ] Update `[DATE]` every time a class sells out — an out-of-date "next class" is worse than none
- [ ] Swap the placeholder photography for real class photos once the first class has run
