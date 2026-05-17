# Presets

Four related systems live in the Presets folder.

## Built-in presets

Buttons that apply a fixed configuration. Click one and the whole sidebar (display, path finders, origins, radial, force nodes, math mode, audio, focus) snaps to that preset.

### Classic looks

| Preset | What you get |
|---|---|
| **Fractal** | Default-ish: smooth color paths from the bottom. 27 finders, lighten blend. |
| **Lines** | Tight square strokes from top and bottom, 50 finders, narrow turning angle. Graphic. |
| **Impressionism** | 100 point-mode finders from all four edges. Dabs of color. |
| **Geometry** | High key, square mode, wide turning angle. Architectural. |
| **Halftone** | Greyscale point mode from left + right, 80 finders, wide angle. Print-like. |
| **Neon** | Color smooth, high speed, 40 finders, narrow angle. Glowing line work. |
| **Pixel** | Pixel-grid mode (8px cells), source-over blend, 60 finders. Mosaic. |
| **Sketch** | Greyscale smooth, darken blend, high key, 150 finders from all four edges. Pencil. |

### Natural math presets

| Preset | Mode | What you get |
|---|---|---|
| **Fibonacci Sunflower** | Fibonacci | 200 paths spiraling from center along the golden angle. |
| **Euler Ferns** | Euler | 100 paths from bottom, winding up. |
| **Lissajous Weave** | Lissajous | 50 paths from center, 3:2 frequency ratio. |
| **Chaos Butterfly** | Lorenz | 100 paths from center, butterfly cloud. |
| **Flow Rivers** | Flow Field | 500 paths from left side moving through Perlin currents. |
| **Murmuration** | Boids | 300 flocking paths from top and bottom. |
| **Coral Growth** | L-System | 8 paths from bottom that recursively branch. |

### Audio presets

All three turn on audio input with Frequency Hue color map.

| Preset | What you get |
|---|---|
| **Audio Rivers** | Flow Field math + audio. Paths swirl through music. |
| **Audio Bloom** | Radial bound + audio. Sound pulses inside a circular boundary. |
| **Audio Pulse** | Lorenz chaos + audio at heat color map. Glitchy, percussive. |

## My Presets

Save the current configuration as a named preset:

1. Type a name into **Name**.
2. Click **Save Current**.

Saved presets appear in a Saved sub-folder, each with **Load** and **Delete** buttons. Storage is browser localStorage (key: `chromata-presets-v2`), so they survive page reload but not cross-browser.

Saving captures everything: display, path finders, origins, radial, focus, force nodes, math, audio. A loaded preset reproduces the exact state.

## Quick States

Session-only snapshots, max 10. Useful for A/B comparing tweaks without naming and saving each one.

Click **Save State**, the state is appended to the list with an auto-generated label. Each saved state gets Load and Delete buttons. The list clears on page reload.

When you're done iterating and want to keep a state, save it as a named My Preset.

## Dynamic Presets

Recording and playback of parameter changes over time. Instead of one snapshot, you record a sequence of keyframes; playback interpolates between them so the animation evolves automatically.

Each Dynamic Preset has:

- A name.
- A list of keyframes, each tagged with an iteration count.
- A Timeline view (when expanded) showing each keyframe with its parameters and the option to delete or re-order.

Use Dynamic Presets for:

- Animated parameter sweeps for video export.
- Effects that build up gradually (start sparse, end dense).
- Reproducible motion that's more complex than a single Modulator can express.
