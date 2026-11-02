import test from 'node:test';
import assert from 'node:assert/strict';
import {orderTours,tourSections} from '../src/utils/tour-list-order.js';
import {fixture} from './workspace-fixture.js';
import {closeDatabase} from '../src/db/database.js';
import {GuestBrowseService} from '../src/services/guest-browse-service.js';
test('manual tours precede an alphabetical automatic section without mutating input',()=>{
 const rows=[{id:1,name:'Zebra',automatic_owner:'Z'},{id:2,name:'Beta'},{id:3,name:'alpha',automatic_owner:'A'},{id:4,name:'Alpha'}];
 assert.deepEqual(orderTours(rows).map(t=>t.id),[4,2,3,1]);assert.equal(rows[0].id,1);
 const groups=tourSections(orderTours(rows).slice(1,3));
 assert.deepEqual(groups.map(g=>[g.title,g.rows.map(t=>t.id)]),[['Community tours',[2]],['Automatic owner tours',[3]]]);
 assert.equal(tourSections([{id:1,name:'Only',automatic_owner:'A'}])[0].title,'Automatic owner tours');
 assert.deepEqual(tourSections([]),[]);
});
test('member and guest queries group before pagination and retain visibility and environment boundaries',async t=>{
 const {db,svc,c}=await fixture();t.after(()=>closeDatabase(db));
 for(let i=0;i<27;i++)await db.query("INSERT INTO tours(creator_id,name,visibility,eso_server,house_source,automatic_owner) VALUES(?,?,'global','pc_na','global',?)",['u',i<2?'Z manual '+i:'A automatic '+String(i).padStart(2,'0'),i<2?null:'Builder '+i]);
 await db.query("INSERT INTO tours(creator_id,name,visibility,eso_server,house_source) VALUES('other','Hidden','private','pc_na','all'),('other','EU','global','pc_eu','global')");
 const rows=await svc.listTours(c);assert.equal(rows.length,27);assert.deepEqual(rows.slice(0,2).map(t=>t.automatic_owner),[null,null]);assert.equal(rows[2].name,'A automatic 02');
 const guest=new GuestBrowseService(svc),first=await guest.tours('pc_na'),last=await guest.tours('pc_na',{page:2});assert.equal(first.total,27);assert.equal(first.rows[0].name,'Z manual 0');assert.equal(first.rows[2].automatic_owner,'Builder 2');assert.equal(last.rows.length,2);assert.ok(last.rows.every(t=>t.automatic_owner));
});
