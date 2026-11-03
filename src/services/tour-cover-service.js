import {currentOwnerCoverStamp} from './owner-tour-cover-state.js';
import {ownerTourArt} from './owner-tour-art.js';
import sharp from 'sharp';
import {buildTourCollage} from './tour-cover-collage.js';
import {randomUUID} from 'node:crypto';
import {mkdir,writeFile,readFile,unlink,readdir,stat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {one,withTransaction} from '../db/database.js';
import {normalizeUploadedImage} from './house-image-service.js';

export class TourCoverService{
 constructor(workspace,{directory=process.env.TOUR_COVER_DIR||'./data/tour-covers'}={}){this.w=workspace;this.db=workspace.db;this.directory=resolve(directory);}
 async access(context,id,edit=false,conn=this.db){const c=await this.w.fresh(context),tour=await this.w.tours.get(Number(id),conn);if(!tour||(edit?!this.w.policy.canEditTour(tour,c):!this.w.policy.canViewTour(tour,c)))throw Error(edit?'Tour is not available for editing.':'Tour is not available.');return {c,tour};}
 filePath(key){if(!/^[a-f0-9-]{36}\.webp$/.test(key))throw Error('Tour cover is unavailable.');return join(this.directory,key);}
 async get(c,id){await this.access(c,id);return one(this.db,'SELECT tour_id,updated_at FROM tour_covers WHERE tour_id=?',[Number(id)]);}
 async read(c,id){const {tour}=await this.access(c,id);return this.readBytes(tour);}
 async readBytes(tour){const row=await one(this.db,'SELECT storage_key,created_by FROM tour_covers WHERE tour_id=?',[Number(tour.id)]);if(!row)throw Error('Tour cover is unavailable.');
  // A visibility/status/photo change must not leave a stale owner collage public
  // while the minute worker catches up. Use the non-photo artwork meanwhile.
  if(tour.automatic_owner&&String(row.created_by).startsWith('auto-owner:')&&row.created_by!==await currentOwnerCoverStamp(this.db,tour))return sharp(ownerTourArt(tour.automatic_owner,tour.eso_server)).webp({quality:90}).toBuffer();
  return readFile(this.filePath(row.storage_key));
 }
 async readForPass(context,token,passes){if(!/^[A-Za-z0-9_-]{32}$/.test(String(token)))throw Error('Tour cover is unavailable.');const c=await this.w.fresh(context),resolved=await passes.resolveTourPass(token,{userId:c.userId,guildId:c.guildId,esoServer:c.esoServer,recordUsage:false});return this.readBytes(resolved.tour);}

 async save(context,id,input){await this.access(context,id,true);const bytes=await normalizeUploadedImage(input);await this.replace(context,id,async()=>({bytes}),{upload:true});}
 async generate(context,id){return this.replace(context,id,(conn,c,tour)=>buildTourCollage(this.w,c,tour,conn));}
 async replace(context,id,prepare,{upload=false}={}){await this.access(context,id,true);const key=randomUUID()+'.webp';let written=false,previous,result;
  try{previous=await withTransaction(this.db,async conn=>{await one(conn,'SELECT id FROM tours WHERE id=? FOR UPDATE',[Number(id)]);const {c,tour}=await this.access(context,id,true,conn),old=await one(conn,'SELECT storage_key FROM tour_covers WHERE tour_id=?',[Number(id)]),saved=upload?await one(conn,'SELECT storage_key FROM tour_cover_uploads WHERE tour_id=? FOR UPDATE',[Number(id)]):null;const prepared=await prepare(conn,c,tour),{bytes,...details}=prepared;result=details;await mkdir(this.directory,{recursive:true});await writeFile(this.filePath(key),bytes,{flag:'wx',mode:0o600});written=true;
   if(old)await conn.query('UPDATE tour_covers SET storage_key=?,created_by=?,updated_at=CURRENT_TIMESTAMP WHERE tour_id=?',[key,c.userId,Number(id)]);else await conn.query('INSERT INTO tour_covers(tour_id,storage_key,created_by) VALUES(?,?,?)',[Number(id),key,c.userId]);if(upload){if(saved)await conn.query('UPDATE tour_cover_uploads SET storage_key=?,created_by=?,updated_at=CURRENT_TIMESTAMP WHERE tour_id=?',[key,c.userId,Number(id)]);else await conn.query('INSERT INTO tour_cover_uploads(tour_id,storage_key,created_by) VALUES(?,?,?)',[Number(id),key,c.userId]);}return [old?.storage_key,saved?.storage_key];
  });}catch(error){if(written)await unlink(this.filePath(key)).catch(()=>{});throw error;}
  for(const oldKey of new Set(previous||[]))if(oldKey)await this.removeUnusedFile(oldKey);return result;
 }

 async remove(context,id){const key=await withTransaction(this.db,async conn=>{await one(conn,'SELECT id FROM tours WHERE id=? FOR UPDATE',[Number(id)]);await this.access(context,id,true,conn);const old=await one(conn,'SELECT storage_key FROM tour_covers WHERE tour_id=?',[Number(id)]);await conn.query('DELETE FROM tour_covers WHERE tour_id=?',[Number(id)]);return old?.storage_key;});if(key)await this.removeUnusedFile(key);}
 async canRestore(context,id){await this.access(context,id,true);const saved=await one(this.db,'SELECT u.storage_key saved_key,c.storage_key active_key FROM tour_cover_uploads u LEFT JOIN tour_covers c ON c.tour_id=u.tour_id WHERE u.tour_id=?',[Number(id)]);return !!saved&&saved.saved_key!==saved.active_key;}
 async restore(context,id){let oldKey;await withTransaction(this.db,async conn=>{await one(conn,'SELECT id FROM tours WHERE id=? FOR UPDATE',[Number(id)]);const {c}=await this.access(context,id,true,conn),saved=await one(conn,'SELECT storage_key FROM tour_cover_uploads WHERE tour_id=? FOR UPDATE',[Number(id)]);if(!saved)throw Error('No saved cover is available. Upload a cover first.');try{await readFile(this.filePath(saved.storage_key));}catch{throw Error('The saved cover file is unavailable. Upload it again.');}const old=await one(conn,'SELECT storage_key FROM tour_covers WHERE tour_id=?',[Number(id)]);oldKey=old?.storage_key;if(old)await conn.query('UPDATE tour_covers SET storage_key=?,created_by=?,updated_at=CURRENT_TIMESTAMP WHERE tour_id=?',[saved.storage_key,c.userId,Number(id)]);else await conn.query('INSERT INTO tour_covers(tour_id,storage_key,created_by) VALUES(?,?,?)',[Number(id),saved.storage_key,c.userId]);});if(oldKey)await this.removeUnusedFile(oldKey);}
 async fileReferenced(key){return !!await one(this.db,'SELECT tour_id FROM tour_covers WHERE storage_key=? UNION ALL SELECT tour_id FROM tour_cover_uploads WHERE storage_key=? LIMIT 1',[key,key]);}
 async removeUnusedFile(key){if(!await this.fileReferenced(key))await unlink(this.filePath(key)).catch(()=>{});}
 async cleanupOrphans({now=Date.now()}={}){const names=await readdir(this.directory).catch(e=>{if(e.code==='ENOENT')return [];throw e;});let removed=0;for(const key of names){if(!/^[a-f0-9-]{36}\.webp$/.test(key))continue;const path=this.filePath(key),info=await stat(path);if(!info.isFile()||info.mtimeMs>now-86400000)continue;if(!await this.fileReferenced(key)){await unlink(path);removed++;}}return removed;}
}
