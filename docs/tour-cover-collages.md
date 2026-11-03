# Create a tour cover from house photos

Open a tour you can edit, then find **Tour cover** below its house list and tour link. Choose **Create cover from tour houses**, or **Replace with house collage** if it already has artwork.

HearthBound combines up to six randomly selected gallery photos, taking one from each house before taking extras into a 1200×630 image. Houses without usable photos are skipped. If none can be used, the current cover is preserved and you are told to add a screenshot to a tour house first.

Only active houses visible to you and compatible with the tour's visibility, source server and ESO platform/region can contribute. Creator-only Private records are not pulled into broader tours. Normal tour editing permissions and form protections apply. Automatic owner tours remain read-only.

For manually created tours, the result is a snapshot, not a live collage: choose the action again when you want to use newer house covers or a changed route. Uploading a new graphic becomes both the current cover and your latest saved upload. Choosing a collage does not delete that saved upload. Use **Restore saved cover** to put it back; **Remove current cover** clears the displayed image but retains the saved upload. Uploading another graphic replaces the previous saved upload.

The saved collage uses the existing tour-cover system, so it appears in web lists, tour pages, Discord tour starts and newly shared Tour Passes. Already-posted Discord messages need to be reopened or shared again to show changed artwork.

Schema migration **19** runs automatically during normal startup on SQLite or MariaDB. Back up your database and tour-cover files before updating as usual; no manual SQL or slash-command redeployment is required. The database transfer tool includes both active and saved cover references; keep the referenced files when moving installations.

Automatic owner tours refresh their artwork when their route or available gallery photos change. Photo collages retain the “Homes by @owner” title and ESO platform/region. When no usable photos exist, they keep the original illustrated house-and-stars artwork. Stale owner collages fall back to that illustration immediately when source eligibility changes, before the minute worker rebuilds them. Custom manually uploaded artwork is not overwritten by the owner-tour worker.

On upgrade, each existing manual tour’s current cover becomes its initial saved artwork. Uploaded files already replaced and deleted before this update cannot be recovered. Automatic tours keep the same random selection until the route or gallery changes; manual tours get a fresh selection when you regenerate.
