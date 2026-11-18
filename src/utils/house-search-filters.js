export const FILTER_KEYS=['zone','style','classification','tag'];
const cleaned=value=>String(value??'').trim();
// A facet accepts one value or a list; blank choices are dropped so they never filter.
export function filterValues(value){const list=Array.isArray(value)?value:[value];return [...new Set(list.map(cleaned).filter(Boolean))];}
