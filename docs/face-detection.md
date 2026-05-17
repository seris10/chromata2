# Face Detection

Find faces in the source image and use them to bias where pathfinders go and what they do. Useful for portraits - paths cluster around eyes and lips, trace jawlines, follow the contour of features.

Face detection is invoked from the **Focus** folder via the **Detect Faces** button. The detected faces show up in the Detected readout.

## Detection pipeline

Uses `@vladmandic/face-api` via CDN. Two models tried in sequence:

1. **TinyFaceDetector** with input size 512, score threshold 0.5.
2. **SSD Mobilenet v1** with min confidence 0.5, as fallback if Tiny found nothing.

Both extract 68 facial landmarks (eyes, nose, lips, jawline) on detection. Landmarks are stored in natural image coordinates.

False positive filtering: any detection box larger than 20% of the image, or with aspect ratio outside 0.5 - 1.8, is rejected.

## Once faces are detected

Each face produces a bounding box (padded 40% for breathing room) and a 68-point landmark set. The path-finder system uses these to:

- **Spawn at landmarks** when [Focus](focus.md) is enabled, in proportion to **Focus Density %**.
- **Gravitate toward landmarks** in proportion to **Gravity %** (`faceGravity` parameter).

So setting Focus on with Density 80% and Gravity 70% means most pathfinders start near facial features and stay close to them.

## Performance

The first detection is slow - the face-api models have to download and warm up. Subsequent detections on the same image are fast.

Detection is image-driven, not animation-driven. It runs once when you click Detect Faces, the results stick until you load a new image or click again.

If detection silently does nothing, open the browser console - face-api logs detection counts and rejections under the `[face-detect]` tag, which is how you spot when filtering threw out a valid result.

## Combining

The [Focus](focus.md) folder is the primary interface. [Force Nodes](force-nodes.md) is independent - you can manually add gravity nodes on faces without using face detection at all if you'd rather place them by eye.
