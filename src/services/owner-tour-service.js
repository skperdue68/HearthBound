import {ownerCoverStamp} from './owner-tour-cover-state.js';
import {buildTourCollage} from './tour-cover-collage.js';
import {createHash,randomUUID} from 'node:crypto';
import {mkdir,writeFile,unlink} from 'node:fs/promises';
import sharp from 'sharp';
import {one,withTransaction} from '../db/database.js';
import {ownerTourArt} from './owner-tour-art.js';
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function ownerTourGroups(rows){const groups=new Map();for(const h of rows){if(h.status!=='active'||!h.normalized_owner||!h.eso_server||!['private','public','global'].includes(h.scope))continue;const boundary=h.scope==='public'?h.guild_id:h.scope==='private'?h.owner_user_id:'';if(h.scope!=='global'&&!boundary)continue;const key=hash([h.normalized_owner,h.eso_server,h.scope,boundary]);if(!groups.has(key))groups.set(key,{key,owner:h.eso_owner,server:h.eso_server,visibility:h.scope,boundary,houses:[]});const group=groups.get(key);if(!group.houses.some(r=>Number(r.house_id)===Number(h.house_id)))group.houses.push(h);}for(const g of groups.values())g.houses.sort((a,b)=>String(a.display_name||a.catalog_house_name||a.house_name).localeCompare(String(b.display_name||b.catalog_house_name||b.house_name),'en',{sensitivity:'base'})||Number(a.id)-Number(b.id));return [...groups.values()];}
export class OwnerTourService{
 constructor(workspace){this.w=workspace;this.db=workspace.db;}
 async runOnce(){if(this.running)return this.running;this.running=this.synchronize();try{return await this.running;}finally{this.running=null;}}
 async synchronize(){const generated=[],retired=[];try{const result=await withTransaction(this.db,async conn=>{
 await one(conn,'SELECT id FROM owner_tour_sync_lock WHERE id=1 FOR UPDATE');
 const rows=await conn.query("SELECT s.*,h.name catalog_house_name FROM saved_houses s JOIN houses h ON h.house_id=s.house_id WHERE s.status='active' AND s.eso_server IS NOT NULL ORDER BY s.id FOR UPDATE");const groups=ownerTourGroups(rows),keys=new Set(groups.map(g=>g.key));let created=0,changed=0,removed=0;
 for(const old of await conn.query('SELECT * FROM owner_tour_groups'))if(!keys.has(old.group_key)){await conn.query('DELETE FROM tours WHERE id=? AND automatic_owner IS NOT NULL',[old.tour_id]);removed++;}
 for(const g of groups){let mapping=await one(conn,'SELECT tour_id FROM owner_tour_groups WHERE group_key=?',[g.key]),tourId=mapping?.tour_id;const first=g.houses[0];if(!tourId){const tour=await this.w.tours.createInConnection(conn,{creatorId:g.visibility==='private'?g.boundary:first.created_by,guildId:g.visibility==='public'?g.boundary:null,esoServer:g.server,visibility:g.visibility,name:('Homes by @'+g.owner.replace(/^@/,'')).slice(0,100),description:'Automatic owner tour. This route follows active houses registered to @'+g.owner.replace(/^@/,'')+'. Houses are grouped by visibility and ESO platform/region; updates appear within a minute.',tags:['owner tour']});tourId=tour.id;await conn.query('UPDATE tours SET automatic_owner=? WHERE id=?',[g.owner,tourId]);await conn.query('INSERT INTO owner_tour_groups(group_key,tour_id) VALUES(?,?)',[g.key,tourId]);created++;}
 const stops=await conn.query('SELECT * FROM tour_stops WHERE tour_id=? ORDER BY position,id',[tourId]),wanted=new Set(g.houses.map(h=>Number(h.id)));let dirty=stops.length!==g.houses.length||stops.some((s,i)=>Number(s.saved_house_id)!==Number(g.houses[i]?.id));if(dirty){for(const s of stops)if(!wanted.has(Number(s.saved_house_id)))await conn.query('DELETE FROM tour_stops WHERE id=?',[s.id]);const retained=new Map(stops.filter(s=>wanted.has(Number(s.saved_house_id))).map(s=>[Number(s.saved_house_id),s]));for(const s of retained.values())await conn.query('UPDATE tour_stops SET position=? WHERE id=?',[-Number(s.id),s.id]);for(let i=0;i<g.houses.length;i++){const h=g.houses[i],stop=retained.get(Number(h.id));if(stop)await conn.query('UPDATE tour_stops SET position=? WHERE id=?',[i+1,stop.id]);else await conn.query('INSERT INTO tour_stops(tour_id,position,saved_house_id) VALUES(?,?,?)',[tourId,i+1,h.id]);}await conn.query('UPDATE tours SET updated_at=CURRENT_TIMESTAMP WHERE id=?',[tourId]);changed++;}
 const photos=await conn.query(`SELECT id,saved_house_id,storage_key FROM house_images WHERE saved_house_id IN (${g.houses.map(()=>'?').join(',')}) ORDER BY saved_house_id,position,id FOR UPDATE`,g.houses.map(h=>h.id)),firstPhotos=new Map();for(const photo of photos)if(!firstPhotos.has(Number(photo.saved_house_id)))firstPhotos.set(Number(photo.saved_house_id),[photo.id,photo.storage_key]);
 const coverTour=await this.w.tours.get(tourId,conn);
 const stamp=ownerCoverStamp(coverTour.automatic_owner,coverTour.eso_server,coverTour.visibility,g.houses.map(h=>({...h,cover_id:firstPhotos.get(Number(h.id))?.[0],cover_key:firstPhotos.get(Number(h.id))?.[1]}))),old=await one(conn,'SELECT storage_key,created_by FROM tour_covers WHERE tour_id=? FOR UPDATE',[tourId]);
 if(!old||((old.created_by==='automatic-owner-tour'||String(old.created_by).startsWith('auto-owner:'))&&old.created_by!==stamp)){
  const tour=coverTour,context={userId:g.visibility==='private'?g.boundary:String(tour.creator_id),guildId:g.visibility==='public'?g.boundary:'',esoServer:g.server};let bytes;
  try{bytes=(await buildTourCollage(this.w,context,tour,conn)).bytes;}catch(error){if(error.code!=='NO_TOUR_PHOTOS')throw error;bytes=await sharp(ownerTourArt(coverTour.automatic_owner,coverTour.eso_server)).webp({quality:90}).toBuffer();}
  const key=randomUUID()+'.webp',path=this.w.tourCovers.filePath(key);await mkdir(this.w.tourCovers.directory,{recursive:true});await writeFile(path,bytes,{flag:'wx',mode:0o600});generated.push(path);
  if(old){await conn.query('UPDATE tour_covers SET storage_key=?,created_by=?,updated_at=CURRENT_TIMESTAMP WHERE tour_id=?',[key,stamp,tourId]);retired.push(this.w.tourCovers.filePath(old.storage_key));}else await conn.query('INSERT INTO tour_covers(tour_id,storage_key,created_by) VALUES(?,?,?)',[tourId,key,stamp]);
 }

 }
 return {created,changed,removed};
 });for(const path of retired)await unlink(path).catch(()=>{});return result;}catch(error){for(const path of generated)await unlink(path).catch(()=>{});throw error;}}
}
