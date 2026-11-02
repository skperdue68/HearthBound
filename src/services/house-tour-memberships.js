import {orderTours} from '../utils/tour-list-order.js';

// One lookup per result-page batch, matching the actual destination rather than
// the official house type. Both the registration and tour must be viewable.
export async function withHouseTours(workspace,c,rows,{guest=false}={}){
 const houses=rows.filter(h=>h.scope!=='official'&&Number(h.id)>0),byHouse=new Map();
 for(let offset=0;offset<houses.length;offset+=200){
  const batch=houses.slice(offset,offset+200),ids=batch.map(h=>Number(h.id)),destinations=[...new Set(batch.map(h=>Number(h.destination_id)).filter(n=>n>0))];
  const args=[c.esoServer,c.esoServer,...ids,...destinations];
  const visibility=guest?"t.visibility='global' AND s.scope='global'":"(t.visibility='global' OR (t.visibility='public' AND t.guild_id=?) OR (t.visibility='private' AND t.creator_id=?)) AND (s.scope='global' OR (s.scope='public' AND s.guild_id=?) OR (s.scope='private' AND s.owner_user_id=?))";
  if(!guest)args.push(c.guildId||'',c.userId||'',c.guildId||'',c.userId||'');
  const matches=await workspace.db.query(`SELECT DISTINCT s.id saved_house_id,s.destination_id,t.id,t.name,t.visibility,t.automatic_owner,CASE WHEN tc.tour_id IS NULL THEN 0 ELSE 1 END cover FROM tour_stops ts JOIN tours t ON t.id=ts.tour_id JOIN saved_houses s ON s.id=ts.saved_house_id LEFT JOIN tour_covers tc ON tc.tour_id=t.id WHERE t.eso_server=? AND s.eso_server=? AND s.status='active' AND (s.id IN (${ids.map(()=>'?').join(',')})${destinations.length?` OR s.destination_id IN (${destinations.map(()=>'?').join(',')})`:''}) AND ${visibility}`,args);
  for(const h of batch){const tours=new Map();for(const row of matches)if(Number(row.saved_house_id)===Number(h.id)||(Number(h.destination_id)>0&&Number(row.destination_id)===Number(h.destination_id)))tours.set(Number(row.id),row);byHouse.set(Number(h.id),orderTours([...tours.values()]));}
 }
 return rows.map(h=>({...h,associated_tours:h.scope==='official'?[]:byHouse.get(Number(h.id))||[]}));
}
