import {escape} from './render.js';
export function houseTourLinks(tours=[],{guest=false}={}){
 if(!tours.length)return '';
 const base=guest?'/browse/tours':'/app/tours';
 return `<div class="house-tour-links"><span class="note">On these tours</span><ul>${tours.map(t=>`<li><a class="house-tour-link" href="${base}/${Number(t.id)}">${t.cover?`<img src="${base}/${Number(t.id)}/cover" alt="" width="56" height="38" loading="lazy">`:''}<span>${escape(t.name)}</span></a></li>`).join('')}</ul></div>`;
}
