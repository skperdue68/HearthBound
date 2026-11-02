import test from 'node:test';import assert from 'node:assert/strict';
import {tourListRow} from '../src/web/tour-list-row.js';
test('tour rows reserve Edit before cover columns regardless of permissions or artwork',()=>{
 for(const canEdit of [false,true])for(const cover of [false,true]){
  const html=tourListRow({id:2,name:'Long <tour>',description:'Details',visibility:'global',canView:true,canEdit,cover},{csrf:'test'},'/app/tours?q=x');
  assert.ok(html.indexOf('tour-list-edit')<html.indexOf('tour-list-cover'));assert.match(html,/Long &lt;tour&gt;/);assert.equal(html.includes('/2/edit'),canEdit);assert.equal(html.includes('/2/cover'),cover);assert.match(html,/name="backTo" value="\/app\/tours\?q=x"/);
 }
});
