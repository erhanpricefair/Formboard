import { log } from 'apify';
import { fetchJson, fetchWithRetry, parseCsv } from './http.js';

/**
 * Thin client for a CKAN Action API (https://docs.ckan.org/en/latest/api/).
 * data.gov.au and data.vic.gov.au both run CKAN, so the same client serves
 * both — only the base URL changes.
 */
export class CkanClient {
    constructor(baseUrl) {
        this.base = baseUrl.replace(/\/$/, '');
    }

    async action(name, params = {}) {
        const qs = new URLSearchParams(
            Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]),
        ).toString();
        const url = `${this.base}/api/3/action/${name}${qs ? `?${qs}` : ''}`;
        const body = await fetchJson(url);
        if (!body?.success) throw new Error(`CKAN ${name} failed: ${JSON.stringify(body?.error ?? body)}`);
        return body.result;
    }

    /** Paged package_search; yields datasets up to `limit`. */
    async *searchPackages(query, { limit = 50, fq } = {}) {
        let start = 0;
        const pageSize = Math.min(limit, 50);
        while (start < limit) {
            const result = await this.action('package_search', {
                q: query, fq, rows: Math.min(pageSize, limit - start), start,
            });
            const results = result.results ?? [];
            for (const pkg of results) yield pkg;
            start += results.length;
            if (!results.length || start >= (result.count ?? 0)) break;
        }
    }

    showPackage(id) {
        return this.action('package_show', { id });
    }

    /** Pull rows from a DataStore-enabled resource (structured, queryable). */
    async *datastoreRecords(resourceId, { limit = 1000 } = {}) {
        let offset = 0;
        const pageSize = 1000;
        while (offset < limit) {
            const result = await this.action('datastore_search', {
                resource_id: resourceId, limit: Math.min(pageSize, limit - offset), offset,
            });
            const records = result.records ?? [];
            for (const rec of records) yield rec;
            offset += records.length;
            if (records.length < Math.min(pageSize, limit - offset + records.length)) break;
            if (offset >= (result.total ?? 0)) break;
        }
    }
}

/**
 * Best-effort extraction of rows from a resource that is NOT in the DataStore:
 * download a CSV/JSON resource directly and parse it. Returns [] for formats we
 * don't parse here (XLSX/PDF/etc.) — those are left as a downloadable URL.
 */
export async function downloadResourceRecords(resource, { maxRecords = 5000, timeoutMs = 60000 } = {}) {
    const format = (resource.format ?? '').toLowerCase();
    if (!resource.url) return [];
    try {
        if (format === 'csv' || resource.url.toLowerCase().endsWith('.csv')) {
            const res = await fetchWithRetry(resource.url, { timeoutMs });
            if (!res.ok) return [];
            const rows = parseCsv(await res.text());
            return rows.slice(0, maxRecords);
        }
        if (format === 'json' || resource.url.toLowerCase().endsWith('.json')) {
            const data = await fetchJson(resource.url, { timeoutMs });
            const arr = Array.isArray(data) ? data : (Array.isArray(data?.records) ? data.records : []);
            return arr.slice(0, maxRecords);
        }
    } catch (err) {
        log.warning(`Could not download resource ${resource.id ?? resource.url}: ${err.message}`);
    }
    return [];
}
