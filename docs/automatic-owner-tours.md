# Automatic owner tours

HearthBound automatically creates **Homes by @ESOOwner** tours from active registered houses. The owner is the ESO account used in the jump command, not the Discord submitter.

Each tour has a generated 1200×630 HearthBound-style cover bearing the owner’s name. Covers use normal web and Discord tour-cover handling. No image-generation API, paid service, or new npm dependency is needed.

## What is grouped together

- Global houses: one tour per owner and ESO platform/region.
- Server houses: one tour per owner, Discord server and ESO platform/region.
- Private houses: one tour per owner, private record owner and ESO platform/region. Other administrators cannot view these tours or their covers.

Pending, archived and unassigned houses are excluded. Duplicate registrations of the same owner/official house within a group appear once; the oldest eligible registration represents the destination. Routes sort alphabetically by house nickname or official name. Existing manual tours remain independent.

Synchronization runs when the bot becomes ready and once per minute. Changes to the house owner, visibility, platform/region or status move stops into the appropriate group. New houses are added, unavailable houses are removed, and empty automatic tours are deleted. Unchanged stops retain their IDs and tour progress is handled by the existing self-paced tour controls.

Automatic tours are labeled and their route, creator, visibility and cover cannot be manually edited. Make a normal tour if you need a custom route or notes. Keep the source house registration up to date to change an automatic tour.

## Debian/MariaDB upgrade

Merge this PR, back up your database and existing data directories, then use your normal deployment:

```bash
cd ~/HearthBound
git pull --ff-only
npm ci
sudo systemctl restart hearthbound
sudo journalctl -u hearthbound -n 80 --no-pager
```

Startup applies additive schema migration 17 to MariaDB or SQLite: the tours table gains an `automatic_owner` marker, plus group-identity and synchronization-lock tables. Existing tours are not converted. No SQL needs to be pasted manually and no local development database is copied to production. Do not set `MIGRATE=true` for this routine update; that is the separate cross-database transfer workflow.

The first startup generates covers for existing owners and can take longer than later minute checks. Artwork is stored in the existing `TOUR_COVER_DIR` (default `./data/tour-covers`); the service account must already have write access there. Database backups and that directory should be retained together. No new .env settings are required.

The cross-database transfer workflow preserves automatic group identity and markers; missing generated covers regenerate on the next synchronization. Synchronization is serialized with a database lock and locks source rows while it builds the route, so a concurrent visibility change cannot reinsert stale shared stops.
