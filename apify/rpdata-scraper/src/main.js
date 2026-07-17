import { Actor, log } from 'apify';
import { chromium } from 'playwright';
import * as selectors from './selectors.js';
import { URLS, SEARCH, API_CAPTURE_PATTERNS } from './selectors.js';
import { firstVisible, extractProperty, ApiCapture, saveDebugSnapshot } from './extract.js';
import { ensureLoggedIn, restoreSession, persistSession, clearSession } from './login.js';

await Actor.init();

const input = {
    maxResultsPerQuery: 25,
    includeSalesHistory: true,
    includeRentalHistory: false,
    captureApiResponses: true,
    reuseSession: true,
    navigationTimeoutSecs: 60,
    debugScreenshots: true,
    ...(await Actor.getInput()),
};

if (!input.username || !input.password) throw new Error('Both username and password are required.');
if (!input.searchQueries?.length) throw new Error('Provide at least one search query.');

const proxyConfiguration = input.proxyConfiguration
    ? await Actor.createProxyConfiguration(input.proxyConfiguration)
    : undefined;
const proxyUrl = await proxyConfiguration?.newUrl();
if (proxyUrl) log.info('Using proxy for all traffic');
else log.warning('Running without a proxy — CoreLogic is likely to geo-block or rate-limit you. AU residential proxies are recommended.');

// One browser, one session, sequential queries: RP Data enforces a single
// active session per account, so concurrency would just get us kicked out.
const browser = await chromium.launch({
    headless: true,
    proxy: proxyUrl ? { server: proxyUrl } : undefined,
});
const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'en-AU',
    timezoneId: 'Australia/Melbourne',
});
context.setDefaultTimeout(input.navigationTimeoutSecs * 1000);

await restoreSession(context, input);
const page = await context.newPage();
const apiCapture = new ApiCapture(page, API_CAPTURE_PATTERNS);

/** Type the query into the omnibar and open the first suggestion. */
async function runSearch(query) {
    if (!page.url().startsWith(URLS.home)) {
        await page.goto(URLS.home, { waitUntil: 'domcontentloaded' });
    }
    const searchBox = await firstVisible(page, SEARCH.input, { timeoutMs: 15000 });
    if (!searchBox) throw new Error('Search box not found on the dashboard — update src/selectors.js.');

    await searchBox.click();
    await searchBox.fill('');
    // Type like a human so the autosuggest endpoint actually fires.
    await searchBox.pressSequentially(query, { delay: 80 });

    const suggestion = await firstVisible(page, SEARCH.suggestion, { timeoutMs: 10000 });
    if (!suggestion) {
        // No suggestions — try submitting the raw query instead.
        log.warning(`No autosuggest results for "${query}", pressing Enter as a fallback`);
        await searchBox.press('Enter');
    } else {
        await suggestion.click();
    }
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
}

/** Collect up to maxResults property URLs from a suburb/list results page. */
async function collectResultLinks(maxResults) {
    const urls = new Set();
    for (let pageNum = 0; urls.size < maxResults && pageNum < 50; pageNum++) {
        const anchor = await firstVisible(page, SEARCH.resultLink, { timeoutMs: 10000 });
        if (!anchor) break;
        for (const candidate of SEARCH.resultLink) {
            const hrefs = await page.locator(candidate).evaluateAll(
                (els) => els.map((el) => el.href).filter(Boolean),
            ).catch(() => []);
            if (hrefs.length) {
                hrefs.forEach((href) => urls.size < maxResults && urls.add(href));
                break;
            }
        }
        if (urls.size >= maxResults) break;
        const next = await firstVisible(page, SEARCH.nextPage, { timeoutMs: 2000 });
        if (!next || !(await next.isEnabled().catch(() => false))) break;
        await next.click();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1500);
    }
    return [...urls];
}

function looksLikePropertyPage() {
    return /\/property\/|propertyId=/i.test(page.url());
}

async function scrapeCurrentProperty(searchQuery) {
    const item = await extractProperty(page, {
        selectors,
        input,
        searchQuery,
        capturedApi: apiCapture.snapshotAndReset(),
    });
    await Actor.pushData(item);
    log.info(`Scraped: ${item.address ?? page.url()}`);
    return item;
}

let scraped = 0;
const failedQueries = [];

try {
    try {
        await ensureLoggedIn(page, input);
    } catch (err) {
        // A stale persisted session can leave us in a broken auth state; clear
        // it and retry the login once from scratch before giving up.
        if (!input.reuseSession) throw err;
        log.warning(`Login attempt failed (${err.message}); clearing saved session and retrying once`);
        await clearSession();
        await context.clearCookies();
        await ensureLoggedIn(page, input);
    }

    for (const query of input.searchQueries) {
        log.info(`--- Searching: "${query}"`);
        try {
            apiCapture.snapshotAndReset(); // drop noise from previous navigation
            await runSearch(query);

            if (looksLikePropertyPage()) {
                await scrapeCurrentProperty(query);
                scraped++;
            } else {
                const links = await collectResultLinks(input.maxResultsPerQuery);
                if (!links.length) {
                    log.warning(`"${query}" produced neither a property page nor result links`);
                    if (input.debugScreenshots) await saveDebugSnapshot(page, `no-results-${query}`);
                    failedQueries.push(query);
                    continue;
                }
                log.info(`"${query}" resolved to a list — scraping ${links.length} properties`);
                for (const url of links) {
                    apiCapture.snapshotAndReset();
                    await page.goto(url, { waitUntil: 'domcontentloaded' });
                    await scrapeCurrentProperty(query);
                    scraped++;
                    // Gentle pacing; RPP rate-limits aggressive account activity.
                    await page.waitForTimeout(1000 + Math.random() * 1500);
                }
            }
        } catch (err) {
            log.exception(err, `Query "${query}" failed`);
            if (input.debugScreenshots) await saveDebugSnapshot(page, `query-failed-${query}`);
            failedQueries.push(query);
        }
        await page.waitForTimeout(1500 + Math.random() * 2000);
    }

    await persistSession(context, input);
} finally {
    await browser.close().catch(() => {});
}

const summary = `Scraped ${scraped} properties from ${input.searchQueries.length} queries`
    + (failedQueries.length ? `; ${failedQueries.length} failed: ${failedQueries.join(', ')}` : '');
log.info(summary);
await Actor.setStatusMessage(summary);

if (scraped === 0) {
    await Actor.fail('No properties were scraped — see the log and DEBUG-* snapshots in the key-value store.');
} else {
    await Actor.exit();
}
