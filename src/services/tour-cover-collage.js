import sharp from 'sharp';
import {readFile} from 'node:fs/promises';
import {tourAllowsHouseScope} from './saved-house-service.js';
import {tourCollageTitle} from './tour-collage-title.js';

export const TOUR_COLLAGE_LIMIT=9;
export async function buildTourCollage(workspace,c,tour,conn){
 // Lock sources in a consistent order until the generated cover is committed.
 const ids=await conn.query('SELECT DISTINCT saved_house_id FROM tour_stops WHERE tour_id=? ORDER BY saved_house_id FOR UPDATE',[tour.id]),houses=new Map();
 // MariaDB REPEATABLE READ snapshots are not refreshed just by locking an ID.
 // Use the data returned by locking reads for both eligibility and image choice.
 for(const row of ids){const [h]=await conn.query('SELECT * FROM saved_houses WHERE id=? FOR UPDATE',[row.saved_house_id]);if(h)houses.set(Number(h.id),h);}
 const sources=await conn.query('SELECT saved_house_id FROM tour_stops WHERE tour_id=? ORDER BY position,id FOR UPDATE',[tour.id]);
 const photos=[];let skipped=0;
 for(const stop of sources){
  if(photos.length===TOUR_COLLAGE_LIMIT)break;
  const h=houses.get(Number(stop.saved_house_id));
  if(!h||h.status!=='active'||h.eso_server!==tour.eso_server||!workspace.policy.canViewHouse(h,c)||!tourAllowsHouseScope(tour,h.scope)||(h.scope==='private'&&String(h.owner_user_id)!==String(tour.creator_id))||(h.scope==='public'&&String(h.guild_id)!==String(tour.source_guild_id||tour.guild_id||tour.origin_guild_id||''))){skipped++;continue;}
  const [image]=await conn.query('SELECT storage_key FROM house_images WHERE saved_house_id=? ORDER BY position,id LIMIT 1 FOR UPDATE',[h.id]);
  if(!image){skipped++;continue;}
  try{
   // Decode individually so an unreadable photo cannot destroy the current cover.
   const input=await readFile(workspace.images.filePath(image.storage_key));
   const bytes=await sharp(input,{limitInputPixels:40000000,failOn:'warning'}).rotate().resize({width:1200,height:630,fit:'inside',withoutEnlargement:true}).png().toBuffer();photos.push(bytes);
  }catch{skipped++;}
 }
 if(!photos.length){const error=Error('No available cover photos on this tour. Add a screenshot to one of its houses first.');error.code='NO_TOUR_PHOTOS';throw error;}
 const columns=photos.length===1?1:photos.length<=4?2:3,rows=Math.ceil(photos.length/columns),gap=8,tiles=[];
 for(let i=0;i<photos.length;i++){
  const row=Math.floor(i/columns),items=Math.min(columns,photos.length-row*columns),column=i%columns;
  const left=Math.floor(column*1200/items)+gap,top=Math.floor(row*630/rows)+gap,width=Math.floor((column+1)*1200/items)-left-gap,height=Math.floor((row+1)*630/rows)-top-gap;
  tiles.push({input:await sharp(photos[i]).resize(width,height,{fit:'cover'}).toBuffer(),left,top});
 }
 tiles.push({input:tourCollageTitle(tour),left:0,top:0});
 const bytes=await sharp({create:{width:1200,height:630,channels:3,background:'#101b2c'}}).composite(tiles).webp({quality:90}).toBuffer();
 return {bytes,images:photos.length,skipped};
}
