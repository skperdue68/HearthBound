import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './workspace-fixture.js';
import {closeDatabase,one} from '../src/db/database.js';
import {HouseImageService} from '../src/services/house-image-service.js';
import {createWebAdminServer} from '../src/web/server.js';
import {WebAdminService} from '../src/services/web-admin-service.js';
import {createSession} from '../src/web/session.js';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import sharp from 'sharp';

test('web tour stops expose photos, separate notes and description, links and catalog data with revocable pass image access',async t=>{
 const {db,svc,c}=await fixture(),dir=await mkdtemp(join(tmpdir(),'stop-details-'));
 svc.images=new HouseImageService(svc,{directory:dir});
 const owner=await svc.fresh({...c,userId:'1'});
 await db.query("UPDATE houses SET house_type='Small Home',classification='Classic Home',style='Bosmer',population_limit=6 WHERE house_id=1");
 const h=await svc.registerHouse(owner,{houseId:1,esoOwner:'Builder',visibility:'global',description:'Full house description',tags:'cozy'});
 const other=await svc.registerHouse(owner,{houseId:2,esoOwner:'Other',visibility:'private'});
 const bytes=await sharp({create:{width:400,height:220,channels:3,background:'#c82'}}).png().toBuffer();
 const image=await svc.images.add(owner,h.id,bytes,'Cover caption'),extra=await svc.images.add(owner,h.id,bytes,'Second view'),foreign=await svc.images.add(owner,other.id,bytes);
 const tour=await svc.saveTourDraft(owner,{details:{name:'Detailed route',visibility:'global'},stopIds:[h.id]});
 await db.query("UPDATE tour_stops SET notes='Look upstairs' WHERE tour_id=?",[tour.id]);
 await svc.startTour(owner,tour.id);
 const issued=await svc.actions.createPass(owner,'tour',tour.id);
 const server=createWebAdminServer({service:new WebAdminService(db),workspace:svc,config:{sessionSecret:'s'},resolveGuildMembership:async()=>({id:'g',name:'Guild',roleIds:[],esoServer:'pc_na'})});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(async()=>{await new Promise(r=>server.close(r));await closeDatabase(db);await rm(dir,{recursive:true,force:true});});
 const base=`http://127.0.0.1:${server.address().port}`,headers={cookie:'addressbook_session='+createSession({id:'1',guilds:[{id:'g'}]},Date.now(),'s')},pass='/app/shared/tour/'+issued.token;
 for(const [path,options] of [[pass,{headers}],[`/app/tours/${tour.id}/play`,{headers}],[`/browse/tours/${tour.id}?stop=1`,{}]]){
  const response=await fetch(base+path,options),html=await response.text();assert.equal(response.status,200);
  for(const text of ['Cover caption','Second view','Full house description','Look upstairs','Housing link','Unfurnished preview','Small Home','Bosmer','Zone','6 max'])assert.ok(html.includes(text),`${path} missing ${text}`);
  assert.match(html,/>cozy<\/span>/);assert.doesNotMatch(html,/>\[&quot;cozy/);
  assert.ok(html.indexOf('Official house details')<html.indexOf('id="tour-stop-screenshots"'),'gallery follows catalog details');
  assert.match(html,/data-gallery-image/);assert.match(html,/house-gallery.js/);
  assert.ok(html.indexOf('Cover caption')<html.indexOf('Full house description'),'cover comes before house information');
 }
 // Asset traffic uses a separate bounded bucket, leaving navigation available.
 for(let i=0;i<65;i++)assert.equal((await fetch(base+pass+`/houses/${h.id}/images/${image.id}`,{headers})).status,200);
 assert.equal((await fetch(base+pass,{headers})).status,200);
 const before=await one(db,'SELECT usage_count FROM tour_share_passes WHERE id=?',[issued.pass.id]);
 const photoPath=pass+`/houses/${h.id}/images/${image.id}`;
 assert.equal((await fetch(base+photoPath,{headers})).status,200);
 assert.deepEqual(await one(db,'SELECT usage_count FROM tour_share_passes WHERE id=?',[issued.pass.id]),before);
 assert.equal((await fetch(base+pass+`/houses/${other.id}/images/${foreign.id}`,{headers})).status,404);
 assert.equal((await fetch(base+pass+`/houses/${h.id}/images/${foreign.id}`,{headers})).status,404);
 // Private house screenshots are available through their pass, never their normal URL.
 const housePass=await svc.actions.createPass(owner,'house',other.id),privateTour=await svc.saveTourDraft(owner,{details:{name:'Private route',visibility:'private'},stopIds:[other.id]}),privatePass=await svc.actions.createPass(owner,'tour',privateTour.id);
 const viewer={cookie:'addressbook_session='+createSession({id:'u',guilds:[{id:'g'}]},Date.now(),'s')};
 for(const [kind,grant] of [['house',housePass],['tour',privatePass]]){
  const route='/app/shared/'+kind+'/'+grant.token,html=await(await fetch(base+route,{headers:viewer})).text();
  assert.ok(html.includes(route+`/houses/${other.id}/images/${foreign.id}`));
  const count=await one(db,`SELECT usage_count FROM ${kind}_share_passes WHERE id=?`,[grant.pass.id]);
  assert.equal((await fetch(base+route+`/houses/${other.id}/images/${foreign.id}`,{headers:viewer})).status,200);
  assert.deepEqual(await one(db,`SELECT usage_count FROM ${kind}_share_passes WHERE id=?`,[grant.pass.id]),count);
  await svc.actions.revokePass(owner,kind,grant.pass.id);
  assert.equal((await fetch(base+route+`/houses/${other.id}/images/${foreign.id}`,{headers:viewer})).status,404);
 }
 assert.notEqual((await fetch(base+`/app/houses/${other.id}/images/${foreign.id}`,{headers:viewer})).status,200);
 await svc.actions.revokePass(owner,'tour',issued.pass.id);
 assert.equal((await fetch(base+photoPath,{headers})).status,404);
});

import {tourStopDetails} from '../src/web/tour-stop-details.js';
test('text-only tour stops omit photo space and escape house text and captions',()=>{
 const house={house_name:'<House>',eso_owner:'@Builder',description:'First\n\nSecond <script>',tags:'["cozy","<tag>"]'};
 const html=tourStopDetails(house,{notes:'<Note>'});
 assert.doesNotMatch(html,/tour-stop-photos|<script>|<House>|<Note>/);assert.match(html,/First\n\nSecond &lt;script&gt;/);assert.match(html,/>cozy<\/span>/);assert.match(html,/&lt;Note&gt;/);
 const photos=tourStopDetails(house,{images:[{id:1,caption:'<caption>'}],imageUrl:()=>'/safe/image'});assert.match(photos,/&lt;caption&gt;/);assert.doesNotMatch(photos,/<caption>/);
});
