# Recipes

Parameter combinations that produce specific looks. Start with one of these and tweak from there.

For controls these reference, see [parameters-guide.md](parameters-guide.md), [radial.md](radial.md), [force-nodes.md](force-nodes.md), [natural-math.md](natural-math.md), [audio-input.md](audio-input.md).

## Pencil sketch

```
Display: Color = Greyscale, Key = High, Blend = Darken
Path Finders:
  Opacity %: 35
  Sample: 28
  Jitter %: 20
  Edges %: 70
  Width: 1
  Count: 150
Origins: all four edges
```

The greyscale + darken + high key combination plays well with edge detection. Jitter gives a hand-drawn quality.

## Watercolor

```
Display: Color = Color, Key = Low, Blend = Lighten
Path Finders:
  Opacity %: 30
  Sample: 24
  Jitter %: 8
  Edges %: 0
  Width: 2
  Count: 100
Origins: top + bottom
```

Lighten without edge detection follows brightness gradients smoothly. Low opacity, high count creates the layering.

## Neon glow

```
Display: Color = Color, Key = Low, Blend = Lighten
Path Finders:
  Opacity %: 100
  Sample: 30
  Jitter %: 0
  Edges %: 40
  Width: 3
  Count: 40
Origins: bottom
```

Fully opaque, smooth strokes on dark pixels. Edge bias keeps lines on contours.

## Mandala swirl

```
Origins: center (Custom = "center")
Radial: Enable on, Strength 60, Radius 40, CW 50, Drift 20, On Converge Pulse
Path Finders: Count 80, Speed 6, Opacity 60
```

A breathing radial pattern. Drift slowly tightens the orbit, Pulse bounces back out. Vary Center XY to move the mandala.

## Vortex pulled toward an object

```
Force Nodes: 1 Gravity node at the subject (X/Y to taste), Radius 40, Strength 80, Falloff 60
Path Finders: Count 100, Speed 8, Opacity 50
```

A single strong gravity node pulls paths toward whatever you place it on. Pair with Origin: all-edges so paths come from everywhere and converge.

## Murmuration

Apply the **Murmuration** built-in preset and adjust:

- Lower Separation if you want tighter flocks.
- Higher Cohesion for a single tight school.
- Lower Perception for fragmented sub-flocks.

## Audio-reactive bloom

Apply the **Audio Bloom** built-in preset. Tune:

- Gain higher if the spectrogram is dim. 150 - 200 for quiet sources.
- Smoothing higher for slower, gentler bloom. Lower for percussive snap.
- Radial Strength higher to constrain the bloom inside the boundary.

## Flow Field tributaries

Apply the **Flow Rivers** built-in preset. Tune:

- Scale smaller for tighter swirls (more turbulent).
- Octaves up to 2 - 3 for more detail at small scales.
- Evolution > 0 if you want the field itself to drift over time.
