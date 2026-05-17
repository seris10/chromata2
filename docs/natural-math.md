# Natural Math

Layer mathematical motion on top of the normal pathfinding. Each mode replaces the steering decision with a different formula; the pathfinders still read pixel colors, but their direction is now driven by the math.

Pick a mode from the **Mode** dropdown. Only that mode's sub-folder is visible at a time.

## Global

| Control | Range | Default | What it does |
|---|---|---|---|
| Mode | None / Fibonacci Spiral / Euler Spiral / Lissajous / Lorenz Attractor / Flow Field / Boids Flocking / L-System Branch | None | Master switch. None = use normal pathfinding. |
| Strength | 0 - 100 | 50 | Blend between the math direction and the normal pathfinding direction. 0 = math has no effect. 100 = pathfinder ignores image. |
| Center X % | 0 - 100 | 50 | Some modes need an origin point (spirals, Lissajous, Lorenz). |
| Center Y % | 0 - 100 | 50 | Same. |

## Modes

### Fibonacci Spiral

No mode-specific parameters. Pathfinders trace the seed pattern of a sunflower head: dense at center, golden-angle distributed.

Best with **Origin: center**, high Count (~200), low Width.

### Euler Spiral

A curve where curvature increases linearly with arc length. Looks like a fern or a wave that gets tighter.

| Control | Range | Default | What it does |
|---|---|---|---|
| Curvature Rate | 1 - 100 | 30 | How fast curvature builds. Higher = tighter quicker. |
| Curvature Max | 1 - 100 | 50 | Cap on curvature. Stops the spiral collapsing into a point. |

### Lissajous

Classic XY oscillation. Different frequency ratios make different braided shapes.

| Control | Range | Default | What it does |
|---|---|---|---|
| Freq X | 1 - 8 | 3 | Horizontal frequency. |
| Freq Y | 1 - 8 | 2 | Vertical frequency. |
| Rate | 1 - 100 | 50 | Animation speed through the curve. |

3:2 and 5:4 are good starting ratios. Identical X/Y collapses to a line.

### Lorenz Attractor

The chaos one. Trajectories diverge sensitively; you get butterfly-shaped clouds.

| Control | Range | Default | What it does |
|---|---|---|---|
| Chaos (rho) | 1 - 100 | 28 | The rho parameter of the Lorenz system. 28 is the famous chaotic value. Below ~25 the system stops being chaotic. |
| Time Step | 1 - 100 | 50 | Integration step size. Higher = more visible jumps, less smooth. |

### Flow Field

Pathfinders read direction from a Perlin noise field. Looks like wind currents or magnetic field lines.

| Control | Range | Default | What it does |
|---|---|---|---|
| Scale | 1 - 100 | 30 | Noise field scale. Smaller = tighter swirls. Larger = broader flow. |
| Evolution | 0 - 100 | 0 | Field changes over time. 0 = static field. |
| Octaves | 1 - 4 | 1 | Layers of noise. More octaves = more detail at small scale. |

High Count (500+) along Origin: left is classic flow-field territory.

### Boids Flocking

Pathfinders read each other's headings and group up. Three steering rules combined.

| Control | Range | Default | What it does |
|---|---|---|---|
| Separation | 0 - 100 | 70 | Avoid crowding nearby neighbors. |
| Alignment | 0 - 100 | 50 | Match heading with nearby neighbors. |
| Cohesion | 0 - 100 | 30 | Steer toward the local center of mass. |
| Perception | 1 - 100 | 50 | How far a pathfinder sees its neighbors. |

300+ pathfinders make convincing flocks. Tune Separation high to keep paths from clumping.

### L-System Branch

Each pathfinder periodically forks into two. Tree-like recursive growth.

| Control | Range | Default | What it does |
|---|---|---|---|
| Branch Interval | 10 - 200 | 60 | Steps between branch events. |
| Branch Angle ° | 1 - 90 | 25 | Angle between the two child branches. |
| Generations | 1 - 6 | 4 | Max recursion depth. More = denser tree. Watch the pathfinder count blow up. |

Start with low Count (8 - 20). Each generation multiplies that. 8 starting paths over 4 generations is already 128 active branches.
