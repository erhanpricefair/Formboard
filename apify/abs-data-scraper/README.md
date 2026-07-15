# ABS Data API Scraper — Apify Actor

Pulls statistics from the [Australian Bureau of Statistics Data API](https://api.data.abs.gov.au)
(SDMX) and flattens each observation into a flat dataset row. **Free, open, no
credentials.**

Good for the demographic/dwelling context PropertyConnect needs around a
property or suburb — population, household counts, dwelling types, income, by
region (LGA / SA2 / etc.).

## What it does

1. Requests `GET /data/{dataflow}/{dataKey}` from the ABS Data API for the
   dataflow and data key you specify.
2. Asks for **CSV with labels** first (one row per observation, human-readable
   dimension names) and falls back to **SDMX-JSON**, which it flattens itself
   (mapping each series' dimension indices back to labels).
3. Emits one dataset item per observation: the dimension labels (region,
   measure, sex, …), the `period`, the `value`, and any observation attributes.

## Finding a dataflow and data key

- Browse dataflows: <https://api.data.abs.gov.au/dataflow>
- Build a data key visually in the **ABS Data Explorer**:
  <https://explore.data.abs.gov.au> — pick a table, select the dimensions you
  want, and it shows the API URL. Copy the `dataflowId` and `dataKey` from it.

Example: dataflow `ABS_REGIONAL_ASGS2016`, key `all`, `startPeriod` 2016.

## Input

| Field | Notes |
|---|---|
| `dataflowId` | e.g. `ABS_REGIONAL_ASGS2016`, `C21_G01_LGA`. **Required.** |
| `dataKey` | Dot-separated positional dimension selector, or `all`. |
| `startPeriod` / `endPeriod` | e.g. `2016`, `2021`. Blank = all. |
| `detail` | `full` / `dataonly` / `serieskeysonly` / `nodata`. |
| `agencyId` | Almost always `ABS`. |
| `version` | Optional explicit dataflow version. |

## Deploy

```bash
npm install -g apify-cli && apify login
cd apify/abs-data-scraper && apify push
```

Local (needs open internet — this build environment blocks api.data.abs.gov.au):

```bash
cd apify/abs-data-scraper && npm install
apify run --input '{"dataflowId":"ABS_REGIONAL_ASGS2016","dataKey":"all","startPeriod":"2021"}'
```

## Licence

ABS data is published under CC-BY 4.0 — attribute the ABS when you use it.
