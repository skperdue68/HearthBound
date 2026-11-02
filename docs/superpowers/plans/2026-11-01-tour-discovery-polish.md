# Tour discovery polish implementation plan

> Execute inline with superpowers:executing-plans. User already approved items 1–5 and opted out of design questions.

**Goal:** Separate automatic tours, show accessible tour artwork alongside houses, align tour controls, and correct creator-only tour lists.

**Architecture:** Reuse existing SSR, cover endpoints and content policy. Group before pagination; decorate membership queries in batches and never expose inaccessible tours. No schema or dependency changes.

**Tech stack:** Node, SQLite/MariaDB SQL, SSR HTML/CSS, Discord components.

**Spec:** User's numbered items 1–5 in this conversation.

## Constraints and review focus
- Preserve server, creator-only Private and ESO environment boundaries, including image endpoints.
- Preserve filters, counts, pagination, favorites and Discord option indices.
- Empty and text-only tours remain usable. Automatic sections continue on subsequent pages.
- Long names and narrow screens must not break image/button alignment.
- Publish separate PRs per numbered request; clearly identify dependencies if stacked. Do not merge or deploy.

## Tasks
1. Test manual-before-automatic ordering and page section labels; implement shared ordering, web/guest sections and Discord section summaries. Verify service and route regressions; publish item 1.
2. Test batched house-tour memberships against mixed visibility, pending and cross-environment records; add small accessible links and cover thumbnails to house search cards/lists for members and guests. Verify; publish item 2.
3. Reuse membership data/markup for open-house associated tours including guests; verify missing covers and restricted records; publish item 3.
4. Give tour rows explicit identity, Edit and cover columns; test mixed editability/missing covers and narrow layouts; publish item 4.
5. Test owner-generated tours excluded from creator lists while explicitly favorited automatic tours remain in favorites; fix web and Discord creator queries and continue-edit shortcuts; publish item 5.

## Deferred
Collage generation and My Address Book semantics are not authorized in this batch.
