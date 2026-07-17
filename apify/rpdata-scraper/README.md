# RP Data (CoreLogic) Property Scraper — Apify Actor

An [Apify](https://apify.com) actor that logs into **RP Data Professional**
(`rpp.corelogic.com.au`) with **your own subscription credentials**, searches the
addresses or suburbs you give it, and writes property details, attributes, sales
history and valuation estimates to an Apify dataset.

> **Use responsibly.** RP Data is a paid, licensed product. This actor automates
> *your* account and only sees data your subscription already entitles you to.
> Automated access and redistribution of CoreLogic data are governed by your
> RP Data licence agreement — review it before running this at scale, and keep
> request pacing conservative (the actor paces itself by default).

## How it works

1. **Login** — opens the CoreLogic SSO screen and signs in with the credentials
   from the actor input. Cookies are persisted to the key-value store
   (`RPDATA-SESSION-STATE`) so subsequent runs reuse the session instead of
   re-authenticating (RP Data allows only one active session per account; the
   actor also handles the "session takeover" prompt).
2. **Search** — types each query into the RPP omnibar and opens the top
   autosuggest hit. A full address lands directly on a property page; a suburb
   query lands on a results list, from which up to `maxResultsPerQuery`
   properties are visited (pagination included).
3. **Extract** — scrapes each property page's DOM (address, type,
   beds/baths/cars, land size, last sale, estimate, sales/rental history) **and**
   captures the raw JSON the RPP frontend fetches from its internal API
   (`captureApiResponses`, on by default). The API payloads are attached under
   the `api` key of each dataset item and are the richest, most stable source —
   prefer them downstream.
4. **Output** — one dataset item per property. Failures save a full-page
   screenshot + HTML snapshot (`DEBUG-*` keys in the key-value store).

## Deploying to Apify

```bash
npm install -g apify-cli
apify login                      # paste your Apify API token

cd apify/rpdata-scraper
apify push                       # builds the Docker image and creates the actor
```

Then in the Apify Console, open the actor → **Input**, fill in:

| Input | Notes |
|---|---|
| `username` / `password` | Your RP Data Professional credentials. The password field is encrypted (`isSecret`). |
| `searchQueries` | One address or suburb per line. |
| `maxResultsPerQuery` | Cap for suburb-level searches (default 25). |
| `proxyConfiguration` | Defaults to **Apify residential proxies, AU country**. Strongly recommended — CoreLogic geo-blocks foreign/datacenter IPs. Residential proxy usage is billed by Apify. |
| `includeSalesHistory` / `includeRentalHistory` | History tables per property. |
| `captureApiResponses` | Attach raw RPP API JSON to each item (recommended). |
| `reuseSession` | Reuse cookies across runs to avoid repeated logins. |
| `debugScreenshots` | Save snapshots on failure. |

Run it, then export the dataset as JSON/CSV/Excel from the **Storage** tab, or
pull it via the Apify API for integration (e.g. into PropertyConnect ingestion).

### Running locally

```bash
cd apify/rpdata-scraper
npm install
npx playwright install chromium        # once
apify run --input '{"username":"you@example.com","password":"...","searchQueries":["Richmond VIC 3121"]}'
```

## Scheduling

In the Apify Console: actor → **Schedules** → e.g. `@daily`. Keep `reuseSession`
on so scheduled runs don't churn logins.

## Output item shape

```jsonc
{
  "searchQuery": "10 Smith Street, Richmond VIC 3121",
  "url": "https://rpp.corelogic.com.au/property/...",
  "address": "10 Smith Street, Richmond VIC 3121",
  "propertyType": "House",
  "bedrooms": 3,
  "bathrooms": 2,
  "carSpaces": 1,
  "landSize": "230 m²",
  "lastSalePrice": "$1,250,000",
  "lastSaleDate": "12 Mar 2024",
  "valuationEstimate": "...",
  "salesHistory": [["12 Mar 2024", "$1,250,000", "Sold"], ...],
  "api": { "propertyDetails": [...], "salesHistory": [...], ... },
  "scrapedAt": "2026-07-15T00:00:00.000Z"
}
```

## When CoreLogic changes their UI

All selectors live in **`src/selectors.js`** — each is an ordered list of
candidates, first visible match wins. If a run fails:

1. Open the `DEBUG-*.png` / `.html` snapshots in the run's key-value store.
2. Find the element in the HTML snapshot and add/adjust a candidate selector.
3. `apify push` again.

The API capture patterns (`API_CAPTURE_PATTERNS`) work the same way — they are
URL substrings matched against the frontend's XHR traffic.

## Known limitations

- **MFA / CAPTCHA**: if your CoreLogic account has MFA enabled or the login is
  challenged with a CAPTCHA, the actor fails with a `login-failed` snapshot.
  Options: disable MFA for a dedicated service account, or log in manually once
  and seed `RPDATA-SESSION-STATE` in the key-value store with exported cookies.
- **Single session**: RP Data enforces one active session per account. Don't run
  this actor concurrently with a human using the same login — whoever logs in
  second kicks the other out.
- **Selectors need first-run validation**: CoreLogic's app is behind a paywall,
  so the selector candidates in `src/selectors.js` are best-effort and should be
  verified on your first run using the debug snapshots.
