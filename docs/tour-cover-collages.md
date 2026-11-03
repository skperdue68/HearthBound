# Create a tour cover from house photos

Open a tour you can edit, then find **Tour cover** below its house list and tour link. Choose **Create cover from tour houses**, or **Replace with house collage** if it already has artwork.

HearthBound combines up to nine available house cover photos in tour-stop order into a 1200×630 image. Houses without usable photos are skipped. If none can be used, the current cover is preserved and you are told to add a screenshot to a tour house first.

Only active houses visible to you and compatible with the tour's visibility, source server and ESO platform/region can contribute. Creator-only Private records are not pulled into broader tours. Normal tour editing permissions and form protections apply. Automatic owner tours remain read-only.

For manually created tours, the result is a snapshot, not a live collage: choose the action again when you want to use newer house covers or a changed route. Uploading a new graphic still replaces it normally. Existing uploaded covers are never automatically overwritten.

The saved collage uses the existing tour-cover system, so it appears in web lists, tour pages, Discord tour starts and newly shared Tour Passes. Already-posted Discord messages need to be reopened or shared again to show changed artwork.

No migration, package installation beyond the usual `npm ci`, or Discord slash-command redeployment is required.

Automatic owner tours refresh their artwork when their route or selected house covers change. Photo collages retain the “Homes by @owner” title and ESO platform/region. When no usable photos exist, they keep the original illustrated house-and-stars artwork. Stale owner collages fall back to that illustration immediately when source eligibility changes, before the minute worker rebuilds them. Custom manually uploaded artwork is not overwritten by the owner-tour worker.
