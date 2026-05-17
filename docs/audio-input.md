# Audio Input

Feed a live spectrogram to the pathfinders. Audio becomes the image. Pathfinders trace the shape of sound in real time.

When **Enable** is on with no image loaded, a blank black canvas is auto-created so audio has something to draw onto.

## How it works

The browser's WebAudio API runs an FFT on the input signal each refresh tick. The frequency-amplitude data is written into the pixel buffer one column at a time, scrolling left to right. Pathfinders then read that buffer like any normal image.

So loud bass = bright pixels at the bottom (or top, depending on log scale). Treble fills the upper bands. The pathfinders chase the loudest frequencies.

## Parameters

| Control | Options / Range | Default | What it does |
|---|---|---|---|
| Enable | bool | off | Toggle the whole audio pipeline. Starts/stops the microphone or playback. |
| Source | Microphone / Audio File | Microphone | Mic gets your default input device. Audio File reveals a file picker. |
| Gain | 1 - 300 | 100 | Amplify the signal. Higher = brighter spectrogram, more vivid pathfinder colors. |
| Color Map | Frequency Hue / Grayscale / Heat | Frequency Hue | Frequency Hue maps bin index to hue (red bass, green mids, blue treble - emergent channel separation). Grayscale is amplitude only. Heat is a Winamp-style plasma. |
| Smoothing | 0 - 99 | 70 | Temporal smoothing between FFT frames. Higher = smoother, less flickering. Lower = more responsive to transients. |
| FFT Size | 512 / 1024 / 2048 / 4096 | 2048 | FFT window size. Higher = more frequency resolution but slower response. 2048 is a good balance. |
| Refresh Rate | 1 - 30 | 4 | Frames between pixelData updates. Lower = more responsive but heavier on CPU. |
| Log Scale | bool | on | Log scale gives bass more pixels (musical). Linear distributes frequencies evenly (scientific). |
| Show Spectrogram | bool | off | Overlay the raw spectrogram on the canvas at 40% opacity. Useful for debugging the input. |

## Microphone setup

Choosing Microphone prompts for permission. The browser remembers per-origin. If you denied it earlier, clear the site permissions and reload.

## Audio file playback

Choosing Audio File reveals a file input. Drop any browser-playable format (mp3, wav, ogg, m4a). The clip loops automatically.

## Performance notes

- High Gain combined with Smoothing 0 produces strobe-like effects. If FPS drops, raise Smoothing or Refresh Rate.
- 4096 FFT Size halves frequency response time. Worth it if you're chasing slow harmonic motion. Avoid for percussive material.
- Linear scale shows treble accurately. Log scale shows bass musically. Most music looks better on log.

## Combining with motion systems

Audio output is just a pixel buffer, so it stacks with everything else. The most striking combos use [Natural Math](natural-math.md) Flow Field with audio (paths swirl through the music) or [Radial](radial.md) at low Strength (audio bursts inside a circular bound).

The built-in `audio-rivers`, `audio-bloom`, and `audio-pulse` presets are good starting points.
