# Force Nodes

Drop attractors, repellers, vortices, and directional pushers anywhere on the canvas. Each node defines a circular field that steers pathfinders that pass through it.

Force nodes stack with each other and with the [radial](radial.md) and [natural math](natural-math.md) systems. You can have many; performance permitting.

## Node types

- **Gravity** - pulls pathfinders toward the center.
- **Repulsion** - pushes pathfinders away from the center.
- **Vortex** - sends pathfinders orbiting tangentially. Direction is clockwise (0) or counterclockwise (180).
- **Directional** - pushes pathfinders along a fixed compass heading. Direction is 0 = right, 90 = down, 180 = left, 270 = up.

Add a node by clicking **+ Gravity**, **+ Repulsion**, **+ Vortex**, or **+ Directional** at the top of the folder. Each new node gets its own subfolder for tuning.

## Per-node parameters

| Control | Range | Default | What it does |
|---|---|---|---|
| Type | Gravity / Repulsion / Vortex / Directional | (varies) | Change a node's type without re-creating it. |
| X % | 0 - 100 | 50 | Horizontal position. |
| Y % | 0 - 100 | 50 | Vertical position. |
| Radius % | 1 - 100 | 15 | Field size, as percentage of half the smaller image dimension. |
| Strength % | 1 - 100 | 50 | How strongly the field steers pathfinders. |
| Ring % | 0 - 95 | 0 | Hollows out the center to create a donut field. 0 = solid disc. 95 = thin ring. |
| Falloff % | 0 - 100 | 50 | How far the force extends past the node edge. Higher = broader reach. |
| Direction | 0 - 360 | 0 | Vortex: CW (0) to CCW (180). Directional: compass heading. Shown only for those two types. |
| Orbit % | 0 - 50 | 0 | The node center itself moves in a circle of this radius. 0 = stationary. |
| Orbit Spd % | 1 - 100 | 10 | How fast the node orbits its origin. |
| Pulse Hz | 0 - 2 | 0 | Strength oscillates sinusoidally at this frequency. 0 = constant strength. |
| Brightness | Off / Bright / Dark | Off | Modulate strength by pixel brightness under the node. Bright = stronger over bright pixels, Dark = the opposite. |

Each node subfolder has a **Remove** button.

## Click-to-Place

Instead of typing X/Y values, click a node type's button, then click on the canvas where you want it. The cursor changes to a crosshair while placement is active.

You can also click and drag an existing node on the canvas to reposition it.

## Auto-Arrange

Click **Generate** to replace the current node set with an arrangement based on:

| Control | Options / Range | Default | What it does |
|---|---|---|---|
| Count | 2 - 20 | 6 | How many nodes to generate. |
| Pattern | Ring / Golden Spiral / Grid / Hex Grid | Ring | Layout shape. |
| Type | All Gravity / All Repulsion / All Vortex / Alternating G/R | All Gravity | What type to assign each generated node. Alternating creates a push/pull lattice. |
| Radius % | 5 - 50 | 30 | Spread of the arrangement (cluster size). |

Generate is destructive: it replaces all existing force nodes. Save your current config as a preset first if you want to keep it.
