# Chromata Origin Selector UI Spec

## Overview

Design and implement a new Origin Selector UI component for the Chromata editor. The current dropdown selector needs to be replaced with an interactive percentage-based allocation system.

---

## Available Origins (Backend Ready)

The following origin points are now supported in `chromata-custom.js`:

| Origin Name | Behavior |
|-------------|----------|
| `top` | Pathfinders spawn along top edge, move downward |
| `bottom` | Pathfinders spawn along bottom edge, move upward |
| `left` | Pathfinders spawn along left edge, move rightward |
| `right` | Pathfinders spawn along right edge, move leftward |
| `top-left` | Corner spawn, radial spread (right to down) |
| `top-right` | Corner spawn, radial spread (down to left) |
| `bottom-left` | Corner spawn, radial spread (right to up) |
| `bottom-right` | Corner spawn, radial spread (left to up) |
| `center` | Center spawn, 360° radial burst |
| `X% Y%` | Custom coordinate (e.g., "25% 75%") |

---

## New API: Weighted Origins

Instead of the old `origin: ['bottom', 'top']` array (equal distribution), the backend now supports:

```javascript
originWeights: {
    'bottom': 40,      // 40% of pathfinders
    'top': 30,         // 30% of pathfinders
    'center': 20,      // 20% of pathfinders
    '50% 25%': 10      // 10% at custom point
}
```

**Rules:**
- Values are percentages (0-100)
- Must total to 100 (or less)
- If total < 100, remainder is distributed equally across all active origins
- Origins with 0 or missing weight are skipped

---

## UI Design Requirements

### 1. Budget Bar (Top)

A horizontal progress bar showing allocation status:

```
┌─────────────────────────────────────────────────────────────┐
│ ████████████████████████████░░░░░░░░░░░░░░░░  72% allocated │
└─────────────────────────────────────────────────────────────┘
```

- **Full (blue/green):** Percentage allocated
- **Empty (gray):** Remaining budget
- **Behavior:**
  - Starts at 0% (empty bar)
  - Fills as user adds percentages
  - Prevents input values that would exceed 100%
  - Shows "X% allocated" or "X% remaining" label

### 2. Origin Cards Grid

A grid of origin selector cards, each representing one spawn point:

```
┌──────────────────────────────────────────────────────────────────┐
│  EDGES                                                           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐              │
│  │   Top   │  │ Bottom  │  │  Left   │  │  Right  │              │
│  │  [ 25 ] │  │  [ 25 ] │  │  [  0 ] │  │  [  0 ] │              │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘              │
│                                                                   │
│  CORNERS                                                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐              │
│  │ Top-Left│  │Top-Right│  │Bot-Left │  │Bot-Right│              │
│  │  [  0 ] │  │  [  0 ] │  │  [  0 ] │  │  [  0 ] │              │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘              │
│                                                                   │
│  CENTER                                                           │
│  ┌─────────┐                                                      │
│  │ Center  │                                                      │
│  │  [ 50 ] │                                                      │
│  └─────────┘                                                      │
│                                                                   │
│  CUSTOM POINTS                                                    │
│  ┌───────────────────────┐  ┌───────────────────────┐            │
│  │ 25% 75%    [  0 ]  ✕  │  │  + Add Custom Point   │            │
│  └───────────────────────┘  └───────────────────────┘            │
└──────────────────────────────────────────────────────────────────┘
```

### 3. Origin Card Behavior

Each card contains:
- **Label:** Origin name (e.g., "Top", "Bottom-Left", "Center")
- **Input field:** Numeric input for percentage (0-100)
- **Visual indicator:** Optional small icon/diagram showing spawn location

**Input behavior:**
- Type a number directly
- Arrow keys or +/- buttons to increment/decrement
- Cannot exceed remaining budget
- Pressing delete/backspace on 0 removes custom points
- Tab navigates between cards

### 4. Custom Point Creation

**"+ Add Custom Point" button:**
1. Click button
2. Button changes to "Click canvas to set point..."
3. User clicks anywhere on the canvas preview
4. New custom point card appears with coordinates (e.g., "34% 67%")
5. User can then assign a percentage

