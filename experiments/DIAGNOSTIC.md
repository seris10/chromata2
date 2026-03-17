# Chromata Experiments - Comprehensive Failure Diagnostic

## Executive Summary

**Status**: Complete failure - every modified function is worse or non-functional
**User Assessment**: "Unrecognizable" output, worse than original in every way
**Evidence**: 128 seconds produces messy black scribbles vs 60 seconds of beautiful colored trails

---

## Critical Failures (Ranked by Severity)

### 1. **BROKEN: Color Distance Calculation** (Severity: CRITICAL)
**File**: `pathFinder.js` lines 222-231
**Problem**: Changed from simple single-channel RGB to complex perceptual calculations
**Impact**: Path-finders can't find correct paths because color matching is broken

**Original (WORKING)**:
```javascript
_getColorDistance(pixel) {
    return MAX - pixel[this.rgbIndex];  // Simple, fast, WORKS
}
```

**Modified (BROKEN)**:
```javascript
_getColorDistance(pixel) {
    if (this.colorMode === 'lab') {
        const pixelLab = ColorSpace.rgbToLab(pixel[0], pixel[1], pixel[2]);
        return ColorSpace.deltaE(this.targetColorLab, pixelLab);
    } else if (this.colorMode === 'weighted') {
        return ColorSpace.weightedDistance(this.targetColor, [pixel[0], pixel[1], pixel[2]]);
    } else {
        return MAX - pixel[this.rgbIndex];
    }
}
```

**Why It's Broken**:
- LAB/weighted distance returns DIFFERENT scale than original (not 0-255)
- comparatorFn logic expects specific range
- Path-finders make wrong decisions about which pixel is "closer"
- Results in random wandering instead of following image structure

---

### 2. **BROKEN: Greyscale Rendering** (Severity: CRITICAL - Visible)
**File**: `presets.js` ALL presets
**Problem**: Set `colorMode: 'weighted'` or `'lab'`

**Original Options**:
- `colorMode: 'color'` → colored output
- `colorMode: 'greyscale'` → greyscale output

**pathRenderer.js** line 145-153 ONLY recognizes these two values:
```javascript
if (this.options.colorMode === 'color') {
    colorString = 'rgba(' +
        (this.color.r !== 0 ? colorValue : 0) + ', ' +
        (this.color.g !== 0 ? colorValue : 0) + ', ' +
        (this.color.b !== 0 ? colorValue : 0) + ', ' + 1 + ')';
} else {
    // Falls through to greyscale for ANYTHING else
    colorString = 'rgba(' + colorValue + ', ' + colorValue + ', ' + colorValue + ', ' + 1 + ')';
}
```

**Result**: ALL presets render greyscale because pathRenderer doesn't recognize 'weighted'/'lab'

**Fix Required**: Change ALL presets to `colorMode: 'color'`

---

### 3. **BROKEN: Adaptive Sampling Breaking Path Coherence** (Severity: CRITICAL)
**File**: `pathFinder.js` lines 91-103
**Problem**: Dynamic sampleSize changes mid-path destroy smooth tracing

**Added Code**:
```javascript
// Adaptive sampling: more samples in face regions
if (this.options.faceMask && this.options.faceMask[this.y] && this.options.faceMask[this.y][this.x]) {
    sampleSize = Math.round(sampleSize * (this.options.faceSampleMultiplier || 1.5));
}

// Adaptive sampling: more samples in high-edge areas
if (this.options.edgeMap && this.options.edgeMap[this.y] && this.options.edgeMap[this.y][this.x]) {
    const edgeStrength = this.options.edgeMap[this.y][this.x] / 255;
    if (edgeStrength > 0.3) {
        sampleSize = Math.round(sampleSize * (1 + edgeStrength * 0.5));
    }
}
```

**Why It Breaks Path-Finding**:
- Original uses FIXED sampleSize = 4 for consistent arc sampling
- Changing sampleSize mid-path creates uneven angle steps: `angle += arcSize / sampleSize`
- Different sample counts = different arc divisions = jerky, inconsistent paths
- Multiplying sampleSize (6 → 9, 6 → 12) creates finer/coarser sampling unpredictably
- Path-finders jump erratically instead of smooth curves

