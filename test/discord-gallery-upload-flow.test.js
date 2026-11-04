import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './workspace-fixture.js';
import {closeDatabase} from '../src/db/database.js';
import {galleryUploadModal} from '../src/ui/house-gallery.js';
import {tourButtonSpecs} from '../src/utils/jump-ui.js';
import {progressRunPayload} from '../src/ui/engagement-ui.js';

test('upload modal binds a house with one attachment and optional caption, rechecking editor rights',async t=>{
 const {db,svc,c}=await fixture();t.after(()=>closeDatabase(db));
 const owner=await svc.fresh({...c,userId:'1'}),house=await svc.registerHouse(owner,{houseId:1,esoOwner:'Builder',visibility:'global'});
 let modal,error;const i={guildId:'g',user:{id:'1'},member:{roles:[]},showModal:async value=>{modal=value.toJSON();},reply:async value=>{error=value;}};
 await galleryUploadModal(svc,i,{houseId:house.id});assert.equal(modal.custom_id,`hu:gallery:upload-submit:${house.id}`);assert.equal(modal.components[0].component.type,19);assert.equal(modal.components[0].component.max_values,1);assert.equal(modal.components[1].component.required,false);
 modal=null;await galleryUploadModal(svc,{...i,user:{id:'u'}},{houseId:house.id});assert.equal(modal,null);assert.match(error.content,/editing|available/);
});

test('tour upload shortcuts bind the current house and remain editor-only',()=>{
 const specs=tourButtonSpecs(9,0,false,{canEdit:true,savedHouseId:12});assert.ok(specs.some(b=>b.customId==='hu:gallery:upload:12'&&b.label==='Add screenshot'));
 assert.ok(!tourButtonSpecs(9,0,false,{savedHouseId:12}).some(b=>b.label==='Add screenshot'));
 const payload=progressRunPayload({item:{id:5,status:'active'},tour:{id:9,name:'Route'},stops:[{id:1,source_id:12,house_id:1,house_name:'Home',eso_owner:'Builder',position:1}],currentPosition:1,canEdit:true});
 assert.ok(payload.components.flatMap(r=>r.toJSON().components).some(b=>b.custom_id==='hu:gallery:upload:12'));assert.ok(payload.components.every(r=>r.components.length<=5));
});

import {createHandlers} from '../src/handlers.js';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import sharp from 'sharp';
import {HouseImageService} from '../src/services/house-image-service.js';

test('Discord modal dispatch uploads to its bound house and confirms success without updating tour',async t=>{
 const {db,svc,c}=await fixture(),dir=await mkdtemp(join(tmpdir(),'modal-upload-')),oldDir=process.env.HOUSE_IMAGE_DIR,oldFetch=globalThis.fetch;
 process.env.HOUSE_IMAGE_DIR=dir;
 t.after(async()=>{globalThis.fetch=oldFetch;if(oldDir===undefined)delete process.env.HOUSE_IMAGE_DIR;else process.env.HOUSE_IMAGE_DIR=oldDir;await closeDatabase(db);await rm(dir,{recursive:true,force:true});});
 svc.images=new HouseImageService(svc,{directory:dir});const owner=await svc.fresh({...c,userId:'1'}),house=await svc.registerHouse(owner,{houseId:1,esoOwner:'Builder',visibility:'global'});
 const png=await sharp({create:{width:100,height:60,channels:3,background:'#eabb55'}}).png().toBuffer();let fetches=0;globalThis.fetch=async()=>{fetches++;return new Response(png);};
 let payload,deferred=false;const handlers=createHandlers(db),i={customId:`hu:gallery:upload-submit:${house.id}`,guildId:'g',user:{id:'1',username:'Owner'},member:{roles:[]},fields:{getUploadedFiles:()=>({first:()=>({url:'https://cdn.discordapp.com/attachments/1/2/photo.png',size:png.length})}),getTextInputValue:()=> 'Tour detail'},deferReply:async()=>{deferred=true;},deferUpdate:async()=>assert.fail('original tour must not be updated'),editReply:async value=>{payload=value;}};
 await handlers.modal(i);assert.ok(deferred);assert.equal(fetches,1);assert.equal((await svc.images.list(owner,house.id))[0].caption,'Tour detail');assert.ok(JSON.stringify(payload).includes('Screenshot uploaded successfully'));
 // Revoked editing rights are checked again at submission, before downloading.
 fetches=0;await handlers.modal({...i,user:{id:'u',username:'Member'}});assert.equal(fetches,0);assert.equal((await svc.images.list(owner,house.id)).length,1);assert.ok(JSON.stringify(payload).includes('editing'));
});

test('missing house command explains both slash options instead of ambiguous error',async t=>{
 const {db}=await fixture();t.after(()=>closeDatabase(db));let payload;
 await createHandlers(db).chat({commandName:'hearth',guildId:'g',user:{id:'u',username:'Member'},options:{getString:()=>null,getAttachment:()=>({url:'x'})},reply:async value=>{payload=value;}});
 assert.match(JSON.stringify(payload),/house option/);assert.match(JSON.stringify(payload),/nickname or ESO account owner/);assert.match(JSON.stringify(payload),/Screenshots/);
});
