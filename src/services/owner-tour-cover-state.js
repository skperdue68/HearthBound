import {createHash} from 'node:crypto';
import {normalizeAccount} from '../utils/eso.js';
export function ownerCoverStamp(owner,server,visibility,houses){return 'auto-owner:'+createHash('sha256').update(JSON.stringify(['collage-v2-six',owner,server,visibility,houses.map(h=>[h.id,h.photos||[]])])).digest('hex').slice(0,20);}
export async function currentOwnerCoverStamp(db,tour){
 const rows=await db.query(`SELECT s.id,s.status,s.scope,s.eso_server,s.guild_id,s.owner_user_id,s.normalized_owner,i.id image_id,i.storage_key FROM tour_stops ts JOIN saved_houses s ON s.id=ts.saved_house_id LEFT JOIN house_images i ON i.saved_house_id=s.id WHERE ts.tour_id=? ORDER BY ts.position,ts.id,i.position,i.id`,[tour.id]);
 const houses=new Map();for(const h of rows)if(h.status==='active'&&h.eso_server===tour.eso_server&&h.scope===tour.visibility&&h.normalized_owner===normalizeAccount(tour.automatic_owner)&&(h.scope!=='private'||h.owner_user_id===tour.creator_id)&&(h.scope!=='public'||h.guild_id===(tour.source_guild_id||tour.guild_id||tour.origin_guild_id))){if(!houses.has(Number(h.id)))houses.set(Number(h.id),{id:h.id,photos:[]});if(h.image_id)houses.get(Number(h.id)).photos.push([h.image_id,h.storage_key]);}
 return ownerCoverStamp(tour.automatic_owner,tour.eso_server,tour.visibility,[...houses.values()]);
}
