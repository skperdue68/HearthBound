import {withHouseTours} from '../services/house-tour-memberships.js';
import {tourCoverThumbnail} from './tour-cover.js';
import {escape} from './render.js';
import {scopeLabel,linkButton} from './workspace-render.js';
export async function houseMemberships(workspace,c,house){
 const rows=(await withHouseTours(workspace,c,[house]))[0].associated_tours;
 return `<section class="panel house-memberships"><div class="section-heading"><h2>Tours featuring this house</h2><span class="count-badge">${rows.length}</span></div>${rows.length?`<ul class="tour-memberships">${rows.map(t=>`<li><div>${tourCoverThumbnail(t)}<a href="/app/tours/${Number(t.id)}">${escape(t.name)}</a><span class="pill">${scopeLabel(t.visibility)}</span></div>${linkButton('View tour',`/app/tours/${Number(t.id)}`)}</li>`).join('')}</ul>`:'<p class="muted">Not on a tour you can view yet. Add it to one of your tours below.</p>'}</section>`;
}
