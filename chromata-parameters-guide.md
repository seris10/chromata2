# Chromata Parameters Guide

Reference for the path-tracing visual effects parameters.

---

## Line Cap

**Type:** Dropdown
**Options:** `butt`, `round`, `square`
**Default:** `round`

**What it does:** Controls the shape of line endpoints. This is a standard Canvas 2D `lineCap` property.

| Value | Effect |
|-------|--------|
| `butt` | Flat edge, ends exactly at the endpoint |
| `round` | Semicircular cap extends past endpoint |
| `square` | Rectangular cap extends past endpoint |

**Best use cases:**
- `round` - Smooth, organic effects; default for most artistic styles
- `square` - Geometric, pixel-art, or architectural looks
- `butt` - When precise line termination matters

---

## Line Opacity

**Type:** Slider
**Range:** 0 - 1
**Default:** 1

**What it does:** Controls transparency of drawn lines. Applied to each stroke's RGBA alpha channel.

**Effect on image:**
- `1.0` - Fully opaque lines, bold strokes
- `0.5` - Semi-transparent, lines layer and blend naturally
- `0.1-0.3` - Very subtle, requires many passes to build up

**Best use cases:**
- **High (0.8-1.0):** Bold graphic effects, neon looks
- **Medium (0.4-0.7):** Watercolor/wash effects, natural layering
- **Low (0.1-0.3):** Pencil sketch buildup, subtle textures, atmospheric effects

**Tip:** Lower opacity + higher pathfinder count creates natural density variation.

---

## Sample Size

**Type:** Slider
**Range:** 2 - 32
**Default:** 16

**What it does:** Number of directions tested within the turning arc when deciding where to go next. The pathfinder samples an arc ahead and picks the best color match.

**Effect on image:**
- **High (24-32):** Smoother, more accurate path following; paths flow naturally along contours
- **Medium (12-20):** Balanced smoothness and performance
- **Low (2-8):** Angular, choppy paths; more unpredictable/chaotic movement

**Best use cases:**
- **High:** Portraits, detailed images where paths should follow features precisely
- **Medium:** General purpose, good default
- **Low:** Abstract effects, glitch aesthetics, intentionally rough looks

**Performance note:** Higher values = more calculations per frame.

---

## Path Memory

**Type:** Slider
**Range:** 1 - 50+
**Default:** 10

**What it does:** Number of recent positions remembered by each pathfinder. Used for backtracking when stuck and for smooth curve rendering.

**Effect on image:**
- **High (20+):** Longer "memory" allows smoother bezier curves and better recovery from dead ends
- **Medium (5-15):** Balanced behavior
- **Low (1-3):** Short memory, more erratic behavior, paths don't smooth as well

**Best use cases:**
- **High:** Flowing, continuous strokes; calligraphy effects
- **Low:** Stippled, fragmented effects; when you want paths to restart frequently

---

## Jitter

**Type:** Slider
**Range:** 0 - 2
**Default:** 0

**What it does:** Adds random wobble to path direction. Applied as: `angle += (random - 0.5) * jitter * π`

**Effect on image:**
- `0` - Perfectly smooth, algorithmic paths
- `0.1-0.3` - Subtle hand-drawn feel, natural variation
- `0.5-1.0` - Obvious wobble, sketchy/nervous line quality
- `1.5+` - Chaotic, scribble-like paths

**Best use cases:**
- **None (0):** Clean digital effects, geometric patterns
- **Subtle (0.1-0.2):** Pencil/pen sketch simulation, organic feel
- **Medium (0.3-0.5):** Charcoal, rough sketch effects
- **High (0.8+):** Scribble effects, intentionally messy/energetic looks

**Tip:** Combine with low line opacity for realistic pencil crosshatching.

---

## Edge Detect

**Type:** Slider
**Range:** 0 - 1
**Default:** 0

**What it does:** Applies Sobel edge detection preprocessing. Blends edge-detected version with original image before pathfinding begins.

**Effect on image:**
- `0` - Original image, paths follow color gradients
- `0.3-0.5` - Subtle edge emphasis, paths attracted to contours
- `0.7-0.9` - Strong edge following, sketch-like results
- `1.0` - Pure edges only, very high contrast

**Best use cases:**
- **Off (0):** Painterly effects, color-based flow
- **Low (0.2-0.4):** Enhanced contour following while preserving color info
- **Medium (0.5-0.7):** Sketch/illustration effects, architectural drawings
- **High (0.8-1.0):** Line art, technical illustration, coloring book style

**Critical for:** Pencil sketch effects. Without edge detection, paths follow brightness gradients. With it, they follow actual contours.

---

## Edge Strength

**Type:** Slider
**Range:** 0.5 - 3
**Default:** 1

**What it does:** Intensity multiplier for edge detection. Only applies when Edge Detect > 0.

**Effect on image:**
- `0.5` - Subtle edges, only strongest contours detected
- `1.0` - Normal edge detection
- `2.0+` - Amplified edges, picks up fine details and noise

**Best use cases:**
- **Low (0.5-0.8):** When image is noisy or you only want major contours
- **Normal (1.0):** General purpose
- **High (1.5-2.5):** When source image has subtle edges you want to emphasize

**Tip:** If getting too much noise, reduce Edge Strength rather than Edge Detect.

---

## Steps/Frame

**Type:** Slider
**Range:** 1 - 20
**Default:** 1

**What it does:** Decouples visual animation speed from tracing accuracy. Each animation frame, pathfinders take this many steps before rendering updates.

**Effect on image:**
- `1` - Smooth animation, watch paths grow in real-time
- `5-10` - Faster visual progress, still animates
- `15-20` - Very fast, nearly instant results

**Best use cases:**
- **Low (1-2):** When you want to watch the effect develop; presentations, demos
- **Medium (5-10):** Balance between speed and enjoyment
- **High (15-20):** Production use when you just want the final result quickly

**Technical note:** `speed=3 + stepsPerFrame=6` gives visual movement of 18px/frame but maintains 3px tracing precision.

---

## Parameter Combinations

### Pencil Sketch
```
Line Opacity: 0.3-0.5
Sample Size: 24-32
Path Memory: 15-20
Jitter: 0.15-0.25
Edge Detect: 0.6-0.8
Edge Strength: 1.0-1.5
```

### Watercolor
```
Line Opacity: 0.2-0.4
Sample Size: 20-28
Path Memory: 10-15
Jitter: 0.05-0.1
Edge Detect: 0
Edge Strength: N/A
```

### Neon Glow
```
Line Opacity: 1.0
Sample Size: 28-32
Path Memory: 20+
Jitter: 0
Edge Detect: 0.3-0.5
Edge Strength: 1.5
```

### Rough Sketch / Charcoal
```
Line Opacity: 0.4-0.6
Sample Size: 8-12
Path Memory: 5-8
Jitter: 0.4-0.6
Edge Detect: 0.5-0.7
Edge Strength: 1.0
```

---

*Reference: chromata-reference.json | kjr 2026-02-11*
