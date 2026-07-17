import { log } from 'apify';

// Some government hosts reject requests that don't look like a browser
// (bare Node fetch has no User-Agent by default). A realistic one avoids
// spurious connection failures against those hosts.
const DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (compatible; PropertyConnectBot/1.0; +https://propertyconnect.example)',
};

/**
 * fetch() with a timeout and bounded exponential-backoff retries. Retries on
 * network errors and 429/5xx; returns the Response otherwise (including 4xx,
 * which the caller inspects). Node 20+ provides global fetch.
 *
 * Defaults are tuned for fast-failing on a stuck/slow host: worst case is
 * ~timeoutMs * (retries + 1) plus backoff, so keep timeoutMs and retries low
 * for third-party file downloads where one bad host shouldn't stall a whole
 * run (Apify actor runs have a fixed wall-clock budget).
 */
export async function fetchWithRetry(url, { timeoutMs = 30000, retries = 2, headers = {} } = {}) {
    let attempt = 0;
    for (;;) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const res = await fetch(url, { headers: { ...DEFAULT_HEADERS, ...headers }, signal: controller.signal });
            if (res.status === 429 || res.status >= 500) {
                throw new Error(`HTTP ${res.status}`);
            }
            return res;
        } catch (err) {
            if (attempt >= retries) throw err;
            const waitMs = 2 ** attempt * 1000 + Math.floor(Math.random() * 500);
            log.warning(`Request to ${url} failed (${err.message}); retrying in ${waitMs}ms`);
            await new Promise((r) => setTimeout(r, waitMs));
            attempt++;
        } finally {
            clearTimeout(timer);
        }
    }
}

export async function fetchJson(url, opts = {}) {
    const res = await fetchWithRetry(url, {
        ...opts,
        headers: { Accept: 'application/json', ...(opts.headers ?? {}) },
    });
    if (!res.ok) throw new Error(`GET ${url} -> HTTP ${res.status}`);
    return res.json();
}

/**
 * Minimal RFC-4180-ish CSV parser: handles quoted fields, escaped quotes and
 * embedded newlines. Returns an array of row objects keyed by the header row.
 */
export function parseCsv(text) {
    const rows = [];
    let field = '';
    let record = [];
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (inQuotes) {
            if (c === '"') {
                if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
            } else field += c;
        } else if (c === '"') inQuotes = true;
        else if (c === ',') { record.push(field); field = ''; }
        else if (c === '\r') { /* ignore, handled by \n */ }
        else if (c === '\n') { record.push(field); rows.push(record); field = ''; record = []; }
        else field += c;
    }
    if (field.length || record.length) { record.push(field); rows.push(record); }
    if (!rows.length) return [];
    const header = rows[0].map((h) => h.trim());
    return rows.slice(1)
        .filter((r) => r.length && !(r.length === 1 && r[0] === ''))
        .map((r) => Object.fromEntries(header.map((h, idx) => [h, r[idx] ?? null])));
}
