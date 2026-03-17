/**
 * Color Space Utilities
 * Perceptually uniform color distance calculations for better matching
 */

export default class ColorSpace {

    /**
     * Convert RGB to CIE LAB color space (perceptually uniform)
     * @param {number} r - Red (0-255)
     * @param {number} g - Green (0-255)
     * @param {number} b - Blue (0-255)
     * @returns {[number, number, number]} - [L, a, b] in LAB space
     */
    static rgbToLab(r, g, b) {
        // Normalize RGB to [0, 1]
        let rNorm = r / 255;
        let gNorm = g / 255;
        let bNorm = b / 255;

        // Apply gamma correction (sRGB to linear RGB)
        rNorm = rNorm > 0.04045 ? Math.pow((rNorm + 0.055) / 1.055, 2.4) : rNorm / 12.92;
        gNorm = gNorm > 0.04045 ? Math.pow((gNorm + 0.055) / 1.055, 2.4) : gNorm / 12.92;
        bNorm = bNorm > 0.04045 ? Math.pow((bNorm + 0.055) / 1.055, 2.4) : bNorm / 12.92;

        // Convert to XYZ (D65 illuminant)
        let x = rNorm * 0.4124564 + gNorm * 0.3575761 + bNorm * 0.1804375;
        let y = rNorm * 0.2126729 + gNorm * 0.7151522 + bNorm * 0.0721750;
        let z = rNorm * 0.0193339 + gNorm * 0.1191920 + bNorm * 0.9503041;

        // Normalize for D65 white point
        x = x / 0.95047;
        y = y / 1.00000;
        z = z / 1.08883;

        // Apply LAB transformation
        x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x) + (16/116);
        y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y) + (16/116);
        z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z) + (16/116);

        const L = (116 * y) - 16;
        const a = 500 * (x - y);
        const bLab = 200 * (y - z);

        return [L, a, bLab];
    }

    /**
     * Calculate color difference using CIE76 Delta E formula
     * @param {[number, number, number]} lab1 - First color in LAB
     * @param {[number, number, number]} lab2 - Second color in LAB
     * @returns {number} - Delta E distance
     */
    static deltaE(lab1, lab2) {
        const deltaL = lab1[0] - lab2[0];
        const deltaA = lab1[1] - lab2[1];
        const deltaB = lab1[2] - lab2[2];

        return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
    }

    /**
     * Weighted Euclidean distance (2x faster than LAB, still perceptually better than simple RGB)
     * Based on redmean formula - accounts for human eye sensitivity
     * @param {[number, number, number]} rgb1 - First color [r, g, b]
     * @param {[number, number, number]} rgb2 - Second color [r, g, b]
     * @returns {number} - Weighted distance
     */
    static weightedDistance(rgb1, rgb2) {
        const rMean = (rgb1[0] + rgb2[0]) / 2;
        const r = rgb1[0] - rgb2[0];
        const g = rgb1[1] - rgb2[1];
        const b = rgb1[2] - rgb2[2];

        const weightR = 2 + rMean / 256;
        const weightG = 4.0;
        const weightB = 2 + (255 - rMean) / 256;

        return Math.sqrt(weightR * r * r + weightG * g * g + weightB * b * b);
    }

    /**
     * Simple RGB Euclidean distance (fastest, least accurate)
     * @param {[number, number, number]} rgb1 - First color [r, g, b]
     * @param {[number, number, number]} rgb2 - Second color [r, g, b]
     * @returns {number} - Euclidean distance
     */
    static rgbDistance(rgb1, rgb2) {
        const r = rgb1[0] - rgb2[0];
        const g = rgb1[1] - rgb2[1];
        const b = rgb1[2] - rgb2[2];

        return Math.sqrt(r * r + g * g + b * b);
    }

    /**
     * Precompute LAB array for entire image (optimization for LAB mode)
     * @param {Array<Array<[number, number, number, number]>>} imageArray - 2D array of [r,g,b,a] pixels
     * @returns {Array<Array<[number, number, number]>>} - 2D array of [L,a,b] values
     */
    static imageToLabArray(imageArray) {
        const height = imageArray.length;
        const width = imageArray[0].length;
        const labArray = [];

        for (let y = 0; y < height; y++) {
            labArray[y] = [];
            for (let x = 0; x < width; x++) {
                const pixel = imageArray[y][x];
                labArray[y][x] = this.rgbToLab(pixel[0], pixel[1], pixel[2]);
            }
        }

        return labArray;
    }

    /**
     * Get dominant channel from RGB color (for original chromata compatibility)
     * @param {[number, number, number]} rgb - RGB color
     * @returns {number} - Index of dominant channel (0=R, 1=G, 2=B)
     */
    static getDominantChannel(rgb) {
        let maxValue = 0;
        let maxIndex = 0;

        for (let i = 0; i < 3; i++) {
            if (rgb[i] > maxValue) {
                maxValue = rgb[i];
                maxIndex = i;
            }
        }

        return maxIndex;
    }

    /**
     * Get non-zero RGB channel (original chromata method)
     * @param {[number, number, number]} rgb - RGB color
     * @returns {number} - Index of first non-zero channel
     */
    static getRgbIndex(rgb) {
        for (let i = 0; i < 3; i++) {
            if (rgb[i] !== 0) {
                return i;
            }
        }
        return 0;
    }

    /**
     * Convert hex color to RGB array
     * @param {string} hex - Hex color string (e.g., "#FF6600" or "FF6600")
     * @returns {[number, number, number]} - [r, g, b]
     */
    static hexToRgb(hex) {
        // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, (m, r, g, b) => {
            return r + r + g + g + b + b;
        });

        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : null;
    }

    /**
     * Convert RGB to hex string
     * @param {number} r - Red (0-255)
     * @param {number} g - Green (0-255)
     * @param {number} b - Blue (0-255)
     * @returns {string} - Hex color string
     */
    static rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    /**
     * Interpolate between two colors in LAB space
     * @param {[number, number, number]} rgb1 - First RGB color
     * @param {[number, number, number]} rgb2 - Second RGB color
     * @param {number} t - Interpolation factor (0-1)
     * @returns {[number, number, number]} - Interpolated RGB color
     */
    static interpolateLab(rgb1, rgb2, t) {
        const lab1 = this.rgbToLab(rgb1[0], rgb1[1], rgb1[2]);
        const lab2 = this.rgbToLab(rgb2[0], rgb2[1], rgb2[2]);

        const L = lab1[0] + (lab2[0] - lab1[0]) * t;
        const a = lab1[1] + (lab2[1] - lab1[1]) * t;
        const b = lab1[2] + (lab2[2] - lab1[2]) * t;

        return this.labToRgb([L, a, b]);
    }

    /**
     * Convert LAB to RGB (for interpolation)
     * @param {[number, number, number]} lab - [L, a, b]
     * @returns {[number, number, number]} - [r, g, b]
     */
    static labToRgb(lab) {
        let y = (lab[0] + 16) / 116;
        let x = lab[1] / 500 + y;
        let z = y - lab[2] / 200;

        x = 0.95047 * ((x * x * x > 0.008856) ? x * x * x : (x - 16/116) / 7.787);
        y = 1.00000 * ((y * y * y > 0.008856) ? y * y * y : (y - 16/116) / 7.787);
        z = 1.08883 * ((z * z * z > 0.008856) ? z * z * z : (z - 16/116) / 7.787);

        let r = x *  3.2404542 + y * -1.5371385 + z * -0.4985314;
        let g = x * -0.9692660 + y *  1.8760108 + z *  0.0415560;
        let b = x *  0.0556434 + y * -0.2040259 + z *  1.0572252;

        r = (r > 0.0031308) ? (1.055 * Math.pow(r, 1/2.4) - 0.055) : 12.92 * r;
        g = (g > 0.0031308) ? (1.055 * Math.pow(g, 1/2.4) - 0.055) : 12.92 * g;
        b = (b > 0.0031308) ? (1.055 * Math.pow(b, 1/2.4) - 0.055) : 12.92 * b;

        return [
            Math.max(0, Math.min(255, Math.round(r * 255))),
            Math.max(0, Math.min(255, Math.round(g * 255))),
            Math.max(0, Math.min(255, Math.round(b * 255)))
        ];
    }

    /**
     * Get color distance function based on mode
     * @param {string} mode - 'rgb', 'weighted', or 'lab'
     * @returns {Function} - Distance function
     */
    static getDistanceFunction(mode) {
        switch (mode) {
            case 'lab':
                return (color1, color2) => {
                    const lab1 = this.rgbToLab(color1[0], color1[1], color1[2]);
                    const lab2 = this.rgbToLab(color2[0], color2[1], color2[2]);
                    return this.deltaE(lab1, lab2);
                };
            case 'weighted':
                return (color1, color2) => this.weightedDistance(color1, color2);
            case 'rgb':
            default:
                return (color1, color2) => this.rgbDistance(color1, color2);
        }
    }
}
