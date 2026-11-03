import {escape} from './render.js';
import {csrfField,linkButton,renderWorkspace} from './workspace-render.js';
import {csrfMatches} from './session.js';
import {readUpload} from './house-gallery.js';

export const tourCoverUrl=id=>`/app/tours/${Number(id)}/cover`;
export function tourCoverThumbnail(t){return t.cover?`<a class="house-list-thumbnail" href="/app/tours/${Number(t.id)}"><img src="${tourCoverUrl(t.id)}" alt="Cover for ${escape(t.name)}" width="96" height="64" loading="lazy"></a>`:'';}
export function tourCoverHero(draft){return `<section class="panel tour-cover-panel" data-tour-cover-hero ${draft.cover?'':'hidden'}>${draft.cover?`<img class="tour-cover-image" src="${tourCoverUrl(draft.tour.id)}" alt="Cover for ${escape(draft.tour.name)}" width="1200" height="675">`:''}</section>`;}
export function tourCoverMarkup(draft,csrf,context=null){
 const t=draft.tour;if(!draft.canEdit)return '';
 const fields=()=>csrfField(csrf)+(context?`<input type="hidden" name="contextGuildId" value="${escape(context.guildId)}"><input type="hidden" name="contextEsoServer" value="${escape(context.esoServer)}">`:'');
 return `<section class="panel tour-cover-panel" id="tour-cover" data-tour-cover>${draft.canEdit?`<h2>Tour cover</h2><p class="note">Add a graphic, photograph or collage to introduce your tour.</p><form action="${tourCoverUrl(t.id)}" method="post" enctype="multipart/form-data" data-tour-cover-upload>${fields()}<input type="hidden" name="action" value="upload"><div class="upload-dropzone" data-tour-cover-dropzone><label>Add or change tour image<input type="file" name="image" accept="image/png,image/jpeg,image/webp" required aria-describedby="tour-cover-hint"></label><p class="note" id="tour-cover-hint">Choose a file, or drop one image here. Uploads automatically · PNG, JPEG or WebP · up to 5 MB. A new upload becomes the current cover and replaces your saved upload.</p></div><div class="actions"><button class="primary" data-tour-cover-submit>Upload tour image</button></div></form><div class="actions"><form action="${tourCoverUrl(t.id)}" method="post" data-tour-cover-generate>${fields()}<input type="hidden" name="action" value="generate"><button class="secondary">${draft.cover?'Replace with house collage':'Create cover from tour houses'}</button></form>${draft.canRestoreCover?`<form action="${tourCoverUrl(t.id)}" method="post" data-tour-cover-restore>${fields()}<input type="hidden" name="action" value="restore"><button>Restore saved cover</button></form>`:''}${draft.cover?`<form action="${tourCoverUrl(t.id)}" method="post" data-tour-cover-remove>${fields()}<button class="danger" name="action" value="remove">Remove current cover</button></form>`:''}<span data-tour-cover-status role="status" aria-live="polite"></span></div><p class="note">Collages randomly choose up to six photos, spreading them across houses before taking extras. Regenerate for a fresh selection. Your latest uploaded cover is saved separately, so you can restore it after using a collage or removing the current cover.</p>`:''}</section>`;
}
export async function tourCoverRoute({request,response,url,workspace:w,context:c,session,send,redirect,readBody}){
 const match=/^\/app\/tours\/(\d+)\/cover$/.exec(url.pathname);if(!match)return null;const id=Number(match[1]),json=String(request.headers.accept||'').includes('application/json'),jsonSend=(status,data)=>send(response,status,JSON.stringify(data),{'content-type':'application/json; charset=utf-8'});
 try{
  if(request.method==='GET'){const bytes=await w.tourCovers.read(c,id);return send(response,200,bytes,{'content-type':'image/webp','cache-control':'private, no-store','x-content-type-options':'nosniff','content-security-policy':"default-src 'none'"});}
  if(request.method!=='POST')return send(response,405,'Use the tour image form.');
  await w.tourCovers.access(c,id,true);
  const multipart=String(request.headers['content-type']||'').startsWith('multipart/form-data'),form=multipart?await readUpload(request):await readBody(request,8192);
  if(!csrfMatches(session.csrf,form.get('csrf'))||form.get('contextGuildId')!==c.guildId||form.get('contextEsoServer')!==c.esoServer)return json?jsonSend(403,{ok:false,error:'The form expired or server context changed. Reload and try again.'}):send(response,403,'The form expired or server context changed. Reload and try again.');
  let generated=null;
  if(form.get('action')==='generate')generated=await w.tourCovers.generate(c,id);
  else if(form.get('action')==='restore')await w.tourCovers.restore(c,id);
  else if(form.get('action')==='remove')await w.tourCovers.remove(c,id);
  else if(form.get('action')==='upload'){const file=form.get('image');if(!file||typeof file.arrayBuffer!=='function')throw Error('Choose a tour image.');await w.tourCovers.save(c,id,Buffer.from(await file.arrayBuffer()));}
  else throw Error('Choose a tour image action.');
  if(json){const {tour,c:current}=await w.tourCovers.access(c,id,true),draft={tour,canRestoreCover:await w.tourCovers.canRestore(current,id),cover:w.policy.canViewTour(tour,current)?await w.tourCovers.get(current,id):null,canEdit:true};return jsonSend(200,{ok:true,message:generated?`Tour collage saved using ${generated.images} house photo${generated.images===1?'':'s'}.`:form.get('action')==='restore'?'Saved cover restored.':null,coverHtml:tourCoverMarkup(draft,session.csrf,current),heroHtml:tourCoverHero(draft)});}
  return redirect(response,`/app/tours/${id}#tour-cover`);
 }catch(error){if(request.method==='GET')return send(response,404,'Tour image unavailable.',{'cache-control':'private, no-store'});if(json)return jsonSend(400,{ok:false,error:error.message});return send(response,400,renderWorkspace({title:'Tour image not saved',body:`<p class="notice error">${escape(error.message)}</p>${linkButton('Back to tour',`/app/tours/${id}#tour-cover`)}`,user:session,context:c}));}
}
