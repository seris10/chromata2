# Chromata

A custom build of [Chromata](https://github.com/michaelbromley/chromata) by Michael Bromley. Chromata seeds path finders on a canvas; each one reads pixel colors and traces its own way across the image, gradually redrawing it as an animated artwork.

Live: https://chromata-dev.pages.dev

## What this build adds

The editor at `index.html` extends the upstream library with:

- Radial path-finder math (strength, radius, direction, drift, convergence behavior, center point)
- Force nodes (attractors and repellers) with a Tweakpane folder for live tuning
- Face detection via [`@vladmandic/face-api`](https://github.com/vladmandic/face-api), biasing path finders toward detected faces
- Region constraints
- Saveable presets (Fractal, Lines, Impressionism, Geometry, Halftone, Neon, Pixel, Sketch) plus user presets
- Parameter modulators for time-varying values
- Live audio spectrogram input from mic or file, mapping frequency to hue so path finders draw the shape of sound
- Drag-and-drop image loader

The UI uses [Tweakpane v4](https://tweakpane.github.io/docs/).

## Running it

`index.html` is self-contained and pulls its dependencies from CDN. You can usually just open it:

```
open index.html
```

If your browser blocks canvas reads over `file://`, serve it instead:

```
python3 -m http.server 8000
```

## Deploying

The site is hosted on Cloudflare Pages under the project `chromata-dev`. To redeploy:

```
wrangler pages deploy . --project-name chromata-dev --branch=main
```

The `--branch=main` flag matters. Without it, Wrangler uses the current local git branch and the deploy ends up in the Preview environment instead of replacing production.

## Layout

```
.
├── index.html                  Main editor
├── chromata-custom.js          Customized library
├── chromata.min.js             Minified upstream build
├── chromata-reference.json     Parameter reference data
├── dashboard.html              Alternate dashboard view
├── docs/                       Specs and parameter reference
├── backups/                    Prior versions of root files
├── src/                        Source files
├── original/                   Upstream Chromata source
└── experiments/                Separate Webpack 5 build
```

## Branches

- `master` is the active line.
- `simpler-fork-2026-04-16` is a Dashboard v3 tabbed-layout variant kept around for reference.

## License

MIT, same as upstream. See `original/README.md`.
