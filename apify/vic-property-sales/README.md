# Victorian Property Sales (Valuer-General, free) Scraper — Apify Actor

Extracts the **free aggregate property-sales statistics** that Victoria's
Valuer-General publishes on [data.vic.gov.au](https://discover.data.vic.gov.au)
— median prices by suburb/locality and period — plus any CSV export you point it
at. **Free, open, no credentials, no paywall.**

> **What this is (and isn't).** The free VG data is *aggregate statistics*
> (e.g. median house/unit price by suburb, by quarter/year). The
> *per-transaction* "Property Sales Data" (individual addresses + sale prices)
> is a **paid** VG product — this actor does not and cannot get that for free.
> For the launch (Melbourne) market, the free medians are still very useful for
> suburb-level pricing context.

## What it does

1. **Direct file URLs** (`fileUrls`) — downloads and parses any CSV or
   XLSX/XLS you paste (e.g. a VG statistics spreadsheet). Most reliable path.
2. **CKAN search** — searches `discover.data.vic.gov.au` for the VG sales-stats
   datasets and pulls their CSV/JSON/Excel/DataStore resources.
3. **Suburb filter** — optionally keep only rows mentioning given suburbs.
4. Emits one dataset item per row, tagged with its source dataset/resource and
   licence.

## Input

| Field | Notes |
|---|---|
| `searchQueries` | CKAN searches; defaults target VG sales statistics. |
| `fileUrls` | Direct CSV/Excel links to a specific published spreadsheet. |
| `suburbFilter` | Keep only rows mentioning these suburbs. Empty = all. |
| `portalBaseUrl` | Victoria's CKAN portal (default set). |
| `maxDatasets` / `maxRecordsPerResource` | Caps. |

## Deploy

```bash
npm install -g apify-cli && apify login
cd apify/vic-property-sales && apify push
```

Local (needs open internet — this build environment blocks data.vic.gov.au):

```bash
cd apify/vic-property-sales && npm install
apify run --input '{"searchQueries":["property sales statistics"],"suburbFilter":["Richmond"]}'
```

## XLSX

Much of the VG statistics is published as **XLSX**. This actor parses XLSX/XLS
resources automatically (via SheetJS/`xlsx`), including sheets that carry
title/preamble rows above the real table — it detects the header row
heuristically. Pass a direct spreadsheet link via `fileUrls`, or let CKAN search
find it.

## Other states

Sibling actors cover the other states, same code repointed at their portals:
`nsw-property-sales`, `qld-property-sales`, `sa-property-sales`. For anywhere
else, point this actor's `portalBaseUrl` at that portal's CKAN root, or use the
generic `datagov-au-scraper` actor.

## Licence

data.vic.gov.au datasets are individually licensed (mostly CC-BY 4.0). Each item
carries its `license` — check before redistributing.
