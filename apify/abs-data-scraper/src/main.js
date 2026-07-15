import { Actor, log } from 'apify';
import { fetchWithRetry, parseCsv } from './http.js';
import { flattenSdmxJson } from './sdmx.js';

await Actor.init();

const input = {
    dataflowId: '',
    dataKey: 'all',
    startPeriod: '',
    endPeriod: '',
    detail: 'full',
    agencyId: 'ABS',
    version: '',
    ...(await Actor.getInput()),
};

if (!input.dataflowId) {
    throw new Error('dataflowId is required, e.g. "ABS_REGIONAL_ASGS2016" or "C21_G01_LGA". '
        + 'Browse dataflows at https://api.data.abs.gov.au/dataflow or the ABS Data Explorer.');
}

const BASE = 'https://api.data.abs.gov.au';

// SDMX flow reference: {agency},{flow},{version}. ABS accepts a bare flow id too,
// but the fully-qualified form is unambiguous.
const flowRef = input.version
    ? `${input.agencyId},${input.dataflowId},${input.version}`
    : input.dataflowId;

const params = new URLSearchParams();
if (input.startPeriod) params.set('startPeriod', input.startPeriod);
if (input.endPeriod) params.set('endPeriod', input.endPeriod);
if (input.detail) params.set('detail', input.detail);

/**
 * ABS Data API supports content negotiation. CSV ("csvfilewithlabels") is by far
 * the easiest to flatten reliably — one row per observation with human-readable
 * dimension labels — so we ask for it first and fall back to SDMX-JSON.
 */
async function fetchData() {
    const dataUrl = `${BASE}/data/${encodeURIComponent(flowRef)}/${encodeURIComponent(input.dataKey)}?${params}`;
    log.info(`Requesting ${dataUrl}`);

    const csvRes = await fetchWithRetry(dataUrl, {
        timeoutMs: 90000,
        headers: { Accept: 'application/vnd.sdmx.data+csv; labels=both' },
    });
    if (csvRes.ok) {
        const text = await csvRes.text();
        if (text.trim() && text.includes(',')) {
            return { format: 'csv', rows: parseCsv(text) };
        }
    } else {
        log.warning(`CSV request returned HTTP ${csvRes.status}; falling back to SDMX-JSON`);
    }

    const jsonRes = await fetchWithRetry(dataUrl, {
        timeoutMs: 90000,
        headers: { Accept: 'application/vnd.sdmx.data+json' },
    });
    if (!jsonRes.ok) throw new Error(`ABS data request failed: HTTP ${jsonRes.status}`);
    return { format: 'json', body: await jsonRes.json() };
}

const result = await fetchData();
let rows;
if (result.format === 'csv') {
    rows = result.rows;
    log.info(`Parsed ${rows.length} observations from CSV`);
} else {
    rows = flattenSdmxJson(result.body);
    log.info(`Flattened ${rows.length} observations from SDMX-JSON`);
}

if (!rows.length) {
    await Actor.setStatusMessage('No observations returned — check dataflowId/dataKey.');
    log.warning('No observations returned. Verify the dataflow id and data key against the ABS Data Explorer.');
} else {
    await Actor.pushData(rows.map((row) => ({
        dataflowId: input.dataflowId,
        ...row,
        scrapedAt: new Date().toISOString(),
    })));
}

const summary = `Fetched ${rows.length} observations from ABS dataflow ${input.dataflowId}`;
log.info(summary);
await Actor.setStatusMessage(summary);
await Actor.exit();
