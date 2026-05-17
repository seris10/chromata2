# Deployment History

A running list of Cloudflare Pages deployments for `chromata-dev`. Older builds remain accessible at `https://<hash>.chromata-dev.pages.dev`.

## Current

- `631c49ea` - active version. Full editor with radial controls, force nodes, face detection, regions, presets, modulators, audio spectrogram input. Fixes a Tweakpane v4 API call (`addSeparator` -> `addBlade`) that crashed the earlier build at the same revision.

## Earlier builds, in reverse order

- `1a5dc62b` (2026-04-16) - Dashboard v3 variant. Focus-region tabs as the default view. Kept on the `simpler-fork-2026-04-16` branch.
- `0d8c4ef6` (2026-04-04) - first Dashboard v3 production deploy.
- `b9b39755` (2026-04-04) - preview: fonts, glow beam, ambient sky, brighter text.
- `146788a3` (2026-03-17) - same revision as `631c49ea` but predates the `addSeparator` fix, so the editor crashes on load. Superseded.
- Various Mar 13-17 preview iterations adding radial math and audio spectrogram.
- Mar 13 production batch (`ee33effa`, `72c53d14`, `65a4deba`, `9f2f67c9`, `21bda882`, `c180c0fd`, and others) - smaller (28-42KB) builds with radial features and image upload, no tensorflow dependencies. Useful as fallbacks.
- `3c8b373f` (2026-02-16) - earliest preserved build. Presets, basic path-finder controls, no radial math.

## Notes

Nothing in this list has been deleted, and the production alias is the only thing that ever moves. If you want to roll back, point `chromata-dev.pages.dev` at any of the hashes above through the Cloudflare dashboard, or redeploy the corresponding tree from git.
