import {FILTER_KEYS,filterValues} from '../utils/house-search-filters.js';
// Repeated query keys (zone, style, classification, tag) become arrays so one
// group can hold several alternatives while different groups all still apply.
export function readSearchQuery(searchParams){
 const query=Object.fromEntries(searchParams);
 for(const key of FILTER_KEYS){const values=filterValues(searchParams.getAll(key));if(values.length)query[key]=values;else delete query[key];}
 return query;
}
export function queryParams(query={}){
 const params=new URLSearchParams();
 for(const [key,value] of Object.entries(query)){
  if(FILTER_KEYS.includes(key)){for(const item of filterValues(value))params.append(key,item);}
  else if(value!==undefined&&value!==null&&value!=='')params.set(key,value);
 }
 return params;
}
