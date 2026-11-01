# Favorite tours

Use the corner heart on a web tour row or tour detail page to save or unsave the tour. Filled means saved. My Address Book includes a Favorite tours section and a link to the complete paginated list; tour search also offers Favorite tours. Favorite filters stay applied while searching or paging. Without JavaScript, the native form returns to the originating list or detail page.

In Discord, tour information offers Favorite tour / Unfavorite tour. The current screen and its navigation remain in place. My Address Book → My Tours includes tours you created and accessible tours you favorited, without duplicate entries.

Favorites are personal. Saving does not grant tour access or change visibility. Private tours remain creator-only, Server tours remain restricted to that server, and ESO platform/region restrictions continue to apply. Withdrawn access hides the saved tour. Lower-access web previews cannot save. Deleting a tour removes its favorite records automatically.

## Upgrade

Merge the automatic owner-tour PR first, then this PR. Startup applies additive schema migration 18 on SQLite or MariaDB. Pull the merged code, run `npm ci`, and restart `hearthbound` using the normal deployment process. No manual SQL, .env changes, or production data conversion is required. Database transfer includes favorite records.
