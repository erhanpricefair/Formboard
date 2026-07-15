import { Actor, log } from 'apify';
import { CkanClient, downloadResourceRecords } from './ckan.js';

await Actor.init();

const input = {
    baseUrl: 'https://data.gov.au/data',
    searchQueries: [],
    datasetIds: [],
    maxDatasets: 25,
    fetchRecords: false,
    maxRecordsPerResource: 1000,
    resourceFormats: [],
    ...(await Actor.getInput()),
};

if (!input.searchQueries.length && !input.datasetIds.length) {
    throw new Error('Provide at least one searchQuery or datasetId.');
}

const ckan = new CkanClient(input.baseUrl);
const wantedFormats = new Set(input.resourceFormats.map((f) => f.toLowerCase()));

function pickResources(pkg) {
    const resources = pkg.resources ?? [];
    if (!wantedFormats.size) return resources;
    return resources.filter((r) => wantedFormats.has((r.format ?? '').toLowerCase()));
}

/** Emit the dataset's metadata, then optionally its resources' rows. */
async function handlePackage(pkg, sourceQuery) {
    const resources = pickResources(pkg);
    await Actor.pushData({
        type: 'dataset',
        sourceQuery,
        id: pkg.id,
        name: pkg.name,
        title: pkg.title,
        notes: pkg.notes,
        organization: pkg.organization?.title ?? null,
        license: pkg.license_title ?? pkg.license_id ?? null,
        tags: (pkg.tags ?? []).map((t) => t.name),
        url: `${input.baseUrl.replace(/\/data$/, '')}/dataset/${pkg.name}`,
        lastModified: pkg.metadata_modified ?? null,
        resources: resources.map((r) => ({
            id: r.id, name: r.name, format: r.format, url: r.url,
            datastoreActive: r.datastore_active ?? false,
        })),
        scrapedAt: new Date().toISOString(),
    });

    if (!input.fetchRecords) return;

    for (const resource of resources) {
        let records = [];
        if (resource.datastore_active) {
            for await (const rec of ckan.datastoreRecords(resource.id, { limit: input.maxRecordsPerResource })) {
                records.push(rec);
            }
        } else {
            records = await downloadResourceRecords(resource, { maxRecords: input.maxRecordsPerResource });
        }
        if (!records.length) continue;
        log.info(`  ${records.length} rows from resource "${resource.name ?? resource.id}"`);
        await Actor.pushData(records.map((row) => ({
            type: 'record',
            datasetId: pkg.id,
            datasetTitle: pkg.title,
            resourceId: resource.id,
            resourceName: resource.name,
            row,
            scrapedAt: new Date().toISOString(),
        })));
    }
}

let datasetCount = 0;

for (const query of input.searchQueries) {
    log.info(`Searching data.gov.au for "${query}"...`);
    for await (const pkg of ckan.searchPackages(query, { limit: input.maxDatasets })) {
        await handlePackage(pkg, query);
        datasetCount++;
    }
}

for (const id of input.datasetIds) {
    try {
        log.info(`Fetching dataset ${id}...`);
        const pkg = await ckan.showPackage(id);
        await handlePackage(pkg, null);
        datasetCount++;
    } catch (err) {
        log.exception(err, `Failed to fetch dataset ${id}`);
    }
}

const summary = `Processed ${datasetCount} datasets from ${input.baseUrl}`;
log.info(summary);
await Actor.setStatusMessage(summary);
await Actor.exit();
