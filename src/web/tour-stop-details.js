import {escape} from './render.js';
import {houseMetadata} from './house-details.js';
import {houseVisitCommands} from './house-visit.js';
import {houseCapacityBadge} from './house-capacity.js';
const tagsOf=value=>{try{const tags=Array.isArray(value)?value:JSON.parse(value||'[]');return Array.isArray(tags)?tags.map(String):[];}catch{return [];}};
import {esoServerLabel} from '../utils/eso-server.js';

// All image URLs are supplied by the caller's authorized member, guest or pass route.
export function tourStopDetails(h,{title,notes,images=[],imageUrl}={}){
 const photo=(image,index)=>`<figure><a data-gallery-image href="${escape(imageUrl(image.id))}" target="_blank" rel="noopener"><img src="${escape(imageUrl(image.id))}" alt="${escape(image.caption||`${h.display_name||h.house_name} screenshot ${index+1}`)}" width="1200" height="750" ${index?'loading="lazy"':'fetchpriority="high"'}></a>${image.caption?`<figcaption>${escape(image.caption)}</figcaption>`:''}</figure>`;
 const cover=images[0]?`<div class="tour-stop-photos tour-stop-cover"><figure><a href="#tour-stop-screenshots" aria-label="View house screenshots"><img src="${escape(imageUrl(images[0].id))}" alt="${escape(images[0].caption||h.display_name||h.house_name)}" width="1200" height="750" fetchpriority="high"></a>${images[0].caption?`<figcaption>${escape(images[0].caption)}</figcaption>`:''}</figure></div>`:'';
 const gallery=images.length?`<section class="house-gallery tour-stop-photos" id="tour-stop-screenshots"><h3>House screenshots</h3><div class="gallery-grid">${images.map(photo).join('')}</div></section>`:'';
 return `${cover}<h3>${escape(title||h.display_name||h.house_name)} ${houseCapacityBadge(h)}</h3><p><strong>House:</strong> ${escape(h.house_name)} · <strong>ESO owner:</strong> @${escape(String(h.eso_owner||'').replace(/^@/,''))}</p><p class="note">${escape(esoServerLabel(h.eso_server))}</p>${notes?`<section><h3>Tour stop notes</h3><p class="user-text">${escape(notes)}</p></section>`:''}${h.description?`<section><h3>About this house</h3><p class="user-text">${escape(h.description)}</p></section>`:''}${h.tags?`<p class="house-tags">${tagsOf(h.tags).map(tag=>`<span class="pill">${escape(tag)}</span>`).join(' ')}</p>`:''}${houseVisitCommands(h)}${houseMetadata(h)}${gallery}`;
}
