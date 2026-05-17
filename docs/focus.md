# Focus

Bias where pathfinders spawn and what they're drawn to. Works either with auto-detected faces or as a manual rectangle.

## Quick path

1. Load image.
2. Click **Detect Faces** (uses face-api, see [face-detection.md](face-detection.md)).
3. Toggle **Focus** on.
4. Tune **Density %** and **Gravity %** until you like the bias.

## Parameters

| Control | Range | Default | What it does |
|---|---|---|---|
| Focus | bool | off | Master toggle. Without it, the focus folder values are ignored. |
| Detect Faces | button | - | Runs face detection on the current image. See [face-detection.md](face-detection.md). |
| Density % | 0 - 100 | 50 | Portion of pathfinders that spawn at focal landmarks (rather than at edges). Higher = more paths originate on the face. |
| Gravity % | 0 - 100 | 10 | Attraction strength toward facial landmarks for the affected pathfinders. Higher = paths orbit eyes, trace jawlines, follow lips. |
| Detected | readonly | None | Number of detected faces, updated by face detection. |

## Manual Override

If face detection misses, or you want focus on something non-facial (a flower, an object), open the Manual Override sub-folder and set a rectangle by hand.

| Control | Range | Default | What it does |
|---|---|---|---|
| Focus X % | 0 - 100 | 50 | Horizontal center of the focus rectangle. |
| Focus Y % | 0 - 100 | 40 | Vertical center. |
| Width % | 1 - 100 | 30 | Rectangle width. |
| Height % | 1 - 100 | 30 | Rectangle height. |

Manual values are always available; face detection overrides them when faces are found.

## Notes

- Focus and [Regions](regions.md) are independent. Focus controls *where pathfinders start and what pulls them*; regions control *per-pixel parameter overrides*. Use both for sharp portraits in painterly backgrounds.
- For finer per-feature control (orbit just the left eye, push paths away from the mouth), use [Force Nodes](force-nodes.md) instead. Detect Faces first to get the landmark coords, then place gravity/repulsion nodes by eye.
