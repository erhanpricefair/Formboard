# Queensland Property Data (open data) Scraper — Apify Actor

Extracts free property/land datasets that **Queensland** publishes on its
[CKAN open-data portal](https://www.data.qld.gov.au), plus any CSV or Excel file you point it
at. **Free, open, no credentials, no paywall.**

This is a sibling of the `vic-property-sales` actor, repointed at Queensland.

> **What open property data exists varies by state.** Not every state publishes
> Valuer-General median-price statistics as open data the way Victoria does.
> This actor searches the Queensland portal with generic property queries; review
> the datasets it returns to see what's actually available. Where a state only
> exposes data behind its own paid land-titles service, that is not free and this
> actor cannot retrieve it.

## What it does

1. **Direct file URLs** (`fileUrls`) — downloads and parses any CSV or XLSX/XLS
   you paste. Most reliable for a specific published spreadsheet.
2. **CKAN search** — searches www.data.qld.gov.au for the datasets your queries match and
   pulls their CSV/JSON/Excel/DataStore resources.
3. **Suburb filter** — optionally keep only rows mentioning given localities.
4. Emits one dataset item per row, tagged with source dataset/resource + licence.

## Input

| Field | Notes |
|---|---|
| `searchQueries` | CKAN searches. Default: generic property queries. |
| `fileUrls` | Direct CSV/Excel links. |
| `suburbFilter` | Keep only rows mentioning these localities (e.g. `South Brisbane`). |
| `portalBaseUrl` | Queensland's CKAN portal (default `https://www.data.qld.gov.au`). |
| `maxDatasets` / `maxRecordsPerResource` | Caps. |

> **Verify the portal URL on first run.** The CKAN API root is preset to
> `https://www.data.qld.gov.au` but state portals occasionally move; if search returns nothing,
> confirm the API root (`<portal>/api/3/action/package_search`) and adjust
> `portalBaseUrl`.

## Deploy

```bash
npm install -g apify-cli && apify login
cd apify/qld-property-sales && apify push
```

Local (needs open internet — this build environment blocks www.data.qld.gov.au):

```bash
cd apify/qld-property-sales && npm install
apify run --input '{"searchQueries":["property sales"],"suburbFilter":["South Brisbane"]}'
```

## Licence

Portal datasets are individually licensed (mostly CC-BY). Each output item
carries its `license` — check before redistributing.