---

### 4. **BROKEN: Edge Bias Corrupting Distance Calculations** (Severity: HIGH)
**File**: `pathFinder.js` lines 118-123
**Problem**: Multiplying colorDistance by edge bias breaks the comparator logic

```javascript
// Apply edge bias to favor edge pixels
if (this.options.edgeMap && this.options.edgeBias) {
    const edgeStrength = this.options.edgeMap[y][x] / 255;
    colorDistance = colorDistance * (1.0 - edgeStrength * this.options.edgeBias);
}
```

**Why It's Broken**:
- Original comparator expects `colorDistance` in specific range (0-255)
- Multiplying changes the scale unpredictably
- `closestColor` tracking breaks when distances are artificially modified
- Path-finders pick wrong pixels because comparison logic is corrupted
- Supposed to "favor edges" but actually creates chaos

---

### 5. **BROKEN: Asynchronous Initialization Race Condition** (Severity: HIGH)
**File**: `chromata.js` lines 22-62
**Problem**: Made image load handler `async` without ensuring readiness

**Original**:
```javascript
image.addEventListener('load', () => {
    // Synchronous setup
    ready = true;
});
```

**Modified**:
```javascript
image.addEventListener('load', async () => {
    // ... preprocessing ...
    if (this.options.preprocessEdges) {
        await this.preprocessing.initialize();
        // ...
    }

    if (this.options.detectFaces) {
        await this.faceDetection.initialize();
        // ...
    }

    ready = true;  // Set AFTER async operations
});
```

**Why It Might Break**:
- Face detection/edge detection might fail silently
- If OpenCV.js doesn't load, creates empty faceMask/edgeMap
- Path-finders get `undefined` or `null` when checking masks
- Potential for paths to start before preprocessing completes

---

### 6. **QUESTIONABLE: Gradient Caching** (Severity: MEDIUM - Performance)
**File**: `pathRenderer.js` lines 133-156
**Problem**: Caching gradients by color only, ignoring position

**Original**:
```javascript
_createGradient(p1, p2, color1, color2) {
    var grad = this.context.createLinearGradient(p1[0], p1[1], p2[0], p2[1]);
    // ...
}
```

**Modified**:
```javascript
const cacheKey = `${Math.round(color1)}-${Math.round(color2)}`;
if (this.gradientCache.has(cacheKey)) {
    return this.gradientCache.get(cacheKey);  // WRONG POSITION!
}
```

**Why It's Wrong**:
- Canvas gradients are position-dependent (p1, p2 coordinates)
- Cached gradient has OLD positions but is reused at NEW positions
- Creates incorrect color interpolation
- Gradients don't align with actual line segments
- May cause visual artifacts or wrong coloring

---

### 7. **BROKEN: Missing Original Options** (Severity: MEDIUM)
**File**: `presets.js`
**Problem**: Presets missing critical original options

**Original chromata init.js used**:
```javascript
{
    pathFinderCount: 300,
    colorMode: 'color',
    backgroundColor: 'hsla(34, 70%, 70%, 0)',
    outputSize: 'container',
    key: 'low'
}
```

**All presets missing**:
- `backgroundColor` - might default wrong
- Output might be wrong size
- `key` is set but other defaults might differ

---

### 8. **WRONG: Default colorMode in chromata.js** (Severity: HIGH)
**File**: `chromata.js` line 251
**Problem**: Passes wrong default to pathFinders

```javascript
colorMode: this.options.colorMode || 'weighted',
```

**Should be**:
- Either don't pass at all (let pathFinder use original logic)
- Or pass 'color' or 'greyscale' ONLY

---

## Additional Suspect Issues

### 9. **Velocity Caching May Break Smoothness**
**File**: `pathFinder.js` lines 17-18, 84-90
- Added `cachedRadius` and `velocityChanged` flag
- Math.hypot is fine, but caching might prevent responsive path changes
- If velocity should update every frame, cache defeats purpose

### 10. **ColorSpace Module Incompatibility**
**File**: `colorSpace.js` (entire file)
- LAB conversion is slow (complex math)
- Weighted distance uses different scale than expected
- No evidence this helps path-finding
- Creates dependency on untested module

