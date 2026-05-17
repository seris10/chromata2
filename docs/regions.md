# Regions

Semantic segmentation that groups image pixels into eight scene categories and lets you apply per-category parameter overrides. Sky paths can move slower than rock paths; vegetation can have higher jitter than building.

Powered by TensorFlow.js DeepLab v3 with the ADE20K base model.

## Detection

Click **Detect Regions**. The first run downloads the model (~10 MB), subsequent runs reuse it. Image must be at least 128 x 128.

The model emits class IDs for each pixel; these are collapsed into 8 groups:

| Group | Includes (ADE20K class IDs) |
|---|---|
| sky | 2 |
| water | 22, 61, 110, 129, 148 |
| vegetation | 5, 18, 10, 67, 73 |
| rock | 35, 70, 91, 47 |
| building | 1, 26, 43, 33, 62 |
| person | 13 |
| road | 7, 12, 53 |
| other | everything else |

The **Detected** readout shows which groups were found and their percentage of total pixels (e.g. `sky 42%, vegetation 31%, person 5%`).

## Per-region profiles

Turn on **Enable Profiles** to apply overrides. Each detected group gets its own sub-folder with five toggles. When a toggle is on, the **Val** beside it overrides the global parameter for pixels in that region.

| Override | Range | Notes |
|---|---|---|
| Speed | 1 - 100 | Per-region speed. Common: lower for sky, higher for vegetation. |
| Width | 0.5 - 100 | Per-region line width. Thicker on buildings to emphasize architecture. |
| Jitter | 0 - 100 | Per-region jitter. Higher on water for chaos, zero on buildings for geometry. |
| Angle | 0.01 - 3 | Per-region turning angle. Lower on roads for straight lines. |
| Opacity | 1 - 100 | Per-region opacity. Subtle in sky, bold in foreground. |

## Workflow

1. Load image.
2. Click Detect Regions, wait for the readout.
3. Toggle Enable Profiles.
4. Open the sub-folder for each region you care about and toggle the overrides you want.
5. Tune the values.

The **Clear Regions** button wipes the mask, the stats, and all profiles in one go.

## Notes

- Detection runs on the natural image, not the displayed canvas. Re-detect after loading a new image.
- Regions and [Focus](focus.md) coexist. A region profile sets per-pixel parameter values; focus biases spawn density. Use both for "loose flowing sky, tight detailed face."
- Per-region profiles do not stack with [Modulators](modulators.md). Modulators set the global value; regions override it on a per-pixel basis.
