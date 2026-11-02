# Tour Pass cover images

New Tour Pass posts now include the tour’s uploaded cover at the top of the Discord card. This works for posts initiated in Discord and through the web portal. Start Tour, Tour Information, Copy Tour, Report and Open Web Tour controls remain available.

The destination channel/thread must allow HearthBound to Attach Files. Without that permission, without a cover, or if the cover cannot be read, posting continues with the original text-only card. No default placeholder is inserted for tours.

Opening a web Tour Pass also displays its cover on the first route screen. The image is served through that pass’s token-bound URL, validates current access/environment and pass status, and is never cached. Revoked or replaced tokens stop serving the image. Image requests do not count as additional pass visits.

Already-posted Discord messages are not retroactively edited. Share the tour again to create a card with its current cover. Changing a cover updates the web view; a Discord attachment remains the image uploaded when that card was posted.

No database migration, new dependency or .env change is required. Merge, pull the code and restart the HearthBound service as usual. This PR is independent of owner tours and tour favorites.
