# Parameter Ranges

Per-pathfinder variation. Instead of a single value for Speed (say 8), you can give it a range of 1 - 50, and each pathfinder gets a random value from that range when it's created.

The visual effect is layering: slow pathfinders draw broad strokes that linger, fast pathfinders dart across, all on the same canvas.

## How to use it

Open the Parameter Ranges folder. There's a sub-folder for each parameter that supports a range. In each:

| Control | What it does |
|---|---|
| Range | Toggle. When off, the global value is used. When on, each pathfinder samples from min - max. |
| Min | Lower bound. |
| Max | Upper bound. |

Ranges are evaluated at spawn time. Existing pathfinders keep their assigned values; new ones get newly-sampled values. If you change the range, hit Reset to re-spawn.

## Parameters that support ranges

| Parameter | Min - Max | Notes |
|---|---|---|
| Speed | 1 - 100 | Mixed-speed flocks. Slow draws, fast explores. |
| Width | 0.5 - 100 | Thick and thin strokes simultaneously. |
| Angle (turningAngle) | 0.01 - 3 | Some pathfinders curve a lot, others almost straight. |
| Jitter | 0 - 100 | Mix of smooth and shaky paths. |
| Opacity | 1 - 100 | Bold and subtle strokes layered. |
| Sample | 2 - 64 | Coarse and fine sampling together. |
| Rad Strength | 0 - 100 | Some pathfinders tightly orbit, others loose. |
| Rad Radius | 1 - 100 | Multi-ring radial patterns. |

## Combining

Ranges combine well with [Modulators](modulators.md). Ranges spread values across pathfinders (spatial variation); modulators sweep the global value over time (temporal variation). Both at once gives a population whose distribution shifts as the animation runs.
