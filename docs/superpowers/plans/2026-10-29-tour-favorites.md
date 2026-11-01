# Tour favorites

Add an idempotent SQLite/MariaDB schema migration for per-user tour favorites with cascading tour deletion. Saving never grants visibility: recheck the actual viewer, current visibility and ESO environment on writes and lists; previews remain read-only. Use web corner hearts and Discord reversible Favorite/Unfavorite. Show saved tours in My Address Book separately from houses. Preserve return destinations and support ordinary native forms. Verify migration repetition, privacy/environment isolation, save/unsave, deleted tours, and web/Discord rendering before publishing separately.

Implemented as schema18 after owner-tour schema17. Current screen controls preserved for Discord toggles; web list filters and native return paths retained. Verify scoped saved lists and cross-database transfer before PR.
