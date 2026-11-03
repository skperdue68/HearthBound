import {createHash} from 'node:crypto';
import {normalizeAccount} from '../utils/eso.js';
export function ownerCoverStamp(owner,server,visibility,houses){return 'auto-owner:'+createHash('sha256').update(JSON.stringify(['collage-v1',owner,server,visibility,houses.map(h=>[h.id,h.cover_id?[h.cover_id,h.cover_key]:null])])).digest('hex').slice(0,20);}
export async function currentOwnerCoverStamp(db,tour){
 const rows=await db.query(`SELECT s.id,s.status,s.scope,s.eso_server,s.guild_id,s.owner_user_id,s.normalized_owner,(SELECT i.id FROM house_images i WHERE i.saved_house_id=s.id ORDER BY i.position,i.id LIMIT 1) cover_id,(SELECT i.storage_key FROM house_images i WHERE i.saved_house_id=s.id ORDER BY i.position,i.id LIMIT 1) cover_key FROM tour_stops ts JOIN saved_houses s ON s.id=ts.saved_house_id WHERE ts.tour_id=? ORDER BY ts.position,ts.id`,[tour.id]);
 const eligible=rows.filter(h=>h.status==='active'&&h.eso_server===tour.eso_server&&h.scope===tour.visibility&&h.normalized_owner===normalizeAccount(tour.automatic_owner)&&(h.scope!=='private'||h.owner_user_id===tour.creator_id)&&(h.scope!=='public'||h.guild_id===(tour.source_guild_id||tour.guild_id||tour.origin_guild_id)));
 return ownerCoverStamp(tour.automatic_owner,tour.eso_server,tour.visibility,eligible);
}
