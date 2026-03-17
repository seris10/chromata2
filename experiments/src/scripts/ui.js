/**
 * UI Controller for Chromata Experiments
 * Manages user interface, progress tracking, and user interactions
 */

import Chromata from './chromata';
import { getPreset, getRecommendedPreset } from './presets';

export default class UIController {
    constructor() {
        this.chromata = null;
        this.currentPreset = 'balanced';
        this.startTime = null;
        this.frameCount = 0;
        this.lastFpsUpdate = 0;

        this.elements = {
            imageInput: document.getElementById('imageInput'),
            uploadArea: document.getElementById('uploadArea'),
            sourceImage: document.getElementById('sourceImage'),
            startBtn: document.getElementById('startBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            resetBtn: document.getElementById('resetBtn'),
            downloadBtn: document.getElementById('downloadBtn'),
            progressSection: document.getElementById('progressSection'),
            progressFill: document.getElementById('progressFill'),
            timeElapsed: document.getElementById('timeElapsed'),
            iterations: document.getElementById('iterations'),
            facesDetected: document.getElementById('facesDetected'),
            fps: document.getElementById('fps'),
            colorMode: document.getElementById('colorMode'),
            canvasSection: document.getElementById('canvasSection')
        };

        // Debug: Check if elements exist
        console.log('UIController initialized');
        console.log('imageInput:', this.elements.imageInput);
        console.log('uploadArea:', this.elements.uploadArea);

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Image upload
        this.elements.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));

        // Drag and drop
        this.elements.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            console.log('dragover event');
            this.elements.uploadArea.classList.add('drag-over');
        });

        this.elements.uploadArea.addEventListener('dragleave', () => {
            console.log('dragleave event');
            this.elements.uploadArea.classList.remove('drag-over');
        });

        this.elements.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            console.log('drop event', e.dataTransfer.files);
            this.elements.uploadArea.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            console.log('Dropped file:', file);
            if (file && file.type.startsWith('image/')) {
                this.loadImage(file);
            } else {
                console.warn('Not an image file:', file?.type);
            }
        });

        // Preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectPreset(btn.dataset.preset));
        });

        // Control buttons
        this.elements.startBtn.addEventListener('click', () => this.start());
        this.elements.pauseBtn.addEventListener('click', () => this.pause());
        this.elements.resetBtn.addEventListener('click', () => this.reset());
        this.elements.downloadBtn.addEventListener('click', () => this.download());
    }

    handleImageUpload(event) {
        console.log('handleImageUpload called', event);
        const file = event.target.files[0];
        console.log('File selected:', file);
        if (file) {
            this.loadImage(file);
        }
    }

    loadImage(file) {
        console.log('loadImage called with file:', file.name, file.type, file.size);
        const reader = new FileReader();
        reader.onload = (e) => {
            console.log('FileReader loaded, setting image src');
            this.elements.sourceImage.src = e.target.result;
            this.elements.sourceImage.onload = () => {
                console.log('Image loaded, initializing chromata');
                this.initializeChromata();
                this.elements.uploadArea.style.display = 'none';
                this.elements.sourceImage.style.display = 'block';
            };
        };
        reader.readAsDataURL(file);
    }

    selectPreset(presetName) {
        this.currentPreset = presetName;

        // Update UI
        document.querySelectorAll('.preset-btn').forEach(btn => {
            if (btn.dataset.preset === presetName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Reinitialize if image is loaded
        if (this.elements.sourceImage.src && this.chromata) {
            this.reset();
            this.initializeChromata();
        }
    }

    initializeChromata() {
        const preset = getPreset(this.currentPreset);

        this.chromata = new Chromata(this.elements.sourceImage, preset.settings);

        // Wait for chromata to be ready
        this.chromata.loader(() => {
            this.elements.startBtn.disabled = false;
            this.elements.resetBtn.disabled = false;

            // Update face detection display
            if (this.chromata.detectedFaces) {
                this.elements.facesDetected.textContent = this.chromata.detectedFaces.length;
            }

            // Update color mode display
            const colorModeMap = {
                'lab': 'CIE LAB',
                'weighted': 'Weighted RGB',
                'rgb': 'Simple RGB'
            };
            this.elements.colorMode.textContent = colorModeMap[preset.settings.colorMode] || 'Weighted RGB';

            // Move canvas to our section
            const canvas = document.getElementById('chromataCanvas');
            if (canvas && canvas.parentNode !== this.elements.canvasSection) {
                this.elements.canvasSection.appendChild(canvas);
            }
        });
    }

    start() {
        if (!this.chromata) return;

        this.chromata.start();
        this.startTime = performance.now();
        this.frameCount = 0;
        this.lastFpsUpdate = this.startTime;

        // Update UI
        this.elements.startBtn.disabled = true;
        this.elements.pauseBtn.disabled = false;
        this.elements.downloadBtn.disabled = true;
        this.elements.progressSection.style.display = 'block';

        // Start progress tracking
        this.trackProgress();
    }

    pause() {
        if (!this.chromata) return;

        if (this.chromata.isRunning) {
            this.chromata.stop();
            this.elements.pauseBtn.textContent = 'Resume';
            this.elements.startBtn.disabled = false;
        } else {
            this.chromata.start();
            this.elements.pauseBtn.textContent = 'Pause';
            this.elements.startBtn.disabled = true;
        }
    }

    reset() {
        if (!this.chromata) return;

        this.chromata.reset();
        this.startTime = null;
        this.frameCount = 0;

        // Reset UI
        this.elements.startBtn.disabled = false;
        this.elements.pauseBtn.disabled = true;
        this.elements.pauseBtn.textContent = 'Pause';
        this.elements.downloadBtn.disabled = true;
        this.elements.progressSection.style.display = 'none';
        this.elements.progressFill.style.width = '0%';
        this.elements.timeElapsed.textContent = '0.0s';
        this.elements.iterations.textContent = '0';
        this.elements.fps.textContent = '0';
    }

    download() {
        const canvas = document.getElementById('chromataCanvas');
        if (!canvas) return;

        const link = document.createElement('a');
        link.download = `chromata-${this.currentPreset}-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    trackProgress() {
        if (!this.chromata || !this.chromata.isRunning) {
            // Processing complete
            if (this.chromata && this.chromata.iterationCount > 0) {
                this.elements.downloadBtn.disabled = false;
                this.elements.pauseBtn.disabled = true;
            }
            return;
        }

        const now = performance.now();
        const elapsed = (now - this.startTime) / 1000;

        // Update time
        this.elements.timeElapsed.textContent = elapsed.toFixed(1) + 's';

        // Update iterations
        this.elements.iterations.textContent = this.chromata.iterationCount.toString();

        // Update progress bar
        const preset = getPreset(this.currentPreset);
        const progress = Math.min(100, (this.chromata.iterationCount / preset.settings.iterationLimit) * 100);
        this.elements.progressFill.style.width = progress.toFixed(1) + '%';

        // Update FPS (every 500ms)
        this.frameCount++;
        if (now - this.lastFpsUpdate >= 500) {
            const fps = Math.round(this.frameCount / ((now - this.lastFpsUpdate) / 1000));
            this.elements.fps.textContent = fps.toString();
            this.frameCount = 0;
            this.lastFpsUpdate = now;
        }

        // Continue tracking
        requestAnimationFrame(() => this.trackProgress());
    }

    // Utility method to show notification
    showNotification(message, type = 'info') {
        // Simple console notification for now
        // Could be enhanced with toast notifications
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

// Initialize UI when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new UIController();
    });
} else {
    new UIController();
}
