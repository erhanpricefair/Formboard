/**
 * Every selector the actor touches lives here so that when CoreLogic ships a UI
 * change, there is exactly one file to fix.
 *
 * Each entry is an ordered list of candidates — the first one that resolves to a
 * visible element wins (see firstVisible() in extract.js). The lists mix stable
 * attribute hooks (data-testid, aria-*, name=) with structural fallbacks.
 */

export const URLS = {
    // RP Data Professional home. Unauthenticated hits redirect to the CoreLogic
    // SSO login (auth.corelogic.asia / *.corelogic.com.au/login).
    home: 'https://rpp.corelogic.com.au/',
};

// Hostnames we treat as "we are on the login screen".
export const LOGIN_HOSTS = ['auth.corelogic.asia', 'sso.corelogic.asia', 'id.corelogic.asia'];

export const LOGIN = {
    username: [
        'input[name="username"]',
        'input[name="email"]',
        'input#username',
        'input[type="email"]',
        'input[autocomplete="username"]',
    ],
    password: [
        'input[name="password"]',
        'input#password',
        'input[type="password"]',
    ],
    submit: [
        'button[type="submit"]',
        'button[name="action"]',
        'input[type="submit"]',
        'button:has-text("Sign in")',
        'button:has-text("Log in")',
        'button:has-text("Login")',
    ],
    // Shown when the account already has an active session elsewhere; clicking
    // continues and terminates the other session.
    takeoverSession: [
        'button:has-text("Continue")',
        'button:has-text("End other session")',
        'button:has-text("Log out other session")',
    ],
};

export const SEARCH = {
    // The omnibar on the RPP dashboard.
    input: [
        'input[data-testid="search-input"]',
        'input[aria-label*="Search" i]',
        'input[placeholder*="address" i]',
        'input[placeholder*="Search" i]',
        'input[type="search"]',
    ],
    // Autosuggest entries rendered under the omnibar while typing.
    suggestion: [
        '[data-testid="suggestion-item"]',
        '[role="listbox"] [role="option"]',
        'ul[class*="suggest" i] li',
        '[class*="autosuggest" i] li',
    ],
    // Property links inside a suburb/list search-results page.
    resultLink: [
        'a[data-testid="property-link"]',
        'a[href*="/property/"]',
        'a[href*="propertyId"]',
    ],
    nextPage: [
        'button[aria-label="Next page"]',
        'a[aria-label="Next"]',
        'button:has-text("Next")',
    ],
};

export const PROPERTY = {
    address: [
        '[data-testid="property-address"]',
        'h1',
    ],
    // Attribute chips: beds / baths / cars / land size. Values are matched by
    // accompanying label text, so the same candidates serve all four.
    attributeChips: [
        '[data-testid="property-attributes"] li',
        '[class*="attribute" i] li',
        '[class*="PropertyAttributes" i] span',
    ],
    propertyType: [
        '[data-testid="property-type"]',
        '[class*="propertyType" i]',
    ],
    lastSale: [
        '[data-testid="last-sale"]',
        '[class*="lastSale" i]',
        'section:has-text("Last sale")',
    ],
    valuationEstimate: [
        '[data-testid="valuation-estimate"]',
        '[class*="estimate" i]',
        'section:has-text("Estimate")',
    ],
    salesHistoryRows: [
        '[data-testid="sales-history"] tr',
        'section:has-text("Sales History") table tr',
        '[class*="salesHistory" i] tr',
    ],
    rentalHistoryRows: [
        '[data-testid="rental-history"] tr',
        'section:has-text("Rental History") table tr',
        '[class*="rentalHistory" i] tr',
    ],
};

/**
 * Substrings of XHR/fetch URLs whose JSON responses we capture per property
 * when captureApiResponses is on. RPP's React frontend loads property data from
 * internal REST endpoints; capturing them yields far richer, already-structured
 * data than the DOM. Keyed by a short tag used in the output object.
 */
export const API_CAPTURE_PATTERNS = {
    propertyDetails: ['/property-details', '/property/detail'],
    attributes: ['/attributes'],
    salesHistory: ['/sales-history', '/saleshistory', '/otm-sale'],
    rentalHistory: ['/rental-history', '/otm-rent'],
    valuation: ['/avm', '/valuation', '/estimate'],
    suggestions: ['/suggest'],
};
