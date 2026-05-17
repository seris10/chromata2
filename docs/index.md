# Chromata Docs

Reference for the custom Chromata editor. Each page covers one folder of the Tweakpane sidebar.

## Core

- [Parameters Guide](parameters-guide.md) - Display, Path Finders, Origins. The basics every effect uses.
- [Presets](presets.md) - Built-in presets, user presets, Quick States, Dynamic Presets (keyframe recording).
- [Recipes](recipes.md) - Parameter combos for common looks.

## Motion systems

- [Radial](radial.md) - Make pathfinders orbit in circles. Strength, drift, convergence behavior.
- [Force Nodes](force-nodes.md) - Attractors, repellers, vortices, directional pushers. Click-to-place and Auto-Arrange.
- [Natural Math](natural-math.md) - Euler spirals, Lissajous, Lorenz attractor, Flow Field, Boids flocking, L-System branching.

## Image awareness

- [Face Detection](face-detection.md) - Pull pathfinders toward detected facial landmarks.
- [Focus](focus.md) - Manual or face-driven focus region.
- [Regions](regions.md) - DeepLab v3 semantic segmentation. Per-region parameter overrides.

## Variation

- [Parameter Ranges](parameter-ranges.md) - Spread a parameter across pathfinders (some fast, some slow).
- [Modulators](modulators.md) - Oscillate any parameter over time. Sine, triangle, sawtooth, square, random.

## I/O

- [Audio Input](audio-input.md) - Use a microphone or audio file as the source image. Frequency drives hue.
- [Export](export.md) - PNG, video (WebM), SVG.

## Operations

- [Origin Selector UI Spec](origin-selector-ui-spec.md) - Design spec for the percentage-based origin allocator.
- [Deployment History](deployments-history.md) - Notable past builds.
