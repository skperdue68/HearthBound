export function tourCoverUploadSchema(type){return `CREATE TABLE IF NOT EXISTS tour_cover_uploads (tour_id ${type==='mariadb'?'BIGINT UNSIGNED':'INTEGER'} NOT NULL PRIMARY KEY,storage_key VARCHAR(64) NOT NULL UNIQUE,created_by VARCHAR(32) NOT NULL,updated_at ${type==='mariadb'?'DATETIME':'TEXT'} NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(tour_id) REFERENCES tours(id) ON DELETE CASCADE)${type==='mariadb'?' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci':''}`;}
export async function migrateTourCoverUploads(db){
 if((await db.query('SELECT version FROM schema_migrations WHERE version=19')).length)return;
 await db.query(tourCoverUploadSchema(db.type));
 await db.query(`${db.type==='sqlite'?'INSERT OR IGNORE':'INSERT IGNORE'} INTO tour_cover_uploads(tour_id,storage_key,created_by,updated_at) SELECT c.tour_id,c.storage_key,c.created_by,c.updated_at FROM tour_covers c JOIN tours t ON t.id=c.tour_id WHERE t.automatic_owner IS NULL`);
 await db.query('INSERT INTO schema_migrations(version) VALUES (19)');
}
