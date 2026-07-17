import { Actor, log } from 'apify';
import { CkanClient, downloadResourceRecords } from './ckan.js';
import { fetchWithRetry, parseCsv } from './http.js';
import { parseXlsxBuffer } from './xlsx.js';

await Actor.init();

const input = {
    // https://www.data.qld.gov.au is Queensland's CKAN open-data portal. What property data is
    // published as open data varies by state; queries below are generic.
    portalBaseUrl: 'https://www.data.qld.gov.au',
    searchQueries: ['property sales'],
    fileUrls: [],
    maxDatasets: 15,
    maxRecordsPerResource: 50000,
    suburbFilter: [],
    ...(await Actor.getInput()),
};

const ckan = new CkanClient(input.portalBaseUrl);
const suburbNeedles = input.suburbFilter.map((s) => s.toLowerCase().trim()).filter(Boolean);

// Apify kills the run hard at its configured timeout — a slow-but-not-dead
// host can otherwise burn the whole budget on one resource and lose whatever
// was already extracted. Stop opening new resources once we're within a
// safety margin of that deadline (bigger than one resource's worst case:
// ~1 fetch timeout + retries + backoff) so the run exits cleanly instead.
const timeoutAt = Actor.getEnv().timeoutAt;
const SAFETY_MARGIN_MS = 60_000;
function timeRunningOut() {
    return timeoutAt != null && Date.now() > timeoutAt.getTime() - SAFETY_MARGIN_MS;
}

/** Keep a row only if some field mentions one of the requested suburbs. */
function matchesSuburb(row) {
    if (!suburbNeedles.length) return true;
    const hay = Object.values(row).join(' ').toLowerCase();
    return suburbNeedles.some((needle) => hay.includes(needle));
}

async function emitRows(rows, meta) {
    const filtered = rows.filter(matchesSuburb);
    if (!filtered.length) return 0;
    await Actor.pushData(filtered.map((row) => ({
        ...meta,
        row,
        scrapedAt: new Date().toISOString(),
    })));
    return filtered.length;
}

let total = 0;

// 1) Direct file URLs the user pasted (a specific VG statistics spreadsheet as
//    CSV or Excel). Most direct, no portal lookup needed.
for (const url of input.fileUrls) {
    if (timeRunningOut()) {
        log.warning(`Approaching run timeout — skipping remaining fileUrls (from "${url}" onward).`);
        break;
    }
    try {
        const isExcel = /\.xlsx?(\?|$)/i.test(url);
        log.info(`Downloading ${isExcel ? 'Excel' : 'CSV'} ${url}`);
        const res = await fetchWithRetry(url, { timeoutMs: 90000 });
        if (!res.ok) { log.warning(`  HTTP ${res.status}`); continue; }
        const rows = (isExcel
            ? parseXlsxBuffer(Buffer.from(await res.arrayBuffer()))
            : parseCsv(await res.text())
        ).slice(0, input.maxRecordsPerResource);
        const n = await emitRows(rows, { source: 'fileUrl', resourceUrl: url });
        log.info(`  ${n} rows kept`);
        total += n;
    } catch (err) {
        log.exception(err, `Failed to download ${url}`);
    }
}

// 2) Discover published datasets on Queensland's CKAN portal and pull their
//    CSV/JSON/DataStore resources.
//    Different search queries often surface the same dataset — a
//    resource-id set keeps us from downloading it twice.
const processedResourceIds = new Set();
queries: for (const query of input.searchQueries) {
    if (timeRunningOut()) {
        log.warning(`Approaching run timeout — skipping remaining search queries (from "${query}" onward).`);
        break;
    }
    log.info(`Searching ${input.portalBaseUrl} for "${query}"...`);
    let datasets = 0;
    for await (const pkg of ckan.searchPackages(query, { limit: input.maxDatasets })) {
        datasets++;
        for (const resource of pkg.resources ?? []) {
            if (timeRunningOut()) {
                log.warning('Approaching run timeout — stopping early and keeping what was already extracted.');
                break queries;
            }
            const resourceKey = resource.id ?? resource.url;
            if (resourceKey && processedResourceIds.has(resourceKey)) continue;
            if (resourceKey) processedResourceIds.add(resourceKey);
            let rows = [];
            if (resource.datastore_active) {
                for await (const rec of ckan.datastoreRecords(resource.id, { limit: input.maxRecordsPerResource })) {
                    rows.push(rec);
                }
            } else {
                rows = await downloadResourceRecords(resource, { maxRecords: input.maxRecordsPerResource });
            }
            if (!rows.length) continue;
            const n = await emitRows(rows, {
                source: 'ckan',
                datasetTitle: pkg.title,
                datasetName: pkg.name,
                resourceName: resource.name,
                resourceFormat: resource.format,
                resourceUrl: resource.url,
                license: pkg.license_title ?? pkg.license_id ?? null,
            });
            if (n) log.info(`  "${pkg.title}" / "${resource.name}": ${n} rows`);
            total += n;
        }
    }
    if (!datasets) log.warning(`No datasets matched "${query}" on ${input.portalBaseUrl}`);
}

const summary = `Extracted ${total} property-sales rows`
    + (suburbNeedles.length ? ` (filtered to: ${input.suburbFilter.join(', ')})` : '');
log.info(summary);
await Actor.setStatusMessage(summary);

if (total === 0) {
    log.warning('No rows extracted. The free VG data is aggregate median statistics. '
        + 'CSV and Excel resources are parsed automatically; if a dataset only offers PDF, '
        + 'there is no structured data to extract. You can also pass a direct file URL via fileUrls.');
}
await Actor.exit();
