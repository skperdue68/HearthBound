import test from 'node:test';import assert from 'node:assert/strict';
import {personalNavigation} from '../src/web/house-discovery.js';import {myAddressBookPayload} from '../src/ui/housing-ui.js';
import {tourShareCardPayload,tourCopyPreviewPayload,houseCopyVisibilityPayload} from '../src/ui/share-pass-ui.js';
test('web and Discord distinguish bookmarking from making an independent editable copy',()=>{
 const html=personalNavigation('/app/personal');assert.match(html,/Favorites.*bookmark/s);assert.match(html,/independent.*copy/s);assert.match(html,/Tours you created/);assert.match(html,/Your registrations/);
 const dashboard=myAddressBookPayload({houses:2,tours:1});assert.match(dashboard.embeds[0].toJSON().description,/bookmark/);assert.match(dashboard.embeds[0].toJSON().description,/editable copy/);
 const card=tourShareCardPayload({id:1,name:'Route',visibility:'global'},{token:'t',portalUrl:''});assert.ok(card.components.flatMap(row=>row.toJSON().components).some(b=>b.label==='Make my own tour copy'));
 const preview=tourCopyPreviewPayload({name:'Route',totalStops:1,reusedStops:1,copiedStops:0},{token:'t'});assert.match(preview.embeds[0].toJSON().description,/Favorite.*bookmark/s);
 const house=houseCopyVisibilityPayload({destination:{houseName:'House',esoOwner:'Builder'},choices:[]},{token:'t'});assert.match(house.embeds[0].toJSON().description,/Favorite.*bookmark/s);
});
