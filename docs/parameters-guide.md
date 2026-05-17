# Parameters Guide

The basic controls that every effect uses, covering the Display, Path Finders, and Origins folders. For specialty systems (radial, force nodes, math, audio, regions), see the individual docs linked from [the index](index.md).

## Controls

The Controls folder has the basics: Start, Pause / Resume, Reset, the status readout, and a Tooltips toggle that turns on hover help across the whole sidebar. Turn tooltips on while you're learning the controls and off when you have them memorized.

## Display

How the canvas looks and how new strokes blend with old ones.

| Control | Type | Default | What it does |
|---|---|---|---|
| Color | Color / Greyscale | Color | Color preserves RGB from the source. Greyscale converts to luminance. |
| Key | Low / High | Low | Low = pathfinders seek dark pixels. High = pathfinders seek bright pixels. |
| Line | Smooth / Square / Point / Pixel Grid | Smooth | Smooth = Bezier curves. Square = straight segments. Point = dots at each step. Pixel Grid = mosaic of color-averaged cells. |
| Pixel Size | 2 - 50px | 8 | Only visible with Line = Pixel Grid. Smaller = more detail, larger = chunkier mosaic. |
| Blend | 16 composite modes | Lighten | Standard Canvas 2D composite modes. Lighten brightens, Multiply darkens, Screen adds light. |
| Size | Container / Original | Container | Container fits to the panel. Original uses native image resolution (can be large). |
| BG Color | color picker | #000000 | Canvas background color. Only visible when BG Alpha > 0. |
| BG Alpha % | 0 - 100 | 0 | Background opacity. 0 = transparent. |

## Path Finders

The core motion parameters. These have the biggest visual effect.

| Control | Range | Default | What it does |
|---|---|---|---|
| Count | 1 - 5000 | 27 | Number of pathfinders. More = denser coverage but slower. |
| Speed | 1 - 100 | 8 | Distance each pathfinder steps per frame. Higher = longer lines, faster exploration, less fine detail. |
| Width | 0.5 - 100 | 2 | Line thickness. |
| Angle (xPi) | 0.01 - 3 | 1.0 | Arc width scanned for the next pixel, in multiples of pi radians. Higher = wider turns, more organic curves. Lower = straighter lines. |
| Sample | 2 - 64 | 16 | Points sampled within the scanning arc. Higher = smoother direction choices, slightly slower. |
| Opacity % | 1 - 100 | 100 | Line transparency. Lower = subtler, more layered. |
| Jitter % | 0 - 100 | 0 | Random wobble added to heading each frame. Higher = shakier paths. Zero = smooth. |
| Edges % | 0 - 100 | 0 | Blend between original image and edge-detected version. Higher = paths follow contours more. |
| Alpha | 1 - 255 | 255 | Minimum pixel opacity to be traversable. Lower = paths enter semi-transparent areas. |
| Limit | 0 - 50000 | 0 | Stop after this many steps. 0 = unlimited. |
| Steps/Frame | 1 - 20 | 1 | Draw steps per animation frame. Higher = faster animation at same FPS. |
| Seed | text | empty | Fixed random seed for reproducible runs. Empty = random each run. |

A useful trick: high Count + low Opacity gives natural density variation. The image emerges from the build-up rather than from any single stroke.

## Origins

Where pathfinders spawn. Multiple can be on at once. They mix.

| Control | What it does |
|---|---|
| Bottom | Spawn along the bottom edge, moving upward. |
| Top | Spawn along the top edge, moving downward. |
| Left | Spawn along the left edge, moving right. |
| Right | Spawn along the right edge, moving left. |
| Custom | Comma-separated custom spawn points. Examples: `center`, `top-left`, `bottom-right`, `25% 75%`. |

For the percentage-weighted version of this UI, see [origin-selector-ui-spec.md](origin-selector-ui-spec.md).

## Monitor

Read-only telemetry: FPS, iteration count, active pathfinder count, coverage percentage, and a status line. Always-on, no configuration. Use it to spot when you've cranked Count high enough that FPS is dropping or when coverage has plateaued and there's no point letting the animation continue.
