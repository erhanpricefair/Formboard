import { Actor, log } from 'apify';
import { URLS, LOGIN, LOGIN_HOSTS, SEARCH } from './selectors.js';
import { firstVisible, saveDebugSnapshot } from './extract.js';

const SESSION_KEY = 'RPDATA-SESSION-STATE';

function onLoginScreen(page) {
    const { hostname, pathname } = new URL(page.url());
    return LOGIN_HOSTS.includes(hostname) || /\/(login|signin|auth)/i.test(pathname);
}

async function isLoggedIn(page) {
    if (onLoginScreen(page)) return false;
    // The omnibar only renders inside the authenticated app shell.
    return Boolean(await firstVisible(page, SEARCH.input, { timeoutMs: 8000 }));
}

export async function restoreSession(context, { reuseSession }) {
    if (!reuseSession) return;
    const store = await Actor.openKeyValueStore();
    const state = await store.getValue(SESSION_KEY);
    if (!state?.cookies?.length) return;
    await context.addCookies(state.cookies);
    log.info(`Restored ${state.cookies.length} cookies from previous run`);
}

export async function persistSession(context, { reuseSession }) {
    if (!reuseSession) return;
    const store = await Actor.openKeyValueStore();
    const { cookies } = await context.storageState();
    await store.setValue(SESSION_KEY, { cookies, savedAt: new Date().toISOString() });
    log.info('Persisted login session for the next run');
}

export async function clearSession() {
    const store = await Actor.openKeyValueStore();
    await store.setValue(SESSION_KEY, null);
}

/**
 * Ensure the page is on the authenticated RPP dashboard, logging in with the
 * provided credentials when needed. Throws when login demonstrably failed
 * (bad credentials, MFA challenge, unrecognised login screen).
 */
export async function ensureLoggedIn(page, input) {
    await page.goto(URLS.home, { waitUntil: 'domcontentloaded', timeout: input.navigationTimeoutSecs * 1000 });

    if (await isLoggedIn(page)) {
        log.info('Existing session is still valid — skipping login');
        return;
    }

    log.info(`Logging in to RP Data as ${input.username}...`);

    const usernameField = await firstVisible(page, LOGIN.username, { timeoutMs: 15000 });
    if (!usernameField) {
        if (input.debugScreenshots) await saveDebugSnapshot(page, 'login-no-username-field');
        throw new Error(`Could not find the login form at ${page.url()}. `
            + 'CoreLogic may have changed their SSO screen — check the debug snapshot and update src/selectors.js.');
    }
    await usernameField.fill(input.username);

    // Some SSO flows are two-step (username → next → password).
    let passwordField = await firstVisible(page, LOGIN.password, { timeoutMs: 2000 });
    if (!passwordField) {
        const next = await firstVisible(page, LOGIN.submit, { timeoutMs: 2000 });
        if (next) await next.click();
        passwordField = await firstVisible(page, LOGIN.password, { timeoutMs: 10000 });
    }
    if (!passwordField) {
        if (input.debugScreenshots) await saveDebugSnapshot(page, 'login-no-password-field');
        throw new Error('Found the username field but not the password field — update src/selectors.js.');
    }
    await passwordField.fill(input.password);

    const submit = await firstVisible(page, LOGIN.submit, { timeoutMs: 5000 });
    if (!submit) throw new Error('Could not find the login submit button — update src/selectors.js.');
    await Promise.all([
        page.waitForLoadState('networkidle', { timeout: input.navigationTimeoutSecs * 1000 }).catch(() => {}),
        submit.click(),
    ]);

    // RP Data allows one active session; if another device holds it, a takeover
    // prompt appears. Accepting it ends the other session and continues ours.
    const takeover = await firstVisible(page, LOGIN.takeoverSession, { timeoutMs: 3000 });
    if (takeover && onLoginScreen(page)) {
        log.warning('Another active session was detected — taking it over');
        await takeover.click();
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    }

    if (!(await isLoggedIn(page))) {
        if (input.debugScreenshots) await saveDebugSnapshot(page, 'login-failed');
        throw new Error('Login did not reach the RPP dashboard. Likely causes: wrong credentials, '
            + 'an MFA/CAPTCHA challenge, or a geo-block (use AU residential proxies). '
            + 'See the DEBUG-login-failed snapshot in the key-value store.');
    }
    log.info('Login successful');
}
