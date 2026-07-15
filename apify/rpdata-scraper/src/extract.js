import { Actor, log } from 'apify';

/**
 * Return a Locator for the first selector candidate that resolves to a visible
 * element, or null when none match within `timeoutMs`.
 */
export async function firstVisible(page, candidates, { timeoutMs = 5000 } = {}) {
    const deadline = Date.now() + timeoutMs;
    do {
        for (const selector of candidates) {
            const locator = page.locator(selector).first();
            if (await locator.isVisible().catch(() => false)) return locator;
        }
        await page.waitForTimeout(250);
    } while (Date.now() < deadline);
    return null;
}

async function textOf(page, candidates) {
    const locator = await firstVisible(page, candidates, { timeoutMs: 2000 });
    if (!locator) return null;
    const text = await locator.textContent().catch(() => null);
    return text ? text.replace(/\s+/g, ' ').trim() : null;
}

function parseIntSafe(text) {
    if (!text) return null;
    const match = text.replace(/,/g, '').match(/\d+/);
    return match ? Number(match[0]) : null;
}

/**
 * Pull beds/baths/cars/land out of the attribute chip row. Chips carry either
 * a label ("4 Beds") or an aria-label; both are matched case-insensitively.
 */
async function extractAttributes(page, candidates) {
    const out = { bedrooms: null, bathrooms: null, carSpaces: null, landSize: null };
    for (const selector of candidates) {
        const chips = page.locator(selector);
        const count = await chips.count().catch(() => 0);
        if (count === 0) continue;
        for (let i = 0; i < count; i++) {
            const chip = chips.nth(i);
            const text = [
                await chip.textContent().catch(() => ''),
                await chip.getAttribute('aria-label').catch(() => ''),
            ].join(' ').replace(/\s+/g, ' ').trim();
            if (/bed/i.test(text)) out.bedrooms = out.bedrooms ?? parseIntSafe(text);
            else if (/bath/i.test(text)) out.bathrooms = out.bathrooms ?? parseIntSafe(text);
            else if (/car|garage|park/i.test(text)) out.carSpaces = out.carSpaces ?? parseIntSafe(text);
            else if (/(m²|m2|sqm|ha\b|land)/i.test(text)) out.landSize = out.landSize ?? text;
        }
        break; // first candidate set that produced chips wins
    }
    return out;
}

async function extractHistoryRows(page, candidates) {
    for (const selector of candidates) {
        const rows = page.locator(selector);
        const count = await rows.count().catch(() => 0);
        if (count === 0) continue;
        const history = [];
        for (let i = 0; i < count; i++) {
            const cells = await rows.nth(i).locator('td, th').allTextContents().catch(() => []);
            const cleaned = cells.map((c) => c.replace(/\s+/g, ' ').trim()).filter(Boolean);
            if (cleaned.length) history.push(cleaned);
        }
        if (history.length) return history;
    }
    return [];
}

/**
 * Scrape a property detail page. `capturedApi` is whatever ApiCapture collected
 * while the page loaded — it is attached verbatim so downstream consumers can
 * prefer the structured API payloads over the DOM-derived fields.
 */
export async function extractProperty(page, { selectors, input, searchQuery, capturedApi }) {
    // Give the SPA a moment to settle; RPP hydrates panels progressively.
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const attributes = await extractAttributes(page, selectors.PROPERTY.attributeChips);

    const lastSaleText = await textOf(page, selectors.PROPERTY.lastSale);
    const priceMatch = lastSaleText?.match(/\$[\d,.]+[MmKk]?/);
    const dateMatch = lastSaleText?.match(/\d{1,2}[\s/-]\w{3,9}[\s/-]\d{2,4}|\d{1,2}\/\d{1,2}\/\d{2,4}/);

    const item = {
        searchQuery,
        url: page.url(),
        address: await textOf(page, selectors.PROPERTY.address),
        propertyType: await textOf(page, selectors.PROPERTY.propertyType),
        ...attributes,
        lastSalePrice: priceMatch?.[0] ?? null,
        lastSaleDate: dateMatch?.[0] ?? null,
        lastSaleRaw: lastSaleText,
        valuationEstimate: await textOf(page, selectors.PROPERTY.valuationEstimate),
        scrapedAt: new Date().toISOString(),
    };

    if (input.includeSalesHistory) {
        item.salesHistory = await extractHistoryRows(page, selectors.PROPERTY.salesHistoryRows);
    }
    if (input.includeRentalHistory) {
        item.rentalHistory = await extractHistoryRows(page, selectors.PROPERTY.rentalHistoryRows);
    }
    if (input.captureApiResponses && capturedApi && Object.keys(capturedApi).length) {
        item.api = capturedApi;
    }
    return item;
}

/**
 * Collects JSON bodies of the SPA's own API calls while a property page loads.
 * Usage: const capture = new ApiCapture(page, patterns); ...navigate...;
 * capture.snapshotAndReset() returns { tag: [payload, ...] }.
 */
export class ApiCapture {
    constructor(page, patterns) {
        this.patterns = patterns;
        this.buffer = {};
        this.handler = async (response) => {
            try {
                const url = response.url();
                const tag = Object.keys(this.patterns)
                    .find((key) => this.patterns[key].some((p) => url.includes(p)));
                if (!tag || !response.ok()) return;
                const contentType = response.headers()['content-type'] ?? '';
                if (!contentType.includes('json')) return;
                const body = await response.json().catch(() => null);
                if (body == null) return;
                (this.buffer[tag] ??= []).push({ url, body });
            } catch {
                /* never let capture break navigation */
            }
        };
        page.on('response', this.handler);
    }

    snapshotAndReset() {
        const snapshot = this.buffer;
        this.buffer = {};
        return snapshot;
    }
}

/** Save a screenshot + HTML snapshot to the KV store for post-mortem debugging. */
export async function saveDebugSnapshot(page, label) {
    try {
        const key = `DEBUG-${label.replace(/[^a-zA-Z0-9-_]/g, '_')}-${Date.now()}`;
        const store = await Actor.openKeyValueStore();
        const screenshot = await page.screenshot({ fullPage: true }).catch(() => null);
        if (screenshot) await store.setValue(`${key}.png`, screenshot, { contentType: 'image/png' });
        const html = await page.content().catch(() => null);
        if (html) await store.setValue(`${key}.html`, html, { contentType: 'text/html' });
        log.info(`Saved debug snapshot ${key} to the key-value store`);
    } catch (err) {
        log.warning(`Could not save debug snapshot: ${err.message}`);
    }
}
