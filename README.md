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

## Quick start

1. Drop an image onto the canvas area (or click to pick one).
2. Open the **Presets** folder and click one of the built-in presets to see how it looks: try **Neon** for bold color, **Sketch** for pencil-like greyscale, or **Murmuration** for flocking motion.
3. Click **Start** in the Controls folder. Adjust **Count**, **Speed**, **Width**, and **Opacity** in Path Finders to taste.

For the complex systems (radial orbits, force nodes, audio-reactive input, semantic regions, parameter modulators), read the per-folder docs in [`docs/`](docs/index.md).

## Hosting

It's a single HTML file with vendored JavaScript and no build step, so any static host works (Cloudflare Pages, Netlify, GitHub Pages, an S3 bucket, etc.). Just upload the repo root.

## Documentation

The editor has a lot of controls. Each folder of the sidebar has its own doc page in [`docs/`](docs/index.md):

- [Parameters Guide](docs/parameters-guide.md) - basics (Display, Path Finders, Origins)
- [Radial](docs/radial.md), [Force Nodes](docs/force-nodes.md), [Natural Math](docs/natural-math.md) - motion systems
- [Face Detection](docs/face-detection.md), [Focus](docs/focus.md), [Regions](docs/regions.md) - image-aware behavior
- [Parameter Ranges](docs/parameter-ranges.md), [Modulators](docs/modulators.md) - per-pathfinder and time-based variation
- [Audio Input](docs/audio-input.md), [Export](docs/export.md) - I/O
- [Presets](docs/presets.md), [Recipes](docs/recipes.md) - configurations and starting points

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
