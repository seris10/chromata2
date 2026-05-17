# Modulators

Oscillate any of the main parameters over time. Set up a sine wave on Speed so the animation breathes; sawtooth on Radius for a pulsing orbit; random on Jitter for shimmer.

Up to 8 modulators can run at once.

## Adding a modulator

Click **Add Modulator** in the folder. It creates one bound to Speed by default. Each modulator has its own sub-folder.

## Per-modulator parameters

| Control | Options / Range | Default | What it does |
|---|---|---|---|
| Param | Speed / Line Width / Turning Angle / Line Opacity / Jitter / Sample Size / Radial Strength / Radial Radius / Math Strength | speed | Which parameter to oscillate. |
| Wave | Sine / Triangle / Sawtooth / Square / Random | Sine | Waveform shape. Random samples a new value each cycle. |
| Period | 10 - 10000 | 500 | Length of one cycle, in iterations (not frames). |
| Min | 0 - 100 | 1 | Output low. |
| Max | 0 - 100 | 50 | Output high. |
| Phase | 0 - 1 | 0 | Cycle offset. Use to desync two modulators on related parameters. |
| Enable | bool | on | Disable to pause this modulator without deleting it. |

The sub-folder also has a Delete button.

## Waveform behavior

- **Sine** - smooth, equal time at high and low. Default choice for breathing motion.
- **Triangle** - linear up and down. Sharper peaks than sine, useful when sine feels too soft.
- **Sawtooth** - linear up, instant reset. Creates ramp effects.
- **Square** - hard switch between min and max. Good for stutter effects.
- **Random** - new random value each cycle. Period acts as a refresh rate.

## How values are applied

Different parameters expect different scales. Modulators apply a transform per parameter so the 0-100 sliders mean what you'd expect:

- `turningAngle` is multiplied by π (so the slider works in pi-radian units).
- `lineOpacity` is divided by 100.
- `jitter` is divided by 50.
- `radialStrength` is divided by 100.
- Others pass through unchanged.

## Combining

Stack multiple modulators on different parameters for compound motion. A sine on Speed, a sawtooth on Width, and a square on Radial Strength running at different periods will produce something that never quite repeats.

Pair with [Parameter Ranges](parameter-ranges.md): ranges vary the value across pathfinders, modulators vary it across time. The global value the modulator sets becomes the center point that ranges spread around.
