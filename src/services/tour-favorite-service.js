import {ContentPolicyService} from './content-policy-service.js';
import {one,withTransaction} from '../db/database.js';
export class TourFavoriteService{
 constructor(db,policy=new ContentPolicyService(db)){this.db=db;this.policy=policy;}
 async get(userId,tourId){return !!await one(this.db,'SELECT tour_id FROM tour_favorites WHERE discord_user_id=? AND tour_id=?',[String(userId),Number(tourId)]);}
 async set(context,tourId,favorite){const c=await this.policy.context(context);if(context.permissionPreview)throw new Error('Access previews are read-only.');return withTransaction(this.db,async conn=>{const tour=await one(conn,'SELECT * FROM tours WHERE id=? FOR UPDATE',[Number(tourId)]);if(!this.policy.canViewTour(tour,c))throw new Error('Tour is not available.');if(favorite){await conn.query(this.db.type==='sqlite'?'INSERT INTO tour_favorites(discord_user_id,tour_id) VALUES(?,?) ON CONFLICT(discord_user_id,tour_id) DO NOTHING':'INSERT INTO tour_favorites(discord_user_id,tour_id) VALUES(?,?) ON DUPLICATE KEY UPDATE tour_id=VALUES(tour_id)',[c.userId,tour.id]);}else await conn.query('DELETE FROM tour_favorites WHERE discord_user_id=? AND tour_id=?',[c.userId,tour.id]);return {is_favorite:favorite?1:0};});}
 async ids(userId){return new Set((await this.db.query('SELECT tour_id FROM tour_favorites WHERE discord_user_id=?',[String(userId)])).map(r=>Number(r.tour_id)));}
 async list(context){const c=await this.policy.context(context);return (await this.db.query('SELECT t.* FROM tours t JOIN tour_favorites f ON f.tour_id=t.id WHERE f.discord_user_id=? ORDER BY t.name,t.id',[c.userId])).filter(t=>this.policy.canViewTour(t,c));}
}
