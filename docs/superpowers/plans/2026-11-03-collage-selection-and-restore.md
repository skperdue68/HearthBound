# Six-photo collages and saved uploaded covers

Execute inline, following the user's explicit request and prior opt-out of design questions.

- Randomize eligible houses and each house's available gallery photos. Take one usable image per house per round, up to six total. Preserve permissions, current locking reads, title overlays and illustrated fallback. Automatic covers regenerate only when source state changes; their fingerprints must include every eligible gallery photo now used as a candidate.
- Migration19 adds tour_cover_uploads, retaining the latest uploaded image separately from the active cover. Backfill current manual-tour covers as the initial saved artwork; earlier overwritten/deleted image files cannot be recovered. Persist new uploads transactionally. Generating a collage preserves saved artwork; Restore saved cover switches back without reuploading. Removing the current cover does not erase saved artwork. Orphan cleanup and database transfer must preserve retained files/rows.
- Reuse CSRF, context and live editing checks for restoration; refresh panel and hero in place like uploads. Clearly explain the saved cover and six-photo limit. No new image endpoint exposing saved artwork.
- Test randomized selection/distribution/cap, unreadable sources, owner fingerprint invalidation, migration repeatability/backfill/MariaDB DDL, upload→collage→restore, permission denial, rollback, cleanup, deletion cascade and HTTP/browser controls. Run full suite and independent review, then publish one PR.
