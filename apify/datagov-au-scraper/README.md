# data.gov.au (CKAN) Dataset Scraper — Apify Actor

Searches [data.gov.au](https://data.gov.au) — Australia's national open-data
portal, which runs [CKAN](https://ckan.org) — and extracts dataset metadata and,
optionally, the underlying data rows. **Free, open, no credentials, no paywall.**

Because data.gov.au and many state portals (including Victoria's
`discover.data.vic.gov.au`) all run CKAN, you can repoint this actor at any of
them via the `baseUrl` input.

## What it does

1. Runs each `searchQuery` against the CKAN `package_search` API (paged).
2. For each dataset, emits a `type: "dataset"` item — title, organisation,
   licence, tags, and its resources (files/APIs) with their formats and URLs.
3. If `fetchRecords` is on, it also pulls the actual rows:
   - **DataStore-backed resources** → queried via the `datastore_search` API.
   - **Plain CSV/JSON resources** → downloaded and parsed directly.
   - XLSX/PDF/other → left as a URL (not parsed here).
   Each row is emitted as a `type: "record"` item tagged with its dataset and
   resource.

## Input

| Field | Notes |
|---|---|
| `searchQueries` | Free-text searches, e.g. `property sales`, `land zoning`. |
| `datasetIds` | Fetch specific datasets by id/slug (skips search). |
| `baseUrl` | CKAN API root. Default `https://data.gov.au/data`. |
| `maxDatasets` | Cap per query (default 25). |
| `fetchRecords` | Also pull data rows (default off). |
| `maxRecordsPerResource` | Row cap per resource (default 1000). |
| `resourceFormats` | Keep only these formats, e.g. `["CSV","JSON"]`. Empty = all. |

## Deploy

```bash
npm install -g apify-cli && apify login
cd apify/datagov-au-scraper && apify push
```

Or run locally (needs open internet — this build environment blocks data.gov.au):

```bash
cd apify/datagov-au-scraper && npm install
apify run --input '{"searchQueries":["property sales"],"fetchRecords":true,"resourceFormats":["CSV"]}'
```

## Licensing

data.gov.au datasets are individually licensed (mostly CC-BY). Each output
`dataset` item includes its `license` field — check it before redistributing.
