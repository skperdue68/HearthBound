import {escape} from './render.js';
import {FILTER_KEYS,filterValues} from '../utils/house-search-filters.js';
import {queryParams} from './search-params.js';
const labels={zone:'Zone',style:'Style',classification:'Classification',tag:'Tag'};
const emptyLabels={zone:'zones',style:'styles',classification:'classifications',tag:'tags'};
export const sortChoices=[['az','A–Z'],['newest','Newest'],['favorites','Most favorited']];
export function sortSelect(query={}){return `<label>Sort by<select name="sort">${sortChoices.map(([value,label])=>`<option value="${value}" ${(query.sort||'az')===value?'selected':''}>${label}</option>`).join('')}</select></label>`;}
const filterHint='Choose any number of zones, styles, classifications or tags. Choices within one filter are alternatives; different filters all apply.';
function filterState(choices={},query={}){
 const selected=new Map(FILTER_KEYS.map(key=>[key,filterValues(query[key])]));
 const options=new Map(FILTER_KEYS.map(key=>[key,[...new Set([...(choices[key]||[]).map(String),...selected.get(key)])].sort((a,b)=>a.localeCompare(b))]));
 return {selected,options};
}
function chipMarkup(selected,options){
 return FILTER_KEYS.flatMap(key=>selected.get(key).map(value=>`<span class="filter-chip"><span class="filter-chip-label">${labels[key]}</span><span>${escape(value)}</span><button type="button" class="filter-chip-remove" data-remove-filter="filter-${key}-${Math.max(0,options.get(key).indexOf(value))}" aria-label="Remove ${escape(labels[key])} filter ${escape(value)}">×</button></span>`)).join('');
}
// Chosen filters render above the search fields so they stay visible under an open dropdown.
export function filterChips(choices={},query={}){
 const {selected,options}=filterState(choices,query),chips=chipMarkup(selected,options);
 return chips?`<div class="filter-chips" aria-label="Selected house filters">${chips}</div>`:'';
}
export function quickFilters(choices={},query={}){
 const {selected,options}=filterState(choices,query);
 const dropdowns=FILTER_KEYS.map(key=>{
  const chosen=selected.get(key),values=options.get(key);
  return `<details class="filter-dropdown"${chosen.length?' open':''}><summary>${labels[key]}${chosen.length?` <span class="filter-count">${chosen.length}</span>`:''}</summary><div class="filter-options">${values.length?values.map((value,index)=>`<label class="filter-option"><input type="checkbox" id="filter-${key}-${index}" name="${key}" value="${escape(value)}"${chosen.includes(value)?' checked':''}><span>${escape(value)}</span></label>`).join(''):`<span class="note">No ${emptyLabels[key]} available yet.</span>`}</div></details>`;
 }).join('');
 const chosenFilters=FILTER_KEYS.some(key=>selected.get(key).length);
 return `<div class="quick-search-filters" aria-label="Browse house attributes">${dropdowns}${chosenFilters?'':`<div class="filter-chips"><span class="note">${filterHint}</span></div>`}</div>`;
}
export function resultsToolbar({query={},path,total,page=1}){
 const target=value=>{const params=queryParams(query);params.set('view',value);return path+'?'+params;};
 const hidden=Object.entries(query).filter(([key])=>!['sort','page'].includes(key)).map(([key,value])=>Array.isArray(value)?value.map(item=>`<input type="hidden" name="${escape(key)}" value="${escape(item)}">`).join(''):value===undefined||value===null?'':`<input type="hidden" name="${escape(key)}" value="${escape(value)}">`).join('');
 return `<div class="results-toolbar"><p class="note">${Number(total)} matching house${total===1?'':'s'}${total>25?` · Page ${Number(page)}`:''}</p><form class="results-sort" method="get" action="${escape(path)}" data-search-controls>${hidden}${sortSelect(query)}<noscript><button>Sort</button></noscript></form><nav class="view-switch" aria-label="House results layout">${[['cards','Cards'],['list','Compact list']].map(([value,label])=>`<a href="${escape(target(value))}" ${(query.view==='list'?'list':'cards')===value?'aria-current="page"':''}>${label}</a>`).join('')}</nav></div>`;
}
export async function resultPage(workspace,context,rows,query){const ordered=workspace.sortHouseResults?await workspace.sortHouseResults(rows,query.sort):rows,total=ordered.length,pages=Math.max(1,Math.ceil(total/25)),page=Math.min(pages,Math.max(1,Math.floor(Number(query.page)||1)));return {rows:await workspace.decorateHouses(context,ordered.slice((page-1)*25,page*25)),total,page};}
