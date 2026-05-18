# Chromata

A custom build of [Chromata](https://github.com/michaelbromley/chromata) by Michael Bromley. Chromata seeds path finders on a canvas; each one reads pixel colors and traces its own way across the image, gradually redrawing it as an animated artwork.

I added many 

Live: https://chromata-dev.pages.dev

## What this build adds

The editor at `index.html` extends the upstream library with:

- **Wider ranges** for Chromata's defaults
- **Jitter:** Adds slight random fluctuations to pathfinder movements; can be useful if you see limited activity.
- **Edges:** Not working properly.
- **Steps per Frame:** Decrease the time it takes to generate your image without the side effects of increasing pathfinder speed
- **Blend Effects** (color burn, saturation, luminosity, etc.)
- **Saveable Presets:** Fractal, Lines, Impressionism, Geometry, Halftone, Neon, Pixel, Sketch) plus user presets
- **Real-Time Configuration** The ability to modify settings during a run and have them take affect in real time
- **Dynamic Presets:** Click the record button and modify presets while generation is running to save single-run dynamic effects
- **Radial Mode:** path-finder math (strength, radius, direction, drift, convergence behavior, center point)
- **Natural Math:** Fibonacci Spiral, Euler Spiral, LissaJous, Lorenz Attractor, Flow Field, Boids Flocking, L-System Branch
- **Force Nodes:** Gravity & vortex for attractors, repulsion & directional for repellers; Tweakpane folder for live tuning
- Face detection via [`@vladmandic/face-api`](https://github.com/vladmandic/face-api), biasing path finders toward detected faces
  - *NOTE: trying to get faces draw more naturally without too much divergence from background, doesn't work well yet. May have more luch with force nodes manual overrides.*
- Region constraints
- Parameter modulators for time-varying values
- Live audio spectrogram input from mic or file, mapping frequency to hue so path finders draw the shape of sound
  - *NOTE: Untested*

---

## Plans
- **Desktop Apps:** MacOs, Windows, & Linux apps, allowing for local use, persistent local saves
- **Website Expansion:** Library to share presets, creations, and a community forum for discussion
- **UI/UX Customization:** Colors, fonts, show/hide/favorite & reorder config sidebar, dropdown,slider, checkbox styles
- **Image Preprocessing:** Image size and type conversion pre-processing for more consistent image-to-image results
- **Stock Presets:** Various small improvements planned for all, plus ability to remove unwanted options from list. Some larger planned improvements include:
  - **Pixel Generator:** Expanding configuration options, (limited) object detection for more adaptive behavior in complex images, & improving math to develop into a more robust image-to-pixel generator
  - **Impressionism:** Extracting large datasets from visual analysis tools (no-AI) applied to impressionist works to improve math; addition of brush-stroke-like effects
- **User Presets:** Within app search of community presets
- **Natural Math:** Adding more options, plus tightening the execution of these effects for more representative output, especially in combination with other parameters.
- **Force Nodes:** adding more visual feedback for placement and constraints of force nodes and natural math; possibly drag-and-drop functionality

---

## Bigger Plans
I am working on a desktop app that I'm very excited about. It functions somewhat like a slideshow maker and makes for beautiful displays. Features will include (non-exhaustive):
- **Text Editing** Ability add and place text via coordinates, sliders, or drag-and-drop, and edit fade-in fade-out effects and timing
- **Seamless Transitions** Customizable transitions from one image to the next, with continuous pathfinder drawing and the ability to set custom behavior to each image
- **Audio:** Add audio

---

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

The editor has a lot of controls. I plan on adding a wiki-style guide, a help-menu in app, and a place accessible via the site to share custom presets. Each folder of the sidebar has its own doc page in [`docs/`](docs/index.md):

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
