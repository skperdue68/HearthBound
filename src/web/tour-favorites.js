import {escape} from './render.js';
import {tourCoverThumbnail} from './tour-cover.js';
import {personalControls} from './personal-controls.js';
export function tourFavoriteControl(t,session,{returnTo='/app/tours'}={}){if(!t.canView)return '';return personalControls(`/app/tours/${Number(t.id)}/favorite`,session,{is_favorite:t.is_favorite?1:0},null,{heart:true,backTo:returnTo}).replace('Save house','Save tour');}

export async function tourLibrarySection(w,c,session){if(typeof w.listTours!=='function')return '';const rows=await w.listTours(c,{favorites:true});return `<section class="panel"><div class="section-heading"><h2>Favorite tours</h2><a href="/app/tours?favorites=1">View all favorite tours</a></div>${rows.length?rows.slice(0,5).map(t=>`<div class="activity tour-favorite-surface">${tourFavoriteControl(t,session,{returnTo:'/app/personal'})}<div class="tour-list-identity"><a href="/app/tours/${Number(t.id)}">${escape(t.name)}</a>${tourCoverThumbnail(t)}</div></div>`).join(''):'<p>Use the heart on a tour to save it here.</p>'}</section>`;}
