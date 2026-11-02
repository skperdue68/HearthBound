import {escape} from './render.js';
import {linkButton,scopeLabel} from './workspace-render.js';
import {tourFavoriteControl} from './tour-favorites.js';
import {tourCoverThumbnail} from './tour-cover.js';
export function tourListRow(t,session,returnTo='/app/tours'){
 return `<div class="activity tour-favorite-surface tour-list-row">${tourFavoriteControl(t,session,{returnTo})}<div class="tour-list-identity"><div><a href="/app/tours/${Number(t.id)}">${escape(t.name)}</a>${t.automatic_owner?'<span class="pill">Automatic owner tour</span>':''}<p class="user-text">${escape(t.description||'')}</p><span class="pill">${scopeLabel(t.visibility)}</span>${!t.canView?'<small>Management access · content stays restricted</small>':''}</div></div><div class="tour-list-edit">${t.canEdit?linkButton('Edit',`/app/tours/${Number(t.id)}/edit`):''}</div><div class="tour-list-cover">${tourCoverThumbnail(t)}</div></div>`;
}
