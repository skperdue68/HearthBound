import test from 'node:test';import assert from 'node:assert/strict';
import {fixture} from './workspace-fixture.js';import {closeDatabase} from '../src/db/database.js';
import {houseMemberships} from '../src/web/house-memberships.js';import {GuestBrowseService} from '../src/services/guest-browse-service.js';
test('opened houses show tour covers and preserve readable links for text-only tours',async t=>{
 const {db,svc,c}=await fixture();t.after(()=>closeDatabase(db));const owner=await svc.fresh({...c,userId:'1'}),h=await svc.registerHouse(owner,{houseId:1,esoOwner:'Builder',visibility:'global'});
 const covered=await svc.tours.create({creatorId:'u',guildId:'g',esoServer:'pc_na',visibility:'global',name:'Covered'}),plain=await svc.tours.create({creatorId:'u',guildId:'g',esoServer:'pc_na',visibility:'global',name:'Plain'});for(const tour of [covered,plain])await svc.tours.addStop(tour.id,h.id);
 await db.query("INSERT INTO tour_covers(tour_id,storage_key,created_by) VALUES(?,'covered.webp','u')",[covered.id]);
 const html=await houseMemberships(svc,c,h);assert.match(html,new RegExp(`/app/tours/${covered.id}/cover`));assert.match(html,new RegExp(`/app/tours/${plain.id}`));assert.doesNotMatch(html,new RegExp(`/app/tours/${plain.id}/cover`));
 const rows=await new GuestBrowseService(svc).houseTours(h.id);assert.equal(rows.find(t=>t.id===covered.id).cover,1);assert.equal(rows.find(t=>t.id===plain.id).cover,0);
});
