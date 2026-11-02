import test from 'node:test';import assert from 'node:assert/strict';
import {fixture} from './workspace-fixture.js';import {closeDatabase} from '../src/db/database.js';import {MyAddressBookService} from '../src/services/my-addressbook-service.js';
test('Your tours excludes automatic creator attribution while explicit favorites retain automatic tours',async t=>{
 const {db,svc,c}=await fixture();t.after(()=>closeDatabase(db));
 const manual=await svc.tours.create({creatorId:'u',guildId:'g',esoServer:'pc_na',visibility:'global',name:'My route'}),automatic=await svc.tours.create({creatorId:'u',guildId:'g',esoServer:'pc_na',visibility:'global',name:'Automatic route'}),other=await svc.tours.create({creatorId:'other',guildId:'g',esoServer:'pc_na',visibility:'global',name:'Someone else'});
 await db.query('UPDATE tours SET automatic_owner=? WHERE id=?',['Builder',automatic.id]);
 const book=new MyAddressBookService(db);assert.deepEqual((await svc.listTours(c,{mine:true})).map(t=>t.id),[manual.id]);assert.deepEqual((await book.tours('u','pc_na')).map(t=>t.id),[manual.id]);assert.equal((await book.summary('u','g','pc_na')).tours,1);assert.equal((await book.continueItems('u','g','pc_na')).editedTour.id,manual.id);
 await svc.tourFavorites.set(c,automatic.id,true);assert.deepEqual((await svc.listTours(c,{favorites:true})).map(t=>t.id),[automatic.id]);assert.equal((await book.summary('u','g','pc_na')).tours,2);assert.ok((await svc.listTours(c)).some(t=>t.id===other.id));
});
