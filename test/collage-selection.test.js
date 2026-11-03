import test from 'node:test';import assert from 'node:assert/strict';
import {randomizedPhotoRounds,TOUR_COLLAGE_LIMIT} from '../src/services/collage-selection.js';
test('randomized collage candidates spread one image per house before repeats, with a six-photo cap',()=>{
 assert.equal(TOUR_COLLAGE_LIMIT,6);
 const houses=Array.from({length:10},(_,id)=>({id,photos:[{key:id+'a'},{key:id+'b'}]}));const selected=[...randomizedPhotoRounds(houses,()=>0)].slice(0,6);
 assert.equal(new Set(selected.map(p=>p.house.id)).size,6);assert.notEqual(selected[0].house.id,0);
 const few=[...randomizedPhotoRounds(houses.slice(0,2),()=>0)];assert.notEqual(few[0].house.id,few[1].house.id);assert.deepEqual(few.map(p=>p.house.id),[1,0,1,0]);assert.equal(houses[0].photos[0].key,'0a');
 assert.deepEqual([...randomizedPhotoRounds([])],[]);
});
