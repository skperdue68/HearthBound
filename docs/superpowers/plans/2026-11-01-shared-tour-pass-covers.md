# Shared Tour Pass covers

Use the existing protected tour cover for passes posted through Discord and the web adapter. Check Attach Files in the actual destination, use a Components V2 image at the top, and retain existing pass buttons and revocation-on-send-failure behavior. No cover means the original text-only card.

Render the actual cover on the web Tour Pass route. Serve it through a token-bound endpoint that freshly validates current pass access/environment/readiness and sends no-store WebP bytes. Image fetching must not increment pass usage/audit counts. Revoked, replaced, missing, moved and invalid passes must fail closed. No schema changes.

Test both posting paths, no-image/missing permissions/read failure fallback, private pass-only cover reads, environment mismatch, usage counts and revocation. Review then publish as its own independent PR.
