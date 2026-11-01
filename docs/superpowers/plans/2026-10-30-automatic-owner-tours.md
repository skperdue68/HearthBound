# Automatic owner tours implementation plan

Approved scope: automatic synchronized tours by ESO account owner with named cover art, separate visibility/environment boundaries; proceed without design questions per user preference.

- [x] Add repeatable SQLite/MariaDB migration: nullable automatic_owner flag on tours, unique hashed group mapping and singleton sync lock. No existing tours converted.
- [x] Test grouping, active-only filtering, private creator/server/environment isolation, destination deduplication, idempotence, addition/removal, stable stop IDs and manual-tour preservation.
- [x] Implement transactionally serialized reconciliation, startup and minute worker integration. Keep manual tour mutation services and policy from changing generated routes.
- [x] Generate original SVG house/landscape artwork with escaped owner name, rasterize to WebP and use ordinary protected cover storage. Keep existing covers stable on repeat runs; clean missing/empty groups.
- [x] Label automatic tours in web/Discord, hide editing controls, retain normal viewing and playback. Verify cover retrieval and permission guards.
- [ ] Run relevant tests, full suite, review; document Linux startup migration and synchronization; publish separate PR. No production deployment.

Validation: all 833 tests passed; generated cover rendered and visually checked; review found a stale-visibility race that was corrected with source-row locking and rechecked. MariaDB SQL/schema reviewed; no live MariaDB test or production deployment performed.
