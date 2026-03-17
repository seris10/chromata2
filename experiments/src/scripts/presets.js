/**
 * Preset Configurations for Chromata Experiments
 * Optimized presets balancing speed and quality
 */

export const PRESETS = {
    fast: {
        name: 'Fast (1-2 seconds)',
        description: 'Quick processing with good quality',
        settings: {
            pathFinderCount: 15,
            speed: 12,
            turningAngle: Math.PI,
            colorMode: 'color',
            lineMode: 'square',
            lineWidth: 2,
            compositeOperation: 'lighten',
            iterationLimit: 3000,
            origin: ['bottom', 'top', 'left', 'right'],
            detectFaces: false,
            preprocessEdges: false,
            sampleSize: 2,
            edgeBias: 0,
            faceSampleMultiplier: 1.0
        }
    },

    balanced: {
        name: 'Balanced (3-5 seconds)',
        description: 'Great quality-to-speed ratio - recommended default',
        settings: {
            pathFinderCount: 30,
            speed: 8,
            turningAngle: Math.PI / 1.5,
            colorMode: 'color',
            lineMode: 'smooth',
            lineWidth: 2,
            compositeOperation: 'lighten',
            iterationLimit: 6000,
            origin: ['bottom', 'top', 'left', 'right'],
            detectFaces: true,
            preprocessEdges: true,
            sampleSize: 6,
            edgeBias: 0.2,
            faceSampleMultiplier: 1.3
        }
    },

    portrait: {
        name: 'Portrait (5-7 seconds)',
        description: 'Optimized for faces with smooth skin tones',
        settings: {
            pathFinderCount: 50,
            speed: 6,
            turningAngle: Math.PI / 2,
            colorMode: 'color',
            lineMode: 'smooth',
            lineWidth: 1.5,
            compositeOperation: 'lighten',
            iterationLimit: 8000,
            origin: ['50% 50%'], // Start from center for portraits
            detectFaces: true,
            preprocessEdges: true,
            sampleSize: 8,
            edgeBias: 0.3,
            faceSampleMultiplier: 1.5
        }
    },

    photorealistic: {
        name: 'Photorealistic (5-8 seconds)',
        description: 'Magazine-quality output with maximum detail',
        settings: {
            pathFinderCount: 80,
            speed: 5,
            turningAngle: Math.PI / 2.5,
            colorMode: 'color',
            lineMode: 'smooth',
            lineWidth: 1,
            compositeOperation: 'lighten',
            iterationLimit: 10000,
            origin: ['bottom', 'top', 'left', 'right', '50% 50%'],
            detectFaces: true,
            preprocessEdges: true,
            sampleSize: 8,
            edgeBias: 0.4,
            faceSampleMultiplier: 1.8
        }
    },

    experimental: {
        name: 'Experimental',
        description: 'Cutting-edge techniques - slower but highest quality',
        settings: {
            pathFinderCount: 100,
            speed: 4,
            turningAngle: Math.PI / 3,
            colorMode: 'color',
            lineMode: 'smooth',
            lineWidth: 1,
            compositeOperation: 'lighten',
            iterationLimit: 12000,
            origin: ['10% 10%', '90% 10%', '10% 90%', '90% 90%', '50% 50%'],
            detectFaces: true,
            preprocessEdges: true,
            sampleSize: 10,
            edgeBias: 0.5,
            faceSampleMultiplier: 2.0
        }
    }
};

/**
 * Get preset by name
 * @param {string} name - Preset name (fast, balanced, portrait, photorealistic, experimental)
 * @returns {object} - Preset configuration
 */
export function getPreset(name) {
    const preset = PRESETS[name.toLowerCase()];
    if (!preset) {
        console.warn(`Preset "${name}" not found, using balanced`);
        return PRESETS.balanced;
    }
    return preset;
}

/**
 * Get list of all preset names
 * @returns {Array<string>} - Array of preset names
 */
export function getPresetNames() {
    return Object.keys(PRESETS);
}

/**
 * Merge preset with custom options
 * @param {string} presetName - Preset name
 * @param {object} customOptions - Custom options to override
 * @returns {object} - Merged settings
 */
export function mergePreset(presetName, customOptions = {}) {
    const preset = getPreset(presetName);
    return {
        ...preset.settings,
        ...customOptions
    };
}

/**
 * Get recommended preset based on image characteristics
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {boolean} hasFaces - Whether faces were detected
 * @returns {string} - Recommended preset name
 */
export function getRecommendedPreset(width, height, hasFaces = false) {
    const pixels = width * height;

    // For portraits with faces
    if (hasFaces && pixels < 1000000) {
        return 'portrait';
    }

    // For large images
    if (pixels > 2000000) {
        return 'fast';
    }

    // For medium images
    if (pixels > 500000) {
        return 'balanced';
    }

    // For small images, can afford photorealistic
    return 'photorealistic';
}

export default PRESETS;
