# Export

Three output formats, one button each. All save into the browser's default download folder with auto-generated filenames using a timestamp.

## PNG

Click **Save PNG**. Captures the canvas as a single still image. Filename is `chromata-<timestamp>.png`.

The PNG is the canvas at its current resolution. If you want a larger output, set Display - Size to Original before running, or upscale the source image first.

## Video (WebM)

Click **Record WebM** to start. The animation continues; the recording captures it in real time at 30 FPS using the canvas `captureStream` API. Click the button again to stop and download.

- Codec: VP9.
- Bitrate: 8 Mbps.
- Filename: `chromata-<timestamp>.webm`.
- Format support: most modern browsers play WebM natively. ffmpeg can re-encode to MP4 if you need wider compatibility.

The Status line shows `Recording...` while active, then `Encoding video...` when stopped, then `Video saved` when the file lands.

If you want a specific duration, watch the Iteration counter in the Monitor folder or set a Path Finders - Limit so the animation stops itself.

## SVG

Click **Export SVG**. Writes every recorded path as an SVG `<path>` element. Filename is `chromata-<timestamp>.svg`.

This is the vector option: infinitely scalable, useful for prints, plotter art, further editing in Illustrator/Inkscape.

Notes:

- SVG only captures the lines pathfinders have drawn so far. Run the animation for as long as you want first.
- Pixel Grid mode and brush effects that don't reduce to line strokes won't translate cleanly.
- File size grows with iteration count. A long run can produce a multi-megabyte SVG with tens of thousands of paths. Most editors handle this but expect slow load times.
