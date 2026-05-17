# Deployment History

Notable Cloudflare Pages builds for `chromata-dev`. Each is accessible at `https://<hash>.chromata-dev.pages.dev`.

## Current

- `e2e13cd6` - full editor with radial controls, force nodes, face detection, regions, presets, modulators, and audio spectrogram input.

## Previous

- `1a5dc62b` (2026-04-16) - Dashboard v3 variant with focus-region tabs as the default view. Also available on the `simpler-fork-2026-04-16` branch.
- `ee33effa` (2026-03-13) - lighter build (~41KB) with radial features and image upload. No tensorflow dependency.
- `21bda882` (2026-03-13) - earlier lighter build (~33KB), same family as `ee33effa`.
- `3c8b373f` (2026-02-16) - earliest preserved build. Presets and basic path-finder controls; no radial math.

To roll back, point the production alias at any of these hashes from the Cloudflare dashboard, or redeploy the corresponding tree.