**Custom point cards:**
- Show coordinates as label
- Have a ✕ button to remove
- Same percentage input as other cards

### 5. Auto-Distribute Button

A button below the grid:

```
[ Auto-Distribute Remaining ]
```

- Divides unallocated percentage equally among all origins with > 0 allocation
- Example: If 60% allocated across 3 origins, clicking adds 13.33% to each (totaling 100%)

### 6. Quick Presets (Optional)

Preset buttons for common configurations:

```
[ All Edges ]  [ All Corners ]  [ Radial Burst ]  [ Cross-Hatch ]
```

| Preset | Configuration |
|--------|---------------|
| All Edges | top: 25, bottom: 25, left: 25, right: 25 |
| All Corners | top-left: 25, top-right: 25, bottom-left: 25, bottom-right: 25 |
| Radial Burst | center: 100 |
| Cross-Hatch | top: 25, bottom: 25, left: 25, right: 25 (same as edges) |

---

## Visual Design Notes

### Styling (match existing Chromata dark theme)

```css
/* Card styling */
.origin-card {
    background: #2a2a2a;
    border: 1px solid #444;
    border-radius: 8px;
    padding: 12px;
    min-width: 80px;
    text-align: center;
}

.origin-card.active {
    border-color: #5b9dd9;  /* Blue highlight when > 0 */
}

.origin-card input {
    width: 50px;
    background: #1a1a1a;
    border: 1px solid #555;
    color: #fff;
    text-align: center;
    border-radius: 4px;
    padding: 4px;
}

/* Budget bar */
.budget-bar {
    height: 24px;
    background: #333;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 16px;
}

.budget-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #4a90d9, #67b26f);
    transition: width 0.2s ease;
}
```

### Layout

- Use CSS Grid for the origin cards: `grid-template-columns: repeat(4, 1fr)`
- Group by category (Edges, Corners, Center, Custom)
- Responsive: stack to 2 columns on narrow screens

---

## Data Flow

### UI → Chromata

When user changes values, build the `originWeights` object:

```javascript
function getOriginWeights() {
    const weights = {};

    // Read all origin card inputs
    document.querySelectorAll('.origin-card').forEach(card => {
        const name = card.dataset.origin;
        const value = parseInt(card.querySelector('input').value) || 0;
        if (value > 0) {
            weights[name] = value;
        }
    });

    return weights;
}

// Apply to Chromata
chromata.options.originWeights = getOriginWeights();
chromata.reset();
chromata.start();
```

### Canvas Click → Custom Point

```javascript
let settingCustomPoint = false;

addCustomBtn.addEventListener('click', () => {
    settingCustomPoint = true;
    addCustomBtn.textContent = 'Click canvas...';
    canvas.style.cursor = 'crosshair';
});

canvas.addEventListener('click', (e) => {
    if (!settingCustomPoint) return;

    const rect = canvas.getBoundingClientRect();
    const xPc = Math.round((e.clientX - rect.left) / rect.width * 100);
    const yPc = Math.round((e.clientY - rect.top) / rect.height * 100);

    createCustomPointCard(`${xPc}% ${yPc}%`);

    settingCustomPoint = false;
    addCustomBtn.textContent = '+ Add Custom Point';
    canvas.style.cursor = 'default';
});
```

---

## Validation

- Total allocation must not exceed 100%
- Input values clamped to 0-100
- Custom point coordinates clamped to 0-100%
- At least one origin must have > 0 allocation (or use default)

---

## Files to Modify

1. **`index.html`** - Add the new origin selector UI section
2. **`chromata-custom.js`** - Already updated with new origins and `originWeights` support
3. **New or existing CSS** - Add styles for origin cards and budget bar

---

## Testing Checklist

- [ ] All 9 named origins work (4 edges + 4 corners + center)
- [ ] Custom X% Y% points work
- [ ] Budget bar updates in real-time
- [ ] Cannot exceed 100% total
- [ ] Auto-distribute works correctly
- [ ] Canvas click-to-add works
- [ ] Removing custom points works
- [ ] Presets apply correct values
- [ ] Values persist when toggling start/stop
- [ ] Reset clears custom points (or preserves them - decide)
