import { Actor, log } from 'apify';
import { CkanClient, downloadResourceRecords } from './ckan.js';
import { fetchWithRetry, parseCsv } from './http.js';

await Actor.init();

const input = {
    // discover.data.vic.gov.au is Victoria's CKAN open-data portal, where the
    // Valuer-General's FREE aggregate sales statistics are published.
    portalBaseUrl: 'https://discover.data.vic.gov.au',
    searchQueries: ['property sales statistics'],
    csvUrls: [],
    maxDatasets: 15,
    maxRecordsPerResource: 50000,
    suburbFilter: [],
    ...(await Actor.getInput()),
};

const ckan = new CkanClient(input.portalBaseUrl);
const suburbNeedles = input.suburbFilter.map((s) => s.toLowerCase().trim()).filter(Boolean);

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

// 1) Direct CSV URLs the user pasted (e.g. a specific VG statistics spreadsheet
//    exported as CSV). Most direct, no portal lookup needed.
for (const url of input.csvUrls) {
    try {
        log.info(`Downloading CSV ${url}`);
        const res = await fetchWithRetry(url, { timeoutMs: 90000 });
        if (!res.ok) { log.warning(`  HTTP ${res.status}`); continue; }
        const rows = parseCsv(await res.text()).slice(0, input.maxRecordsPerResource);
        const n = await emitRows(rows, { source: 'csvUrl', resourceUrl: url });
        log.info(`  ${n} rows kept`);
        total += n;
    } catch (err) {
        log.exception(err, `Failed CSV ${url}`);
    }
}

// 2) Discover published datasets on Victoria's CKAN portal and pull their
//    CSV/JSON/DataStore resources.
for (const query of input.searchQueries) {
    log.info(`Searching ${input.portalBaseUrl} for "${query}"...`);
    let datasets = 0;
    for await (const pkg of ckan.searchPackages(query, { limit: input.maxDatasets })) {
        datasets++;
        for (const resource of pkg.resources ?? []) {
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
    log.warning('No rows extracted. The free VG data is aggregate median statistics (often XLSX). '
        + 'If a dataset only offers XLSX/PDF, export it to CSV and pass the CSV URL via csvUrls.');
}
await Actor.exit();