### 11. **Preprocessing/FaceDetection Overhead**
**Files**: `preprocessing.js`, `faceDetection.js`
- WebGL edge detection adds initialization time
- OpenCV.js (9.7MB) heavy dependency
- Face detection is slow
- Edge maps and face masks passed to EVERY pathFinder
- Constant array lookups in hot path: `this.options.edgeMap[y][x]`

### 12. **UI Controller Replaces Original Test Setup**
**File**: `init.js`
- Original had simple test setup with buttons
- New UI might not even load images correctly (we saw upload was broken)
- Complex UI adds failure points

---

## What Original Chromata Does RIGHT

### Color Distance (Simple & Fast)
```javascript
_getColorDistance(pixel) {
    return MAX - pixel[this.rgbIndex];
}
```
- Uses single RGB channel (R, G, or B based on target color)
- Returns value in consistent 0-255 range
- Fast (one array access, one subtraction)
- Works with comparatorFn logic perfectly

### Fixed Sample Size
```javascript
sampleSize = 4;  // Constant
```
- Consistent arc division
- Predictable angle steps
- Smooth path curves

### Simple Rendering
```javascript
colorMode: 'color' or 'greyscale'
```
- Two modes, both work
- Renderer knows exactly what to do

---

## Files to Revert/Fix Priority

### **IMMEDIATE** (Restore to original):
1. `presets.js` - ALL presets need `colorMode: 'color'`
2. `pathFinder.js` - Revert `_getColorDistance()` completely
3. `pathFinder.js` - Remove adaptive sampling logic
4. `pathFinder.js` - Remove edge bias multiplication
5. `chromata.js` - Remove `colorMode: 'weighted'` default

### **SECONDARY** (Test if needed):
6. `pathRenderer.js` - Remove gradient caching (or fix to include position)
7. `chromata.js` - Make preprocessing/face detection optional (default OFF)
8. `pathFinder.js` - Test if velocity caching helps or hurts

### **OPTIONAL** (May keep if working):
9. Math.hypot optimization (probably fine)
10. Modern build tools (webpack 5, babel 7)

---

## Root Cause Analysis

### What Went Wrong:
1. **Did not test original behavior before modifying**
2. **Changed core algorithms without understanding implications**
3. **Added "enhancements" that interfered with fundamental path-finding**
4. **Assumed "better" color matching would help (it didn't)**
5. **Created incompatibilities between modules** (pathFinder colorMode ≠ pathRenderer colorMode)
6. **Made everything async without handling failures**
7. **Changed defaults that broke existing logic**

### Fundamental Misunderstanding:
- Chromata's beauty comes from SIMPLE, fast, consistent path-following
- "Perceptual color" doesn't matter if path-finders can't follow paths
- Adaptive sampling destroys the smooth curves that make it work
- Face detection is irrelevant if the core rendering is broken

---

## Next Steps

### Phase 1: Restore Basic Functionality
1. Change all presets to `colorMode: 'color'`
2. Revert `_getColorDistance()` to original
3. Remove adaptive sampling
4. Remove edge bias
5. TEST - should produce colored output that follows image

### Phase 2: Fix Rendering
6. Fix or remove gradient caching
7. Verify pathRenderer works with original logic
8. TEST - should match original chromata quality

### Phase 3: Make Enhancements Optional
9. Add flag to enable/disable new color distance methods
10. Add flag to enable/disable preprocessing
11. Make enhancements OPT-IN, not default
12. TEST - default behavior matches original

### Phase 4: Verify Enhancements Work
13. Test if LAB distance actually helps (probably doesn't)
14. Test if face detection helps (probably doesn't)
15. Test if edge detection helps (probably doesn't)
16. Remove what doesn't work

---

## Estimated Work Remaining

- **Quick fixes (1-2 hours)**: Restore colorMode, revert color distance
- **Testing original functionality (1 hour)**: Verify it works like original
- **Proper enhancement implementation (4-6 hours)**: Make features optional and actually working
- **Total**: ~8 hours to fix the disaster

**User was right: "Double the work ahead"**
