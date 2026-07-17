/**
 * Flatten SDMX-JSON into one plain object per observation. SDMX encodes each
 * series as a colon-joined key of dimension indices (e.g. "0:2:1") and each
 * observation as a period index -> [value, ...attributeIndices]. We map those
 * indices back to the dimension/attribute labels from the structure block.
 *
 * Handles both the older shape (data.structure) and the newer array shape
 * (data.structures[0]).
 */
export function flattenSdmxJson(body) {
    const data = body.data ?? body;
    const dataSet = (data.dataSets ?? [])[0];
    const structure = data.structure ?? data.structures?.[0];
    if (!dataSet || !structure) return [];

    const seriesDims = structure.dimensions?.series ?? [];
    const obsDims = structure.dimensions?.observation ?? [];
    const attributes = structure.attributes?.observation ?? [];

    const label = (dim, idx) => {
        const v = dim?.values?.[idx];
        return v ? { id: v.id, name: v.name } : { id: String(idx), name: null };
    };

    const out = [];
    for (const [seriesKey, series] of Object.entries(dataSet.series ?? {})) {
        const seriesIdx = seriesKey.split(':').map(Number);
        const seriesLabels = {};
        seriesDims.forEach((dim, i) => {
            const l = label(dim, seriesIdx[i]);
            seriesLabels[dim.id] = l.name ?? l.id;
        });
        for (const [obsKey, obsVal] of Object.entries(series.observations ?? {})) {
            const obsIdx = Number(obsKey.split(':')[0]);
            const period = label(obsDims[0], obsIdx);
            const value = Array.isArray(obsVal) ? obsVal[0] : obsVal;
            const attrs = {};
            if (Array.isArray(obsVal)) {
                obsVal.slice(1).forEach((attrIdx, i) => {
                    const attr = attributes[i];
                    if (attr && attrIdx != null) attrs[attr.id] = attr.values?.[attrIdx]?.name ?? attrIdx;
                });
            }
            out.push({ ...seriesLabels, period: period.name ?? period.id, value, ...attrs });
        }
    }
    return out;
}
