/**
 * Face Detection Module
 * Uses OpenCV.js Haar Cascade for face detection
 */

export default class FaceDetection {
    constructor() {
        this.cv = null;
        this.classifier = null;
        this.initialized = false;
        this.loadPromise = null;
    }

    /**
     * Initialize OpenCV.js and load Haar Cascade classifier
     * @returns {Promise<boolean>} - True if initialization successful
     */
    async initialize() {
        if (this.initialized) {
            return true;
        }

        if (this.loadPromise) {
            return this.loadPromise;
        }

        this.loadPromise = new Promise(async (resolve, reject) => {
            try {
                // Wait for OpenCV.js to load
                if (typeof cv === 'undefined') {
                    console.warn('OpenCV.js not loaded, face detection disabled');
                    resolve(false);
                    return;
                }

                this.cv = cv;

                // Wait for OpenCV to be ready
                await this.waitForOpenCV();

                // Load Haar Cascade classifier from OpenCV.js
                // Using frontalface_default classifier
                const classifierUrl = 'https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_frontalface_default.xml';

                try {
                    const response = await fetch(classifierUrl);
                    const xmlText = await response.text();

                    // Create file in OpenCV's file system
                    this.cv.FS_createDataFile('/', 'haarcascade_frontalface_default.xml', xmlText, true, false, false);

                    // Load classifier
                    this.classifier = new this.cv.CascadeClassifier();
                    this.classifier.load('haarcascade_frontalface_default.xml');

                } catch (error) {
                    console.warn('Could not load Haar Cascade, using fallback:', error);
                    // Face detection will be disabled but won't break the app
                    resolve(false);
                    return;
                }

                this.initialized = true;
                resolve(true);

            } catch (error) {
                console.error('Face detection initialization failed:', error);
                resolve(false);
            }
        });

        return this.loadPromise;
    }

    /**
     * Wait for OpenCV.js to be ready
     */
    waitForOpenCV() {
        return new Promise((resolve) => {
            if (this.cv && this.cv.Mat) {
                resolve();
            } else {
                const checkInterval = setInterval(() => {
                    if (this.cv && this.cv.Mat) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);

                // Timeout after 10 seconds
                setTimeout(() => {
                    clearInterval(checkInterval);
                    resolve();
                }, 10000);
            }
        });
    }

    /**
     * Detect faces in canvas
     * @param {HTMLCanvasElement} canvas - Canvas containing image
     * @returns {Array<{x: number, y: number, width: number, height: number}>} - Array of face rectangles
     */
    detectFaces(canvas) {
        if (!this.initialized || !this.classifier) {
            return [];
        }

        try {
            // Convert canvas to OpenCV Mat
            const src = this.cv.imread(canvas);
            const gray = new this.cv.Mat();

            // Convert to grayscale
            this.cv.cvtColor(src, gray, this.cv.COLOR_RGBA2GRAY, 0);

            // Detect faces
            const faces = new this.cv.RectVector();
            const msize = new this.cv.Size(0, 0);

            // Parameters: image, objects, scaleFactor, minNeighbors, flags, minSize, maxSize
            this.classifier.detectMultiScale(gray, faces, 1.1, 3, 0, msize, msize);

            // Convert to plain JavaScript array
            const faceArray = [];
            for (let i = 0; i < faces.size(); i++) {
                const face = faces.get(i);
                faceArray.push({
                    x: face.x,
                    y: face.y,
                    width: face.width,
                    height: face.height
                });
            }

            // Cleanup
            src.delete();
            gray.delete();
            faces.delete();

            return faceArray;

        } catch (error) {
            console.error('Face detection error:', error);
            return [];
        }
    }

    /**
     * Create face mask (2D boolean array)
     * @param {number} width - Image width
     * @param {number} height - Image height
     * @param {Array<{x, y, width, height}>} faces - Detected face rectangles
     * @param {number} padding - Extra padding around faces (default: 10%)
     * @returns {Array<Array<boolean>>} - 2D mask (true = inside face region)
     */
    createFaceMask(width, height, faces, padding = 0.1) {
        // Initialize mask (all false)
        const mask = [];
        for (let y = 0; y < height; y++) {
            mask[y] = [];
            for (let x = 0; x < width; x++) {
                mask[y][x] = false;
            }
        }

        // Mark face regions as true
        faces.forEach(face => {
            // Add padding
            const padX = Math.round(face.width * padding);
            const padY = Math.round(face.height * padding);

            const x1 = Math.max(0, face.x - padX);
            const y1 = Math.max(0, face.y - padY);
            const x2 = Math.min(width - 1, face.x + face.width + padX);
            const y2 = Math.min(height - 1, face.y + face.height + padY);

            for (let y = y1; y <= y2; y++) {
                for (let x = x1; x <= x2; x++) {
                    mask[y][x] = true;
                }
            }
        });

        return mask;
    }

    /**
     * Draw face rectangles on canvas (for debugging/UI)
     * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
     * @param {Array<{x, y, width, height}>} faces - Detected faces
     * @param {string} color - Rectangle color (default: red)
     */
    drawFaceRectangles(ctx, faces, color = 'rgba(255, 0, 0, 0.5)') {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        faces.forEach(face => {
            ctx.strokeRect(face.x, face.y, face.width, face.height);
        });

        ctx.restore();
    }

    /**
     * Check if point is inside any face region
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {Array<Array<boolean>>} faceMask - Face mask from createFaceMask()
     * @returns {boolean} - True if point is in face region
     */
    isInFaceRegion(x, y, faceMask) {
        if (!faceMask || !faceMask[y] || faceMask[y][x] === undefined) {
            return false;
        }
        return faceMask[y][x];
    }

    /**
     * Get skin tone range for face region
     * Useful for adaptive path-finding in skin tone areas
     * @param {ImageData} imageData - Image data
     * @param {object} face - Face rectangle {x, y, width, height}
     * @returns {{min: [r,g,b], max: [r,g,b]}} - Skin tone range
     */
    getSkinToneRange(imageData, face) {
        const data = imageData.data;
        const width = imageData.width;

        let minR = 255, minG = 255, minB = 255;
        let maxR = 0, maxG = 0, maxB = 0;

        // Sample center 50% of face (avoid hair/edges)
        const x1 = Math.round(face.x + face.width * 0.25);
        const y1 = Math.round(face.y + face.height * 0.25);
        const x2 = Math.round(face.x + face.width * 0.75);
        const y2 = Math.round(face.y + face.height * 0.75);

        for (let y = y1; y < y2; y++) {
            for (let x = x1; x < x2; x++) {
                const idx = (y * width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];

                minR = Math.min(minR, r);
                minG = Math.min(minG, g);
                minB = Math.min(minB, b);
                maxR = Math.max(maxR, r);
                maxG = Math.max(maxG, g);
                maxB = Math.max(maxB, b);
            }
        }

        return {
            min: [minR, minG, minB],
            max: [maxR, maxG, maxB]
        };
    }

    /**
     * Cleanup resources
     */
    destroy() {
        if (this.classifier) {
            this.classifier.delete();
            this.classifier = null;
        }
        this.initialized = false;
    }
}
