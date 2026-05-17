# Radial

Make pathfinders orbit in circles instead of just wandering. Useful for anything with a clear focal point: portraits, mandalas, vortex effects, anything where the energy should rotate around something.

Turn on with **Enable**. Without it, none of the rest of this folder matters.

## How it works

Each affected pathfinder is steered toward a circle of a given radius around a given center. Strength controls how aggressively they're pulled onto that circle. Once on the circle, they orbit; direction is split between clockwise and counterclockwise according to CW.

If Drift is non-zero, the orbit gradually tightens (the radius shrinks over time). When a pathfinder hits Min Radius, the On Converge setting decides what happens next.

## Parameters

| Control | Range | Default | What it does |
|---|---|---|---|
| Enable | bool | off | Master toggle. |
| Strength % | 0 - 100 | 50 | How tightly paths follow the circle. Higher = tighter orbits. Lower = loose, organic curves that gradually return to circle. |
| Radius % | 1 - 100 | 40 | Target circle size, as percentage of half the smaller image dimension. |
| CW % | 0 - 100 | 50 | Portion going clockwise. 100 = all CW, 0 = all CCW, 50 = mixed swirl. |
| Bound % | 0 - 100 | 100 | Portion of pathfinders affected. Lower = more paths ignore the radial bias. |
| Center X % | 0 - 100 | 50 | Horizontal position of orbit center. 0 = left edge. |
| Center Y % | 0 - 100 | 50 | Vertical position of orbit center. 0 = top edge. |
| Drift | 0 - 100 | 0 | Spiral tightening speed. 0 = fixed orbit. Higher = pathfinders spiral inward. |
| Drift Spread | 0 - 100 | 100 | How much Drift varies between pathfinders. 100 = full gradient (some spiral fast, some slow). 0 = all spiral at the same rate. |
| On Converge | Stick / Pulse / Explode | Stick | What happens when a pathfinder reaches Min Radius. |
| Min Radius % | 1 - 50 | 5 | Inner boundary that triggers convergence behavior. |

## On Converge options

- **Stick** - the pathfinder keeps orbiting at the minimum radius. Use for accumulating density at the center.
- **Pulse** - bounces back outward, then spirals in again. Creates a breathing effect.
- **Explode** - breaks free of radial entirely, resuming normal pathfinding. Creates a burst pattern as paths leave the spiral.

## Common patterns

A loose surrounding swirl: Strength 30, Radius 60, CW 50, Drift 0. Paths circle the subject without converging.

A tight vortex pulling toward center: Strength 70, Radius 50, Drift 40, Min Radius 5, On Converge Stick. Paths spiral in and pile up.

A breathing mandala: Strength 60, Radius 40, Drift 20, On Converge Pulse. Density oscillates between center and outer ring.

A center-out burst: Center XY at the subject, Strength 80, Drift 60, On Converge Explode. Paths converge, then spray outward following the image.
