import test from 'node:test';import assert from 'node:assert/strict';
import {fixture} from './workspace-fixture.js';import {closeDatabase} from '../src/db/database.js';
import {withHouseTours} from '../src/services/house-tour-memberships.js';
import {houseTourLinks} from '../src/web/house-tour-links.js';
import {discoveryCards} from '../src/web/house-discovery.js';
import {houseTable} from '../src/web/house-table.js';
test('house links batch accessible memberships and covers without exposing private, foreign or pending records',async t=>{
 const {db,svc,c}=await fixture();t.after(()=>closeDatabase(db));const owner=await svc.fresh({...c,userId:'1'}),h=await svc.registerHouse(owner,{houseId:1,esoOwner:'Builder',visibility:'global'});
 for(const [name,visibility,creatorId,guildId] of [['Shared','public','u','g'],['Global <garden>','global','u','g'],['My private','private','u','g'],['Secret','private','other','g'],['Foreign','public','other','elsewhere']]){const tour=await svc.tours.create({name,visibility,creatorId,guildId,esoServer:'pc_na'});await svc.tours.addStop(tour.id,h.id);await db.query("INSERT INTO tour_covers(tour_id,storage_key,created_by) VALUES(?, ?,'u')",[tour.id,'test-'+tour.id+'.webp']);}
 const original=db.query.bind(db);let queries=0;db.query=async(...args)=>{queries++;return original(...args);};
 const member=await withHouseTours(svc,c,[h,{...h,id:999,scope:'official'}]);assert.equal(queries,1);assert.equal(member[0].associated_tours.length,3);assert.equal(member[1].associated_tours.length,0);
 const html=houseTourLinks(member[0].associated_tours);assert.match(html,/Global &lt;garden&gt;/);assert.match(html,/\/app\/tours\/\d+\/cover/);assert.doesNotMatch(html,/Secret|Foreign/);
 for(const render of [discoveryCards,houseTable]){const result=render(member);assert.match(result,/On these tours/);assert.match(result,/\/app\/tours\/\d+\/cover/);assert.doesNotMatch(result,/Secret|Foreign/);}
 const guest=await withHouseTours(svc,{esoServer:'pc_na'},[h],{guest:true});assert.equal(guest[0].associated_tours.length,1);assert.match(houseTourLinks(guest[0].associated_tours,{guest:true}),/\/browse\/tours\//);
 await db.query("UPDATE saved_houses SET status='pending' WHERE id=?",[h.id]);assert.equal((await withHouseTours(svc,c,[h]))[0].associated_tours.length,0);
});
