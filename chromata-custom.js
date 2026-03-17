/**
 * Chromata - Custom Build with additional parameters
 * Original by Michael Bromley
 * Extended with: sampleSize, jitter, edge detection
 */

(function() {
    'use strict';

    const MAX = 255;
    const TARGET_DT = 1000 / 60; // 16.67ms fixed timestep

    // Seeded PRNG (mulberry32) for reproducible renders
    function createPRNG(seed) {
        if (seed == null) return Math.random;
        let s = seed | 0;
        return function() {
            s |= 0; s = s + 0x6D2B79F5 | 0;
            var t = Math.imul(s ^ s >>> 15, 1 | s);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    // ============ SIMPLEX NOISE 2D ============
    // Based on Stefan Gustavson's implementation, adapted for inline use
    var _sGrad3 = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
    var _sPerm = new Uint8Array(512);
    (function() {
        var p = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,
                 247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,
                 74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,
                 65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,
                 52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,
                 119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,
                 218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,
                 157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
        for (var i = 0; i < 512; i++) _sPerm[i] = p[i & 255];
    })();
    function _simplexNoise2D(xin, yin) {
        var F2 = 0.5 * (Math.sqrt(3) - 1), G2 = (3 - Math.sqrt(3)) / 6;
        var s = (xin + yin) * F2;
        var i = Math.floor(xin + s), j = Math.floor(yin + s);
        var t = (i + j) * G2;
        var x0 = xin - (i - t), y0 = yin - (j - t);
        var i1, j1;
        if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }
        var x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
        var x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
        var ii = i & 255, jj = j & 255;
        var n0 = 0, n1 = 0, n2 = 0;
        var t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 >= 0) { t0 *= t0; var gi = _sGrad3[_sPerm[ii + _sPerm[jj]] % 12]; n0 = t0 * t0 * (gi[0] * x0 + gi[1] * y0); }
        var t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 >= 0) { t1 *= t1; var gi1 = _sGrad3[_sPerm[ii + i1 + _sPerm[jj + j1]] % 12]; n1 = t1 * t1 * (gi1[0] * x1 + gi1[1] * y1); }
        var t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 >= 0) { t2 *= t2; var gi2 = _sGrad3[_sPerm[ii + 1 + _sPerm[jj + 1]] % 12]; n2 = t2 * t2 * (gi2[0] * x2 + gi2[1] * y2); }
        return 70 * (n0 + n1 + n2);
    }

    // ============ IMAGE PROCESSING ============
    const ImageProcessor = {
        // Sobel edge detection
        detectEdges(sourceContext, strength = 1) {
            const canvas = sourceContext.canvas;
            const width = canvas.width;
            const height = canvas.height;
            const imageData = sourceContext.getImageData(0, 0, width, height);
            const data = imageData.data;
            const output = new Uint8ClampedArray(data.length);

            const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
            const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    let gxR = 0, gyR = 0, gxG = 0, gyG = 0, gxB = 0, gyB = 0;

                    for (let ky = -1; ky <= 1; ky++) {
                        for (let kx = -1; kx <= 1; kx++) {
                            const idx = ((y + ky) * width + (x + kx)) * 4;
                            const ki = (ky + 1) * 3 + (kx + 1);
                            gxR += data[idx] * sobelX[ki];
                            gyR += data[idx] * sobelY[ki];
                            gxG += data[idx + 1] * sobelX[ki];
                            gyG += data[idx + 1] * sobelY[ki];
                            gxB += data[idx + 2] * sobelX[ki];
                            gyB += data[idx + 2] * sobelY[ki];
                        }
                    }

                    const idx = (y * width + x) * 4;
                    output[idx] = 255 - Math.min(255, Math.sqrt(gxR * gxR + gyR * gyR) * strength);
                    output[idx + 1] = 255 - Math.min(255, Math.sqrt(gxG * gxG + gyG * gyG) * strength);
                    output[idx + 2] = 255 - Math.min(255, Math.sqrt(gxB * gxB + gyB * gyB) * strength);
                    output[idx + 3] = 255;
                }
            }

            for (let i = 0; i < data.length; i++) {
                imageData.data[i] = output[i] || (i % 4 === 3 ? 255 : 255);
            }
            sourceContext.putImageData(imageData, 0, 0);
        },

        blendEdges(sourceContext, originalData, edgeMix = 0.5) {
            const width = sourceContext.canvas.width;
            const height = sourceContext.canvas.height;
            const imageData = sourceContext.getImageData(0, 0, width, height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.round(originalData[i] * (1 - edgeMix) + data[i] * edgeMix);
                data[i + 1] = Math.round(originalData[i + 1] * (1 - edgeMix) + data[i + 1] * edgeMix);
                data[i + 2] = Math.round(originalData[i + 2] * (1 - edgeMix) + data[i + 2] * edgeMix);
            }
            sourceContext.putImageData(imageData, 0, 0);
        }
    };

    // ============ UTILS ============
    const Utils = {
        _getPixelData(sourceContext) {
            var width = sourceContext.canvas.width,
                height = sourceContext.canvas.height,
                imageData = sourceContext.getImageData(0, 0, width, height);
            return new Uint8Array(imageData.data);
        },

        _getWorkingData(sourceContext) {
            var width = sourceContext.canvas.width,
                height = sourceContext.canvas.height;
            return new Uint8Array(width * height * 3);
        },

        _getOutputDimensions(imageElement, outputSize) {
            var width, height;

            if (outputSize === 'original') {
                width = imageElement.naturalWidth;
                height = imageElement.naturalHeight;
            } else {
                width = imageElement.parentNode.clientWidth;
                height = imageElement.parentNode.clientHeight || imageElement.naturalHeight;
            }
            return { width, height };
        },

        _indexToRgbString(i) {
            var color;
            if (i % 3 === 0) {
                color = '#0000ff';
            } else if (i % 2 === 0) {
                color = '#00ff00';
            } else {
                color = '#ff0000';
            }
            return color;
        }
    };

    // ============ PATH QUEUE ============
    class PathQueue {
        constructor(size) {
            this.size = size;
            this.queue = [];
        }

        put(item) {
            this.queue.push(item);
            if (this.size < this.queue.length) {
                this.queue.shift();
            }
        }

        get(index) {
            if (0 <= index) {
                return this.queue[index];
            } else {
                return this.queue[this.queue.length + index];
            }
        }
    }

    // ============ PATH FINDER ============
    class PathFinder {
        constructor(pixelData, workingData, width, height, targetColor, initX = 0, initY = 0, options = {}) {
            this.pixelData = pixelData;
            this.guidanceData = options.guidanceData || pixelData;
            this.workingData = workingData;
            this.arrayWidth = width;
            this.arrayHeight = height;
            this.x = Math.round(initX);
            this.y = Math.round(initY);
            this.options = options;
            this.pathQueue = new PathQueue(options.pathMemory || 10);
            this.velocity = options.startingVelocity;
            this.jitter = options.jitter || 0;

            this.targetColor = typeof targetColor === 'string' ? this._hexToRgb(targetColor) : targetColor;
            this.rgbIndex = this._getRgbIndex(this.targetColor);
            this.alphaThreshold = options.alphaThreshold || MAX;
            this.random = options.random || Math.random;

            // Face landmark gravity
            if (options.faceLandmarks && options.faceLandmarks.length > 0) {
                this.faceLandmarks = options.faceLandmarks;
                this.faceGravityStrength = options.faceGravityStrength || 0.3;
                this.faceGravityRadius = options.faceGravityRadius || 100;
            } else {
                this.faceLandmarks = null;
            }

            // Force nodes (gravity/repulsion fields)
            this.forceNodes = options.forceNodes || null;

            // Face boundary containment (for face-seeded pathfinders)
            this.faceMask = options.faceMask || null;
            this.faceMaskWidth = options.faceMaskWidth || 0;

            // Semantic region detection
            this.regionMask = options.regionMask || null;
            this.regionMaskWidth = options.regionMaskWidth || 0;
            this.regionProfiles = options.regionProfiles || null;

            // Radial navigation bias
            if (options.radialEnabled) {
                this.isRadial = this.random() * 100 < (options.radialPercent || 0);
                this.radialDirection = this.random() * 100 < (options.radialCW || 50) ? 1 : -1;
                this.radialStrength = options.radialStrength || 0;
                this.radialRadius = options.radialRadius || 100;
                this.radialCenterX = options.radialCenterX || 0;
                this.radialCenterY = options.radialCenterY || 0;

                // Spiral drift state
                this.radialOnConverge = options.radialOnConverge || 'stick';
                this.radialMinRadius = options.radialMinRadius || 10;
                this.radialTargetRadius = this.radialRadius;
                this.radialDriftDirection = 1; // 1=inward, -1=outward (for pulse)

                if (options.radialDrift > 0) {
                    var bandPosition = this.random(); // 0-1 continuous
                    var spread = (options.radialDriftSpread || 100) / 100;
                    var driftFactor = 1 - spread * (1 - bandPosition);
                    driftFactor = Math.max(0.05, driftFactor); // min 5% of base rate
                    var baseDrift = (options.radialDrift / 100) * (this.radialRadius / 500);
                    this.radialDriftRate = baseDrift * driftFactor;
                } else {
                    this.radialDriftRate = 0;
                }
            } else {
                this.isRadial = false;
            }

            this.comparatorFn = (distance, closest) => {
                return this.options.key === 'low'
                    ? (0 < distance && distance < closest)
                    : (closest < distance && distance < MAX);
            };

            // Math mode state
            this.mathMode = options.mathMode || 'none';
            this.mathStrength = (options.mathStrength || 50) / 100;
            this.mathCenterX = options.mathCenterXpx || 0;
            this.mathCenterY = options.mathCenterYpx || 0;
            if (this.mathMode !== 'none') {
                // Fibonacci / phyllotaxis
                this.mathPhyStep = Math.floor(this.random() * 1000);
                // Euler / clothoid
                this.mathCurvature = 0;
                this.mathCurvDir = 1;
                this.mathCurvRate = (options.mathCurvatureRate || 30) / 100 * 0.02;
                this.mathCurvMax = (options.mathCurvatureMax || 50) / 100 * Math.PI;
                // Lissajous
                this.mathLissT = this.random() * Math.PI * 2;
                this.mathLissDelta = this.random() * Math.PI * 2;
                this.mathLissFreqX = options.mathFreqX || 3;
                this.mathLissFreqY = options.mathFreqY || 2;
                this.mathLissRate = (options.mathLissRate || 50) / 100 * 0.05;
                // Lorenz
                this.mathLx = 0.1 + this.random() * 0.2;
                this.mathLy = 0.1 + this.random() * 0.2;
                this.mathLz = 0.1 + this.random() * 0.2;
                // L-system
                this.mathLSysTimer = 0;
                this.mathLSysGen = options.mathGenerations || 4;
                this.mathLSysBranched = false;
                // Boids ref (set externally)
                this.boidsGrid = null;
                this.boidsRenderers = null;
            }
        }

        getNextPoint() {
            var result,
                i = 0,
                limit = 5;

            do {
                result = this._getNextPixel();
                i++;
            } while(i <= limit && result.isPristine === false);

            return result.nextPixel;
        }

        _getNextPixel() {
            var theta = this._getVelocityAngle(),
                isPristine,
                closestColor = this.options.key === 'low' ? 100000 : 0,
                nextPixel,
                defaultNextPixel,
                arcSize = this.options.turningAngle,
                radius = Math.round(Math.sqrt(Math.pow(this.velocity[0], 2) + Math.pow(this.velocity[1], 2))),
                sampleSize = this.options.sampleSize || 4;

            // Apply jitter to the base angle
            if (this.jitter > 0) {
                theta += (this.random() - 0.5) * this.jitter * Math.PI;
            }

            // Radial navigation bias (with spiral drift)
            if (this.isRadial) {
                var rdx = this.x - this.radialCenterX,
                    rdy = this.y - this.radialCenterY,
                    dist = Math.sqrt(rdx * rdx + rdy * rdy);

                if (dist > 1) {
                    var angleFromCenter = Math.atan2(rdy, rdx),
                        tangentAngle = angleFromCenter + this.radialDirection * Math.PI / 2,
                        radiusError = (this.radialTargetRadius - dist) / this.radialTargetRadius,
                        correctionWeight = Math.max(-0.5, Math.min(0.5, radiusError * 0.5)),
                        tX = Math.cos(tangentAngle) + correctionWeight * rdx / dist,
                        tY = Math.sin(tangentAngle) + correctionWeight * rdy / dist,
                        radialTarget = Math.atan2(tY, tX),
                        s = this.radialStrength;

                    theta = Math.atan2(
                        (1 - s) * Math.sin(theta) + s * Math.sin(radialTarget),
                        (1 - s) * Math.cos(theta) + s * Math.cos(radialTarget)
                    );

                    // Apply spiral drift — shrink or grow target radius
                    if (this.radialDriftRate > 0) {
                        this.radialTargetRadius -= this.radialDriftRate * this.radialDriftDirection;

                        // Check convergence at inner limit
                        if (this.radialTargetRadius <= this.radialMinRadius) {
                            if (this.radialOnConverge === 'pulse') {
                                this.radialDriftDirection = -1; // reverse: spiral outward
                                this.radialTargetRadius = this.radialMinRadius;
                            } else if (this.radialOnConverge === 'explode') {
                                // Break radial constraint, push outward
                                this.isRadial = false;
                                var pushAngle = angleFromCenter + (this.random() - 0.5) * (Math.PI / 4);
                                var pushSpeed = Math.sqrt(this.velocity[0] * this.velocity[0] + this.velocity[1] * this.velocity[1]);
                                this.velocity = [
                                    Math.cos(pushAngle) * pushSpeed,
                                    Math.sin(pushAngle) * pushSpeed
                                ];
                            } else {
                                // 'stick' — clamp and keep orbiting
                                this.radialTargetRadius = this.radialMinRadius;
                                this.radialDriftRate = 0;
                            }
                        }

                        // Check outer limit (pulse bouncing back)
                        if (this.radialDriftDirection === -1 && this.radialTargetRadius >= this.radialRadius) {
                            this.radialDriftDirection = 1; // reverse: spiral inward again
                            this.radialTargetRadius = this.radialRadius;
                        }
                    }
                }
            }

            // Face landmark gravity: bias heading toward nearest landmark
            if (this.faceLandmarks) {
                var nearestDistSq = Infinity, nearestAngle = theta;
                for (var fli = 0; fli < this.faceLandmarks.length; fli++) {
                    var flm = this.faceLandmarks[fli];
                    var fldx = flm.x - this.x, fldy = flm.y - this.y;
                    var fld = fldx * fldx + fldy * fldy;
                    if (fld < nearestDistSq) {
                        nearestDistSq = fld;
                        nearestAngle = Math.atan2(fldy, fldx);
                    }
                }
                var nearestDist = Math.sqrt(nearestDistSq);
                if (nearestDist > 2 && nearestDist < this.faceGravityRadius) {
                    var gs = this.faceGravityStrength * (1 - nearestDist / this.faceGravityRadius);
                    theta = Math.atan2(
                        (1 - gs) * Math.sin(theta) + gs * Math.sin(nearestAngle),
                        (1 - gs) * Math.cos(theta) + gs * Math.cos(nearestAngle)
                    );
                }
            }

            // Force node gravity/repulsion/vortex/directional: blend each node's effect sequentially
            if (this.forceNodes) {
                for (var fni = 0; fni < this.forceNodes.length; fni++) {
                    var fnNode = this.forceNodes[fni];
                    var fnEffect = this._computeForceNodeEffect(fnNode, this.x, this.y);
                    if (fnEffect) {
                        var fnw = fnEffect.weight;
                        // Brightness modulation: scale weight by pixel luminance
                        if (fnNode.brightnessMode > 0) {
                            var bIdx = (Math.round(this.y) * this.arrayWidth + Math.round(this.x)) * 4;
                            var lum = (0.299 * this.pixelData[bIdx] + 0.587 * this.pixelData[bIdx + 1] + 0.114 * this.pixelData[bIdx + 2]) / 255;
                            fnw *= fnNode.brightnessMode === 1 ? lum : (1 - lum);
                        }
                        theta = Math.atan2(
                            (1 - fnw) * Math.sin(theta) + fnw * Math.sin(fnEffect.angle),
                            (1 - fnw) * Math.cos(theta) + fnw * Math.cos(fnEffect.angle)
                        );
                    }
                }
            }

            // Natural math mode: bias heading by mathematical behavior
            if (this.mathMode !== 'none') {
                var mathTarget = this._computeMathBias(theta);
                if (mathTarget !== null) {
                    var mw = this.mathStrength;
                    theta = Math.atan2(
                        (1 - mw) * Math.sin(theta) + mw * Math.sin(mathTarget),
                        (1 - mw) * Math.cos(theta) + mw * Math.cos(mathTarget)
                    );
                }
            }

            // Region profile overrides for pathfinding params
            if (this.regionMask && this.regionProfiles) {
                var regionId = this.regionMask[this.y * this.regionMaskWidth + this.x];
                var overrides = this.regionProfiles[regionId];
                if (overrides) {
                    if (overrides.turningAngle !== undefined) arcSize = overrides.turningAngle;
                    if (overrides.sampleSize !== undefined) sampleSize = overrides.sampleSize;
                    if (overrides.speed !== undefined) radius = overrides.speed;
                }
            }

            for(let angle = theta - arcSize / 2, deviance = -sampleSize/2; angle <= theta + arcSize / 2; angle += arcSize / sampleSize, deviance++) {
                let x = this.x + Math.round(radius * Math.cos(angle)),
                    y = this.y + Math.round(radius * Math.sin(angle)),
                    colorDistance = MAX;

                if (this._isInRange(x, y)) {
                    let wIdx = (y * this.arrayWidth + x) * 3 + this.rgbIndex,
                        pIdx = (y * this.arrayWidth + x) * 4,
                        visited = this.workingData[wIdx],
                        alpha = this.pixelData[pIdx + 3];

                    // Score using guidanceData (equalized for face), color from pixelData
                    colorDistance = MAX - this.guidanceData[pIdx + this.rgbIndex];
                    var actualColor = this.pixelData[pIdx + this.rgbIndex];

                    // Soft boundary containment: penalize leaving face mask
                    if (this.faceMask && !this.faceMask[y * this.faceMaskWidth + x]) {
                        // Make out-of-mask directions much less attractive
                        colorDistance = this.options.key === 'low' ? MAX : 0;
                    }

                    if (this.comparatorFn(colorDistance, closestColor) && !visited && alpha >= this.alphaThreshold) {
                        nextPixel = [x, y, actualColor];
                        closestColor = colorDistance;
                    }
                }

                if (deviance === 0) {
                    if (this._isInRange(x, y) && this.pixelData[(y * this.arrayWidth + x) * 4 + 3] >= this.alphaThreshold) {
                        defaultNextPixel = [x, y, this.pixelData[(y * this.arrayWidth + x) * 4 + this.rgbIndex]];
                    } else {
                        defaultNextPixel = this.pathQueue.get(-2);
                    }
                }
            }

            isPristine = typeof nextPixel !== 'undefined';
            nextPixel = nextPixel || defaultNextPixel;

            if (nextPixel) {
                this.velocity = [nextPixel[0] - this.x, nextPixel[1] - this.y];
                this.y = nextPixel[1];
                this.x = nextPixel[0];
                this._updateWorkingArray(nextPixel[1], nextPixel[0]);
                this.pathQueue.put(nextPixel);
            }

            return {
                nextPixel: nextPixel,
                isPristine: isPristine
            };
        }

        getColor() {
            return {
                r: this.targetColor[0],
                g: this.targetColor[1],
                b: this.targetColor[2]
            };
        }

        _computeMathBias(theta) {
            switch (this.mathMode) {
                case 'fibonacci': {
                    var GOLDEN_ANGLE = 2.39996322972865332;
                    var target = GOLDEN_ANGLE * this.mathPhyStep;
                    target += Math.atan2(this.y - this.mathCenterY, this.x - this.mathCenterX) + Math.PI / 2;
                    this.mathPhyStep++;
                    return target;
                }
                case 'euler': {
                    this.mathCurvature += this.mathCurvRate * this.mathCurvDir;
                    if (Math.abs(this.mathCurvature) > this.mathCurvMax) this.mathCurvDir *= -1;
                    return theta + this.mathCurvature;
                }
                case 'lissajous': {
                    var t = this.mathLissT;
                    var dx = this.mathLissFreqX * Math.cos(this.mathLissFreqX * t + this.mathLissDelta);
                    var dy = this.mathLissFreqY * Math.cos(this.mathLissFreqY * t);
                    this.mathLissT += this.mathLissRate;
                    return Math.atan2(dy, dx);
                }
                case 'lorenz': {
                    var sigma = 10, rho = this.options.mathLorenzChaos || 28, beta = 8 / 3;
                    var dt = (this.options.mathLorenzDt || 50) / 100 * 0.01;
                    var dxL = sigma * (this.mathLy - this.mathLx) * dt;
                    var dyL = (this.mathLx * (rho - this.mathLz) - this.mathLy) * dt;
                    var dzL = (this.mathLx * this.mathLy - beta * this.mathLz) * dt;
                    this.mathLx += dxL;
                    this.mathLy += dyL;
                    this.mathLz += dzL;
                    return Math.atan2(dyL, dxL);
                }
                case 'flowfield': {
                    var scale = (this.options.mathFlowScale || 30) / 100 * 0.01;
                    var octaves = this.options.mathFlowOctaves || 1;
                    var evolution = (this.options.mathFlowEvolution || 0) / 100;
                    var nx = this.x * scale, ny = this.y * scale;
                    var val = 0, amp = 1, freq = 1, totalAmp = 0;
                    for (var o = 0; o < octaves; o++) {
                        val += _simplexNoise2D(nx * freq, ny * freq + evolution * this.mathPhyStep * 0.001) * amp;
                        totalAmp += amp;
                        amp *= 0.5;
                        freq *= 2;
                    }
                    this.mathPhyStep = (this.mathPhyStep || 0) + 1;
                    return (val / totalAmp) * Math.PI * 2;
                }
                case 'boids': {
                    if (!this.boidsGrid) return null;
                    var perception = (this.options.mathPerception || 50) / 100 * 150;
                    var sepW = (this.options.mathSeparation || 70) / 100;
                    var aliW = (this.options.mathAlignment || 50) / 100;
                    var cohW = (this.options.mathCohesion || 30) / 100;
                    var neighbors = this.boidsGrid.query(this.x, this.y, perception, this);
                    if (neighbors.length === 0) return null;
                    var sepX = 0, sepY = 0, aliX = 0, aliY = 0, cohX = 0, cohY = 0;
                    for (var bi = 0; bi < neighbors.length; bi++) {
                        var nb = neighbors[bi];
                        var bdx = this.x - nb.x, bdy = this.y - nb.y;
                        var bd = Math.sqrt(bdx * bdx + bdy * bdy);
                        if (bd > 0.5 && bd < perception * 0.4) {
                            sepX += bdx / bd;
                            sepY += bdy / bd;
                        }
                        aliX += nb.velocity[0];
                        aliY += nb.velocity[1];
                        cohX += nb.x;
                        cohY += nb.y;
                    }
                    var n = neighbors.length;
                    aliX /= n; aliY /= n;
                    cohX = cohX / n - this.x;
                    cohY = cohY / n - this.y;
                    var steerX = sepX * sepW + aliX * aliW + cohX * cohW;
                    var steerY = sepY * sepW + aliY * aliW + cohY * cohW;
                    if (Math.abs(steerX) < 0.001 && Math.abs(steerY) < 0.001) return null;
                    return Math.atan2(steerY, steerX);
                }
                case 'lsystem': {
                    this.mathLSysTimer++;
                    var interval = this.options.mathBranchInterval || 60;
                    if (this.mathLSysTimer >= interval && this.mathLSysGen > 0) {
                        this.mathLSysTimer = 0;
                        this.mathLSysBranched = true;
                    }
                    return null; // L-system doesn't bias heading, it branches
                }
                default:
                    return null;
            }
        }

        _getVelocityAngle() {
            var projectedX = this.x + this.velocity[0],
                projectedY = this.y + this.velocity[1],
                margin = this.options.speed,
                dy = this.y + this.velocity[1] - this.y,
                dx = this.x + this.velocity[0] - this.x,
                angle;

            if (projectedX <= margin || this.arrayWidth - margin <= projectedX) {
                dx *= -1;
            }
            if (projectedY <= margin || this.arrayHeight - margin <= projectedY) {
                dy *= -1;
            }

            angle = Math.atan2(dy, dx);
            return angle;
        }

        _hexToRgb(hex) {
            var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
            hex = hex.replace(shorthandRegex, function(m, r, g, b) {
                return r + r + g + g + b + b;
            });

            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? [
                parseInt(result[1], 16),
                parseInt(result[2], 16),
                parseInt(result[3], 16)
            ] : null;
        }

        _isInRange(x, y) {
            return 0 < x && x < this.arrayWidth && 0 < y && y < this.arrayHeight;
        }

        _updateWorkingArray(row, col) {
            this.workingData[(row * this.arrayWidth + col) * 3 + this.rgbIndex] = 1;
        }

        _getRgbIndex(targetColorArray) {
            var i;
            for (i = 0; i < 2; i++) {
                if (targetColorArray[i] !== 0) {
                    break;
                }
            }
            return i;
        }

        _computeForceNodeEffect(node, px, py) {
            var dx = node.cx - px, dy = node.cy - py;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 0.5) return null; // at center, no meaningful direction

            var outerR = node.radiusPx;
            var innerR = outerR * node.ring;
            var strength = node.strength;
            var force;

            if (dist < innerR) {
                // Donut hole: ramp from 0 at center to strength at inner edge
                force = (innerR > 0) ? (dist / innerR) * strength : strength;
            } else if (dist <= outerR) {
                // Ring body: full strength
                force = strength;
            } else {
                // Outside: Gaussian falloff
                var d = dist - outerR;
                var sigma = outerR * (1 + node.falloff * 2);
                if (sigma < 1) sigma = 1;
                force = strength * Math.exp(-(d * d) / (2 * sigma * sigma));
            }

            if (force < 0.001) return null;

            var angle;
            if (node.type === 'repulsion') {
                angle = Math.atan2(dy, dx) + Math.PI;
            } else if (node.type === 'vortex') {
                // Tangential: perpendicular to radial, direction controls CW/CCW
                var radialAngle = Math.atan2(dy, dx);
                angle = radialAngle + (node.direction >= Math.PI ? -1 : 1) * Math.PI / 2;
            } else if (node.type === 'directional') {
                // Fixed compass heading, independent of pathfinder position
                angle = node.direction;
            } else {
                // gravity: attract toward center
                angle = Math.atan2(dy, dx);
            }

            return { angle: angle, weight: force };
        }
    }

    // ============ SPATIAL HASH GRID (for Boids) ============
    class SpatialHashGrid {
        constructor(cellSize) {
            this.cellSize = cellSize;
            this.cells = {};
        }
        clear() { this.cells = {}; }
        _key(cx, cy) { return cx + ',' + cy; }
        insert(pf) {
            var cx = Math.floor(pf.x / this.cellSize);
            var cy = Math.floor(pf.y / this.cellSize);
            var k = this._key(cx, cy);
            if (!this.cells[k]) this.cells[k] = [];
            this.cells[k].push(pf);
        }
        query(x, y, radius, exclude) {
            var r = Math.ceil(radius / this.cellSize);
            var cx = Math.floor(x / this.cellSize);
            var cy = Math.floor(y / this.cellSize);
            var results = [];
            var r2 = radius * radius;
            for (var dx = -r; dx <= r; dx++) {
                for (var dy = -r; dy <= r; dy++) {
                    var cell = this.cells[this._key(cx + dx, cy + dy)];
                    if (!cell) continue;
                    for (var i = 0; i < cell.length; i++) {
                        if (cell[i] === exclude) continue;
                        var ddx = cell[i].x - x, ddy = cell[i].y - y;
                        if (ddx * ddx + ddy * ddy < r2) results.push(cell[i]);
                    }
                }
            }
            return results;
        }
    }

    // ============ PATH RENDERER ============
    class PathRenderer {
        constructor(context, pathFinder, options) {
            this.context = context;
            this.pathFinder = pathFinder;
            this.options = options;
            this.color = pathFinder.getColor();
            this.svgPath = '';
            this.svgCircles = [];
            this.svgRects = [];
            this.regionMask = pathFinder.regionMask;
            this.regionMaskWidth = pathFinder.regionMaskWidth;
            this.regionProfiles = pathFinder.regionProfiles;
        }

        _getRegionOverrides(x, y) {
            if (!this.regionMask || !this.regionProfiles) return null;
            var regionId = this.regionMask[y * this.regionMaskWidth + x];
            return this.regionProfiles[regionId] || null;
        }

        drawNextLine() {
            if (this.options.lineMode === 'pixel-grid') {
                this._drawPixelGrid();
                return;
            }
            if (this.options.lineMode === 'smooth') {
                this._drawLineSmooth();
            } else if (this.options.lineMode === 'square') {
                this._drawLineSquare();
            } else {
                this._drawPoint();
            }
        }

        _drawLineSmooth() {
            var midX, midY, midColor, lineLength,
                nextPoint = this.pathFinder.getNextPoint(this.context);

            if (nextPoint) {
                if (typeof this.currentPoint === 'undefined') {
                    this.currentPoint = nextPoint;
                }
                if (typeof this.controlPoint === 'undefined') {
                    this.controlPoint = nextPoint;
                }

                midX = Math.round((this.controlPoint[0] + nextPoint[0]) / 2);
                midY = Math.round((this.controlPoint[1] + nextPoint[1]) / 2);
                midColor = Math.floor((this.currentPoint[2] + nextPoint[2]) / 2);
                lineLength = this._getLineLength(this.currentPoint, nextPoint);

                if (lineLength <= this.options.speed * 3) {
                    let grad,
                        startColorValue = this.currentPoint[2],
                        endColorValue = nextPoint[2];

                    grad = this._createGradient(this.currentPoint, nextPoint, startColorValue, endColorValue);
                    this.context.strokeStyle = grad;
                    var rOvr = this._getRegionOverrides(nextPoint[0], nextPoint[1]);
                    this.context.lineWidth = (rOvr && rOvr.lineWidth !== undefined) ? rOvr.lineWidth : this.options.lineWidth;
                    this.context.lineCap = this.options.lineCap || 'round';
                    this.context.beginPath();
                    this.context.moveTo(this.currentPoint[0], this.currentPoint[1]);
                    this.context.quadraticCurveTo(this.controlPoint[0], this.controlPoint[1], midX, midY);
                    this.context.stroke();
                    if (!this.svgPath) {
                        this.svgPath = 'M' + this.currentPoint[0] + ' ' + this.currentPoint[1];
                    }
                    this.svgPath += ' Q' + this.controlPoint[0] + ' ' + this.controlPoint[1] + ' ' + midX + ' ' + midY;
                }

                this.currentPoint = [midX, midY, midColor];
                this.controlPoint = nextPoint;
            }
        }

        _drawLineSquare() {
            var lineLength,
                nextPoint = this.pathFinder.getNextPoint(this.context);

            if(nextPoint) {
                if (typeof this.currentPoint === 'undefined') {
                    this.currentPoint = nextPoint;
                }

                lineLength = this._getLineLength(this.currentPoint, nextPoint);

                if (lineLength <= this.options.speed + 1) {
                    let grad,
                        startColorValue = this.currentPoint[2],
                        endColorValue = nextPoint[2];

                    grad = this._createGradient(this.currentPoint, nextPoint, startColorValue, endColorValue);
                    this.context.strokeStyle = grad;
                    var rOvr2 = this._getRegionOverrides(nextPoint[0], nextPoint[1]);
                    this.context.lineWidth = (rOvr2 && rOvr2.lineWidth !== undefined) ? rOvr2.lineWidth : this.options.lineWidth;
                    this.context.lineCap = this.options.lineCap || 'round';
                    this.context.beginPath();
                    this.context.moveTo(this.currentPoint[0], this.currentPoint[1]);
                    this.context.lineTo(nextPoint[0], nextPoint[1]);
                    this.context.stroke();
                    if (!this.svgPath) {
                        this.svgPath = 'M' + this.currentPoint[0] + ' ' + this.currentPoint[1];
                    }
                    this.svgPath += ' L' + nextPoint[0] + ' ' + nextPoint[1];
                }
                this.currentPoint = nextPoint;
            }
        }

        _drawPoint() {
            var lineLength,
                nextPoint = this.pathFinder.getNextPoint(this.context);

            if(nextPoint) {
                if (typeof this.currentPoint === 'undefined') {
                    this.currentPoint = nextPoint;
                }

                lineLength = this._getLineLength(this.currentPoint, nextPoint);

                if (lineLength >= this.options.speed * 2) {
                    this.context.beginPath();
                    this.context.arc(nextPoint[0], nextPoint[1], this.options.lineWidth, 0, 2 * Math.PI, false);
                    this.context.fillStyle = this._getStrokeColor(nextPoint[2]);
                    this.context.fill();
                    this.svgCircles.push([nextPoint[0], nextPoint[1], this.options.lineWidth]);
                    this.currentPoint = nextPoint;
                }
            }
        }

        _drawPixelGrid() {
            var nextPoint = this.pathFinder.getNextPoint(this.context);
            if (!nextPoint) return;

            var ps = this.options.pixelSize;
            var col = Math.floor(nextPoint[0] / ps);
            var row = Math.floor(nextPoint[1] / ps);
            var cols = this.options.gridCols;
            var rows = this.options.gridRows;

            if (col < 0 || col >= cols || row < 0 || row >= rows) return;

            var cellIdx = row * cols + col;
            if (this.options.pixelRevealed[cellIdx]) return;

            var gi = cellIdx * 3;
            var grid = this.options.pixelGrid;
            var r = grid[gi], g = grid[gi + 1], b = grid[gi + 2];

            this.context.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
            this.context.fillRect(col * ps, row * ps, ps, ps);

            this.options.pixelRevealed[cellIdx] = 1;
            this.svgRects.push([col * ps, row * ps, ps, ps, r, g, b]);
        }

        _getLineLength(p1, p2) {
            var dx = p2[0] - p1[0];
            var dy = p2[1] - p1[1];
            return Math.round(Math.sqrt(dx*dx + dy*dy));
        }

        _createGradient(p1, p2, color1, color2) {
            var grad = this.context.createLinearGradient(p1[0], p1[1], p2[0], p2[1]);
            grad.addColorStop(0, this._getStrokeColor(color1));
            grad.addColorStop(1, this._getStrokeColor(color2));
            return grad;
        }

        _getStrokeColor(colorValue, opacityOverride) {
            var colorString,
                opacity = opacityOverride !== undefined ? opacityOverride : (this.options.lineOpacity !== undefined ? this.options.lineOpacity : 1);

            if (this.options.colorMode === 'color') {
                colorString = 'rgba(' +
                    (this.color.r !== 0 ? colorValue : 0) + ', ' +
                    (this.color.g !== 0 ? colorValue : 0) + ', ' +
                    (this.color.b !== 0 ? colorValue : 0) + ', ' + opacity + ')';
            } else {
                colorString = 'rgba(' + colorValue + ', ' + colorValue + ', ' + colorValue + ', ' + opacity + ')';
            }
            return colorString;
        }
    }

    // ============ CHROMATA ============
    class Chromata {
        constructor(imageElement, options = {}) {
            var renderCanvas = document.createElement('canvas'),
                renderContext = renderCanvas.getContext('2d'),
                sourceCanvas = document.createElement('canvas'),
                sourceContext = sourceCanvas.getContext('2d'),
                image = new Image(),
                dimensions,
                ready = false;

            renderCanvas.setAttribute("id", "chromataCanvas");
            this.options = this._mergeOptions(options);

            image.crossOrigin = "Anonymous";
            image.addEventListener('load', () => {
                dimensions = Utils._getOutputDimensions(imageElement, this.options.outputSize);
                sourceCanvas.width = renderCanvas.width = dimensions.width;
                sourceCanvas.height = renderCanvas.height = dimensions.height;
                sourceContext.drawImage(image, 0, 0, dimensions.width, dimensions.height);

                // Apply edge detection if enabled
                if (this.options.edgeDetect > 0) {
                    const originalData = sourceContext.getImageData(0, 0, dimensions.width, dimensions.height).data.slice();
                    ImageProcessor.detectEdges(sourceContext, this.options.edgeStrength);
                    if (this.options.edgeDetect < 1) {
                        ImageProcessor.blendEdges(sourceContext, originalData, this.options.edgeDetect);
                    }
                }

                this.dimensions = dimensions;
                this.pixelData = Utils._getPixelData(sourceContext);
                this.workingData = Utils._getWorkingData(sourceContext);

                // Pre-compute pixel grid if in pixel-grid mode
                if (this.options.lineMode === 'pixel-grid') {
                    this._computePixelGrid();
                }

                // Build guidance map: face region histogram-equalized for even navigation
                this.guidanceData = this.pixelData;
                if (this.options.faceLandmarks && this.options.faceLandmarks.length > 0) {
                    var fsx = dimensions.width / (image.naturalWidth || dimensions.width);
                    var fsy = dimensions.height / (image.naturalHeight || dimensions.height);
                    var w = dimensions.width, h = dimensions.height;

                    // Build face mask via canvas polygon
                    var maskCanvas = document.createElement('canvas');
                    maskCanvas.width = w;
                    maskCanvas.height = h;
                    var maskCtx = maskCanvas.getContext('2d');
                    maskCtx.fillStyle = '#fff';
                    for (var fi = 0; fi < this.options.faceLandmarks.length; fi++) {
                        var lms = this.options.faceLandmarks[fi];
                        if (!lms || lms.length < 68) continue;
                        maskCtx.beginPath();
                        maskCtx.moveTo(lms[0].x * fsx, lms[0].y * fsy);
                        for (var li = 1; li <= 16; li++) {
                            maskCtx.lineTo(lms[li].x * fsx, lms[li].y * fsy);
                        }
                        var browMidY = (lms[19].y + lms[24].y) / 2;
                        var jawBottomY = lms[8].y;
                        var foreheadY = (browMidY - (jawBottomY - browMidY) * 0.6) * fsy;
                        maskCtx.lineTo(lms[26].x * fsx, foreheadY);
                        maskCtx.lineTo(lms[24].x * fsx, foreheadY);
                        maskCtx.lineTo(lms[19].x * fsx, foreheadY);
                        maskCtx.lineTo(lms[17].x * fsx, foreheadY);
                        maskCtx.closePath();
                        maskCtx.fill();
                    }
                    var maskPixels = maskCtx.getImageData(0, 0, w, h).data;
                    this._faceMaskFlat = new Uint8Array(w * h);
                    for (var mi = 0; mi < this._faceMaskFlat.length; mi++) {
                        this._faceMaskFlat[mi] = maskPixels[mi * 4 + 3] > 0 ? 1 : 0;
                    }

                    // Histogram equalization per RGB channel inside face mask
                    var src = this.pixelData;
                    var guide = new Uint8ClampedArray(src.length);
                    guide.set(src); // start as copy

                    for (var ch = 0; ch < 3; ch++) {
                        // Build histogram for this channel inside face
                        var hist = new Int32Array(256);
                        var facePixelCount = 0;
                        for (var i = 0; i < this._faceMaskFlat.length; i++) {
                            if (this._faceMaskFlat[i]) {
                                hist[src[i * 4 + ch]]++;
                                facePixelCount++;
                            }
                        }
                        if (facePixelCount === 0) continue;

                        // Cumulative distribution function
                        var cdf = new Int32Array(256);
                        cdf[0] = hist[0];
                        for (var v = 1; v < 256; v++) {
                            cdf[v] = cdf[v - 1] + hist[v];
                        }
                        // Find min non-zero CDF value
                        var cdfMin = 0;
                        for (var v = 0; v < 256; v++) {
                            if (cdf[v] > 0) { cdfMin = cdf[v]; break; }
                        }

                        // Build lookup table
                        var lut = new Uint8ClampedArray(256);
                        var denom = facePixelCount - cdfMin;
                        if (denom > 0) {
                            for (var v = 0; v < 256; v++) {
                                lut[v] = Math.round((cdf[v] - cdfMin) / denom * 255);
                            }
                        }

                        // Apply LUT to face pixels in guidance data
                        for (var i = 0; i < this._faceMaskFlat.length; i++) {
                            if (this._faceMaskFlat[i]) {
                                guide[i * 4 + ch] = lut[src[i * 4 + ch]];
                            }
                        }
                    }
                    this.guidanceData = guide;
                }

                ready = true;
            });
            image.src = imageElement.src;

            this.loader = callback => {
                if (!ready) {
                    setTimeout(() => this.loader(callback), 50);
                } else {
                    callback();
                }
            };

            this.pixelData = null;
            this.sourceImageElement = imageElement;
            this.sourceContext = sourceContext;
            this.renderContext = renderContext;
            this.isRunning = false;
            this.iterationCount = 0;
            this.fps = 0;
            this._renderers = [];
        }

        start() {
            this.loader(() => {
                this.isRunning = true;
                if (typeof this._tick === 'undefined') {
                    this._run();
                } else {
                    this._lastTimestamp = 0;
                    this._accumulator = 0;
                    this.raf = requestAnimationFrame(this._tick);
                }
            });
        }

        stop() {
            this.isRunning = false;
            return this.iterationCount;
        }

        toggle() {
            if (this.isRunning) {
                return this.stop();
            } else {
                return this.start();
            }
        }

        reset() {
            this.isRunning = false;
            this._tick = undefined;
            this.fps = 0;
            cancelAnimationFrame(this.raf);
            this.renderContext.clearRect(0, 0, this.dimensions.width, this.dimensions.height);
            this.workingData = Utils._getWorkingData(this.sourceContext);
            this._renderers = [];
            this._pixelGrid = null;
            this._pixelRevealed = null;
            this._pixelGridCols = 0;
            this._pixelGridRows = 0;
            this._removeRenderCanvas();
        }

        exportSVG() {
            if (!this._renderers.length || !this.dimensions) return '';
            var w = this.dimensions.width, h = this.dimensions.height;
            var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">';
            svg += '<rect width="' + w + '" height="' + h + '" fill="#000"/>';

            this._renderers.forEach(function(renderer) {
                var c = renderer.color;
                var stroke = renderer.options.colorMode === 'color'
                    ? 'rgb(' + (c.r !== 0 ? 180 : 0) + ',' + (c.g !== 0 ? 180 : 0) + ',' + (c.b !== 0 ? 180 : 0) + ')'
                    : '#aaa';
                var opacity = renderer.options.lineOpacity !== undefined ? renderer.options.lineOpacity : 1;
                var width = renderer.options.lineWidth;
                var cap = renderer.options.lineCap || 'round';

                if (renderer.svgPath) {
                    svg += '<path d="' + renderer.svgPath + '" fill="none" stroke="' + stroke + '" stroke-width="' + width + '" stroke-linecap="' + cap + '" opacity="' + opacity + '"/>';
                }
                renderer.svgCircles.forEach(function(circle) {
                    svg += '<circle cx="' + circle[0] + '" cy="' + circle[1] + '" r="' + circle[2] + '" fill="' + stroke + '" opacity="' + opacity + '"/>';
                });
                if (renderer.svgRects) {
                    renderer.svgRects.forEach(function(rect) {
                        svg += '<rect x="' + rect[0] + '" y="' + rect[1] + '" width="' + rect[2] + '" height="' + rect[3] + '" fill="rgb(' + rect[4] + ',' + rect[5] + ',' + rect[6] + ')"/>';
                    });
                }
            });

            svg += '</svg>';
            return svg;
        }

        getStats() {
            var stats = {
                iterations: this.iterationCount,
                fps: Math.round(this.fps),
                pathfinders: this._renderers.length
            };
            if (this._pixelRevealed && this._pixelRevealed.length > 0) {
                var revealed = 0;
                for (var i = 0; i < this._pixelRevealed.length; i++) {
                    if (this._pixelRevealed[i]) revealed++;
                }
                stats.coverage = Math.round(revealed / this._pixelRevealed.length * 100);
            }
            return stats;
        }

        updateOptions(newOpts) {
            if (!this.isRunning || !this._renderers.length) return;

            // Merge into master options
            for (var k in newOpts) {
                if (newOpts.hasOwnProperty(k)) {
                    this.options[k] = newOpts[k];
                }
            }

            // Shared PathFinder options ref (read each frame: speed, turningAngle, sampleSize, key)
            var pfOpts = this._pathFinderOptions;
            if (pfOpts) {
                if (newOpts.speed !== undefined) pfOpts.speed = newOpts.speed;
                if (newOpts.turningAngle !== undefined) pfOpts.turningAngle = newOpts.turningAngle;
                if (newOpts.sampleSize !== undefined) pfOpts.sampleSize = newOpts.sampleSize;
                if (newOpts.key !== undefined) pfOpts.key = newOpts.key;
            }

            // Shared renderOptions ref (read each draw call)
            var ro = this._renderOptions;
            if (ro) {
                if (newOpts.lineWidth !== undefined) ro.lineWidth = newOpts.lineWidth;
                if (newOpts.lineOpacity !== undefined) ro.lineOpacity = newOpts.lineOpacity;
                if (newOpts.lineMode !== undefined && newOpts.lineMode !== 'pixel-grid') ro.lineMode = newOpts.lineMode;
                if (newOpts.colorMode !== undefined) ro.colorMode = newOpts.colorMode;
                if (newOpts.speed !== undefined) ro.speed = newOpts.speed;
            }

            // Per-pathfinder instance-copied params
            this._renderers.forEach(function(renderer) {
                var pf = renderer.pathFinder;
                if (newOpts.jitter !== undefined) pf.jitter = newOpts.jitter;
                if (newOpts.alphaThreshold !== undefined) pf.alphaThreshold = newOpts.alphaThreshold;

                // Radial: re-compute px from % and scale target radius proportionally
                if (newOpts.radialStrength !== undefined) pf.radialStrength = newOpts.radialStrength;
                if (newOpts.radialCenterX !== undefined) pf.radialCenterX = newOpts.radialCenterX;
                if (newOpts.radialCenterY !== undefined) pf.radialCenterY = newOpts.radialCenterY;
                if (newOpts.radialRadius !== undefined && pf.isRadial && pf.radialRadius > 0) {
                    var ratio = newOpts.radialRadius / pf.radialRadius;
                    pf.radialRadius = newOpts.radialRadius;
                    pf.radialTargetRadius = Math.max(1, pf.radialTargetRadius * ratio);
                }

                // Force nodes: replace with new px-converted array
                if (newOpts.forceNodes !== undefined) {
                    pf.forceNodes = newOpts.forceNodes;
                }

                // Math mode live params
                if (newOpts.mathStrength !== undefined) pf.mathStrength = newOpts.mathStrength / 100;
                if (newOpts.mathCenterXpx !== undefined) pf.mathCenterX = newOpts.mathCenterXpx;
                if (newOpts.mathCenterYpx !== undefined) pf.mathCenterY = newOpts.mathCenterYpx;
                if (newOpts.mathCurvatureRate !== undefined) pf.mathCurvRate = newOpts.mathCurvatureRate / 100 * 0.02;
                if (newOpts.mathCurvatureMax !== undefined) pf.mathCurvMax = newOpts.mathCurvatureMax / 100 * Math.PI;
                if (newOpts.mathFreqX !== undefined) pf.mathLissFreqX = newOpts.mathFreqX;
                if (newOpts.mathFreqY !== undefined) pf.mathLissFreqY = newOpts.mathFreqY;
                if (newOpts.mathLissRate !== undefined) pf.mathLissRate = newOpts.mathLissRate / 100 * 0.05;
                if (newOpts.mathLorenzChaos !== undefined) pf.options.mathLorenzChaos = newOpts.mathLorenzChaos;
                if (newOpts.mathLorenzDt !== undefined) pf.options.mathLorenzDt = newOpts.mathLorenzDt;
                if (newOpts.mathFlowScale !== undefined) pf.options.mathFlowScale = newOpts.mathFlowScale;
                if (newOpts.mathFlowEvolution !== undefined) pf.options.mathFlowEvolution = newOpts.mathFlowEvolution;
                if (newOpts.mathFlowOctaves !== undefined) pf.options.mathFlowOctaves = newOpts.mathFlowOctaves;
                if (newOpts.mathSeparation !== undefined) pf.options.mathSeparation = newOpts.mathSeparation;
                if (newOpts.mathAlignment !== undefined) pf.options.mathAlignment = newOpts.mathAlignment;
                if (newOpts.mathCohesion !== undefined) pf.options.mathCohesion = newOpts.mathCohesion;
                if (newOpts.mathPerception !== undefined) pf.options.mathPerception = newOpts.mathPerception;
                if (newOpts.mathBranchInterval !== undefined) pf.options.mathBranchInterval = newOpts.mathBranchInterval;
                if (newOpts.mathBranchAngle !== undefined) pf.options.mathBranchAngle = newOpts.mathBranchAngle;
            });

            // Keep _activeForceNodes in sync for step() animation
            if (newOpts.forceNodes !== undefined) {
                this._activeForceNodes = newOpts.forceNodes;
            }

            // compositeOperation: set directly on canvas context
            if (newOpts.compositeOperation !== undefined && this.options.lineMode !== 'pixel-grid') {
                this.renderContext.globalCompositeOperation = newOpts.compositeOperation;
            }

            // Region profile live update: propagate to pathfinders and renderers
            if (newOpts.regionProfiles !== undefined) {
                this._renderers.forEach(function(renderer) {
                    renderer.pathFinder.regionProfiles = newOpts.regionProfiles;
                    renderer.regionProfiles = newOpts.regionProfiles;
                });
            }

            // Range re-sampling: when ranges change, re-sample per-pathfinder values
            if (newOpts.ranges !== undefined) {
                this._ranges = newOpts.ranges;
                if (this._ranges) {
                    var self = this;
                    this._renderers.forEach(function(renderer) {
                        var pf = renderer.pathFinder;
                        var r = self._ranges;
                        var rng = self._random;
                        if (r.speed) pf.options.speed = Math.round(r.speed.min + rng() * (r.speed.max - r.speed.min));
                        if (r.turningAngle) pf.options.turningAngle = (r.turningAngle.min + rng() * (r.turningAngle.max - r.turningAngle.min)) * Math.PI;
                        if (r.sampleSize) pf.options.sampleSize = Math.round(r.sampleSize.min + rng() * (r.sampleSize.max - r.sampleSize.min));
                        if (r.jitter) pf.jitter = (r.jitter.min + rng() * (r.jitter.max - r.jitter.min)) / 50;
                        if (r.lineWidth) renderer.options.lineWidth = r.lineWidth.min + rng() * (r.lineWidth.max - r.lineWidth.min);
                        if (r.lineOpacity) renderer.options.lineOpacity = (r.lineOpacity.min + rng() * (r.lineOpacity.max - r.lineOpacity.min)) / 100;
                        if (r.radialStrength) pf.radialStrength = (r.radialStrength.min + rng() * (r.radialStrength.max - r.radialStrength.min)) / 100;
                        if (r.radialRadius && pf.isRadial) {
                            var minDim = Math.min(self.dimensions.width, self.dimensions.height);
                            pf.radialRadius = Math.round(minDim / 2 * (r.radialRadius.min + rng() * (r.radialRadius.max - r.radialRadius.min)) / 100);
                        }
                    });
                }
            }
        }

        updatePixelData(imageData) {
            this.pixelData.set(new Uint8Array(imageData.data));
        }

        clearWorkingColumns(startX, endX) {
            var w = this.dimensions.width;
            var h = this.dimensions.height;
            if (startX < 0) startX = 0;
            if (endX > w) endX = w;
            for (var y = 0; y < h; y++) {
                for (var x = startX; x < endX; x++) {
                    var base = (y * w + x) * 3;
                    this.workingData[base] = 0;
                    this.workingData[base + 1] = 0;
                    this.workingData[base + 2] = 0;
                }
            }
        }

        _mergeOptions(options) {
            var defaults = {
                colorMode: 'color',
                compositeOperation: 'lighten',
                iterationLimit: 0,
                key: 'low',
                lineWidth: 2,
                lineMode: 'smooth',
                lineCap: 'round',
                lineOpacity: 1,
                origin: ['bottom'],
                outputSize: 'original',
                pathFinderCount: 30,
                speed: 7,
                turningAngle: Math.PI,
                sampleSize: 16,
                pathMemory: 10,
                jitter: 0,
                edgeDetect: 0,
                edgeStrength: 1,
                pixelSize: 8,
                stepsPerFrame: 1,
                alphaThreshold: 255,
                seed: null,
                mathMode: 'none',
                mathStrength: 50,
                mathCenterX: 50,
                mathCenterY: 50,
                mathCurvatureRate: 30,
                mathCurvatureMax: 50,
                mathFreqX: 3,
                mathFreqY: 2,
                mathLissRate: 50,
                mathLorenzChaos: 28,
                mathLorenzDt: 50,
                mathFlowScale: 30,
                mathFlowEvolution: 0,
                mathFlowOctaves: 1,
                mathSeparation: 70,
                mathAlignment: 50,
                mathCohesion: 30,
                mathPerception: 50,
                mathBranchInterval: 60,
                mathBranchAngle: 25,
                mathGenerations: 4,
                radialEnabled: false,
                radialStrength: 0.5,
                radialRadius: 40,
                radialCW: 50,
                radialPercent: 100,
                radialCenterX: 50,
                radialCenterY: 50,
                radialDrift: 0,
                radialDriftSpread: 100,
                radialOnConverge: 'stick',
                radialMinRadius: 5,
                focusEnabled: false,
                focusX: 50,
                focusY: 40,
                focusWidth: 30,
                focusHeight: 30,
                focusPercent: 50,
                focusRegions: [],
                faceLandmarks: [],
                faceGravityStrength: 0.3,
                faceEdgeBoost: 2.0,
                facePreFill: 0.5,
                forceNodes: [],
                ranges: null,
                regionMask: null,
                regionMaskWidth: 0,
                regionProfiles: null
            };

            var merged = {};
            for(var prop in defaults) {
                if (defaults.hasOwnProperty(prop)) {
                    merged[prop] = options[prop] !== undefined ? options[prop] : defaults[prop];
                }
            }

            merged.origin = merged.origin.constructor === Array ? merged.origin : defaults.origin;
            merged.pathFinderCount = this._limitToRange(merged.pathFinderCount, 1, 5000);
            merged.lineWidth = this._limitToRange(merged.lineWidth, 0.5, 100);
            merged.speed = this._limitToRange(merged.speed, 1, 100);
            merged.turningAngle = this._limitToRange(merged.turningAngle, 0.01, 10);
            merged.sampleSize = this._limitToRange(merged.sampleSize, 2, 64);
            merged.lineOpacity = this._limitToRange(merged.lineOpacity, 0, 1);
            merged.jitter = this._limitToRange(merged.jitter, 0, 2);
            merged.edgeDetect = this._limitToRange(merged.edgeDetect, 0, 1);
            merged.edgeStrength = this._limitToRange(merged.edgeStrength, 0.5, 3);
            merged.pixelSize = this._limitToRange(merged.pixelSize, 2, 50);
            merged.stepsPerFrame = this._limitToRange(merged.stepsPerFrame, 1, 20);
            merged.alphaThreshold = this._limitToRange(merged.alphaThreshold, 1, 255);
            merged.mathStrength = this._limitToRange(merged.mathStrength, 0, 100);
            merged.mathCenterX = this._limitToRange(merged.mathCenterX, 0, 100);
            merged.mathCenterY = this._limitToRange(merged.mathCenterY, 0, 100);
            merged.mathCurvatureRate = this._limitToRange(merged.mathCurvatureRate, 1, 100);
            merged.mathCurvatureMax = this._limitToRange(merged.mathCurvatureMax, 1, 100);
            merged.mathFreqX = this._limitToRange(merged.mathFreqX, 1, 8);
            merged.mathFreqY = this._limitToRange(merged.mathFreqY, 1, 8);
            merged.mathLissRate = this._limitToRange(merged.mathLissRate, 1, 100);
            merged.mathLorenzChaos = this._limitToRange(merged.mathLorenzChaos, 1, 100);
            merged.mathLorenzDt = this._limitToRange(merged.mathLorenzDt, 1, 100);
            merged.mathFlowScale = this._limitToRange(merged.mathFlowScale, 1, 100);
            merged.mathFlowEvolution = this._limitToRange(merged.mathFlowEvolution, 0, 100);
            merged.mathFlowOctaves = this._limitToRange(merged.mathFlowOctaves, 1, 4);
            merged.mathSeparation = this._limitToRange(merged.mathSeparation, 0, 100);
            merged.mathAlignment = this._limitToRange(merged.mathAlignment, 0, 100);
            merged.mathCohesion = this._limitToRange(merged.mathCohesion, 0, 100);
            merged.mathPerception = this._limitToRange(merged.mathPerception, 1, 100);
            merged.mathBranchInterval = this._limitToRange(merged.mathBranchInterval, 10, 200);
            merged.mathBranchAngle = this._limitToRange(merged.mathBranchAngle, 1, 90);
            merged.mathGenerations = this._limitToRange(merged.mathGenerations, 1, 6);
            merged.radialStrength = this._limitToRange(merged.radialStrength, 0, 1);
            merged.radialRadius = this._limitToRange(merged.radialRadius, 1, 100);
            merged.radialCW = this._limitToRange(merged.radialCW, 0, 100);
            merged.radialPercent = this._limitToRange(merged.radialPercent, 0, 100);
            merged.radialCenterX = this._limitToRange(merged.radialCenterX, 0, 100);
            merged.radialCenterY = this._limitToRange(merged.radialCenterY, 0, 100);
            merged.radialDrift = this._limitToRange(merged.radialDrift, 0, 100);
            merged.radialDriftSpread = this._limitToRange(merged.radialDriftSpread, 0, 100);
            merged.radialMinRadius = this._limitToRange(merged.radialMinRadius, 1, 50);
            merged.focusX = this._limitToRange(merged.focusX, 0, 100);
            merged.focusY = this._limitToRange(merged.focusY, 0, 100);
            merged.focusWidth = this._limitToRange(merged.focusWidth, 1, 100);
            merged.focusHeight = this._limitToRange(merged.focusHeight, 1, 100);
            merged.focusPercent = this._limitToRange(merged.focusPercent, 0, 100);
            merged.focusRegions = Array.isArray(options.focusRegions) ? options.focusRegions : [];
            merged.faceLandmarks = Array.isArray(options.faceLandmarks) ? options.faceLandmarks : [];
            merged.faceGravityStrength = this._limitToRange(merged.faceGravityStrength, 0, 1);
            merged.faceEdgeBoost = this._limitToRange(merged.faceEdgeBoost, 1, 4);
            merged.facePreFill = this._limitToRange(merged.facePreFill, 0, 1);
            merged.forceNodes = Array.isArray(options.forceNodes) ? options.forceNodes : [];
            // Force node extended properties are passed through in forceNodes[] objects
            // (direction, orbit, orbitSpeed, pulse, brightnessMode) — no top-level merge needed
            merged.ranges = options.ranges || null;
            merged.regionMask = options.regionMask || null;
            merged.regionMaskWidth = options.regionMaskWidth || 0;
            merged.regionProfiles = options.regionProfiles || null;

            return merged;
        }

        _limitToRange(val, low, high) {
            return Math.min(Math.max(val, low), high);
        }

        _appendRenderCanvas() {
            var parentElement = this.sourceImageElement.parentNode;
            this.sourceImageElement.style.display = 'none';
            parentElement.insertBefore(this.renderContext.canvas, this.sourceImageElement.nextSibling);
        }

        _removeRenderCanvas() {
            this.sourceImageElement.style.display = '';
            if (this.renderContext.canvas.parentNode) {
                this.renderContext.canvas.parentNode.removeChild(this.renderContext.canvas);
            }
        }

        _run() {
            this._random = createPRNG(this.options.seed);

            var pathFinders = this._initPathFinders(),
                renderOptions = {
                    colorMode: this.options.colorMode,
                    lineWidth: this.options.lineWidth,
                    lineMode: this.options.lineMode,
                    lineCap: this.options.lineCap,
                    lineOpacity: this.options.lineOpacity,
                    speed: this.options.speed,
                    pixelSize: this.options.pixelSize,
                    pixelGrid: this._pixelGrid,
                    pixelRevealed: this._pixelRevealed,
                    gridCols: this._pixelGridCols,
                    gridRows: this._pixelGridRows
                };

            // Store shared refs for live updateOptions()
            this._renderOptions = renderOptions;
            this._pathFinderOptions = pathFinders.length > 0 ? pathFinders[0].options : null;
            // Shared force node array for step() animation (orbiting/pulsing)
            this._activeForceNodes = (pathFinders.length > 0 && pathFinders[0].forceNodes) ? pathFinders[0].forceNodes : [];

            this._appendRenderCanvas();
            if (this.options.lineMode === 'pixel-grid') {
                this.renderContext.globalCompositeOperation = 'source-over';
            } else {
                this.renderContext.globalCompositeOperation = this.options.compositeOperation;
            }

            this._renderers = [];
            pathFinders.forEach((pathFinder) => {
                var ro = renderOptions;
                // Per-pathfinder render overrides from range sampling
                if (pathFinder.options._rangedLineWidth !== undefined || pathFinder.options._rangedLineOpacity !== undefined) {
                    ro = Object.assign({}, renderOptions);
                    if (pathFinder.options._rangedLineWidth !== undefined) ro.lineWidth = pathFinder.options._rangedLineWidth;
                    if (pathFinder.options._rangedLineOpacity !== undefined) ro.lineOpacity = pathFinder.options._rangedLineOpacity;
                }
                this._renderers.push(new PathRenderer(this.renderContext, pathFinder, ro));
            });

            this._lastTimestamp = 0;
            this._accumulator = 0;

            const step = () => {
                // Animate force nodes: orbiting + pulsing
                var fnNodes = this._activeForceNodes;
                if (fnNodes && fnNodes.length > 0) {
                    var t = this.iterationCount;
                    for (var fi = 0; fi < fnNodes.length; fi++) {
                        var fn = fnNodes[fi];
                        // Orbiting: move center in a circle
                        if (fn.orbitRadius > 0) {
                            var omega = fn.orbitSpeed * 2 * Math.PI / 3600;
                            fn.cx = fn._orbitCx + fn.orbitRadius * Math.cos(omega * t);
                            fn.cy = fn._orbitCy + fn.orbitRadius * Math.sin(omega * t);
                        }
                        // Pulsing: oscillate strength sinusoidally
                        if (fn.pulse > 0) {
                            fn.strength = fn._baseStrength * (0.5 + 0.5 * Math.sin(2 * Math.PI * fn.pulse * t / 60));
                        }
                    }
                }
                // Boids: rebuild spatial hash grid each frame
                if (this.options.mathMode === 'boids' && this._renderers.length > 1) {
                    if (!this._boidsGrid) this._boidsGrid = new SpatialHashGrid(100);
                    this._boidsGrid.clear();
                    for (var bi = 0; bi < this._renderers.length; bi++) {
                        this._boidsGrid.insert(this._renderers[bi].pathFinder);
                    }
                    for (var bj = 0; bj < this._renderers.length; bj++) {
                        this._renderers[bj].pathFinder.boidsGrid = this._boidsGrid;
                    }
                }

                this._renderers.forEach(renderer => {
                    for (let s = 0; s < this.options.stepsPerFrame; s++) {
                        renderer.drawNextLine();
                    }
                });

                // L-system: check for branching after stepping
                if (this.options.mathMode === 'lsystem' && this._renderers.length < 5000) {
                    var newBranches = [];
                    for (var li = 0; li < this._renderers.length; li++) {
                        var lpf = this._renderers[li].pathFinder;
                        if (lpf.mathLSysBranched && lpf.mathLSysGen > 0) {
                            lpf.mathLSysBranched = false;
                            var branchAngle = (this.options.mathBranchAngle || 25) * Math.PI / 180;
                            var baseAngle = Math.atan2(lpf.velocity[1], lpf.velocity[0]);
                            var spd = Math.sqrt(lpf.velocity[0] * lpf.velocity[0] + lpf.velocity[1] * lpf.velocity[1]);
                            // Spawn a new pathfinder branching in the opposite direction
                            var bAngle = baseAngle - branchAngle;
                            lpf.velocity = [Math.cos(baseAngle + branchAngle) * spd, Math.sin(baseAngle + branchAngle) * spd];
                            var bOpts = Object.assign({}, lpf.options);
                            bOpts.startingVelocity = [Math.cos(bAngle) * spd, Math.sin(bAngle) * spd];
                            bOpts.mathGenerations = lpf.mathLSysGen - 1;
                            var bColor = Utils._indexToRgbString(this._renderers.length + newBranches.length + 1);
                            var bpf = new PathFinder(this.pixelData, this.workingData, this.dimensions.width, this.dimensions.height, bColor, lpf.x, lpf.y, bOpts);
                            bpf.mathLSysGen = lpf.mathLSysGen - 1;
                            lpf.mathLSysGen = lpf.mathLSysGen - 1;
                            newBranches.push(new PathRenderer(this.renderContext, bpf, this._renderOptions));
                        }
                    }
                    for (var ni = 0; ni < newBranches.length; ni++) {
                        this._renderers.push(newBranches[ni]);
                    }
                }

                this.iterationCount += this.options.stepsPerFrame;
            };

            this._tick = (timestamp) => {
                if (!timestamp) timestamp = performance.now();

                if (this._lastTimestamp === 0) {
                    this._lastTimestamp = timestamp;
                    this._accumulator = TARGET_DT;
                }

                const dt = Math.min(timestamp - this._lastTimestamp, 100);
                if (dt > 0) {
                    this.fps = this.fps * 0.9 + (1000 / dt) * 0.1;
                }
                this._lastTimestamp = timestamp;
                this._accumulator += dt;

                while (this._accumulator >= TARGET_DT) {
                    if (0 < this.options.iterationLimit && this.options.iterationLimit <= this.iterationCount) {
                        this.isRunning = false;
                        this.options.iterationLimit = 0;
                        break;
                    }
                    step();
                    this._accumulator -= TARGET_DT;
                }

                if (this.isRunning) {
                    this.raf = requestAnimationFrame(this._tick);
                }
            };

            this.raf = requestAnimationFrame(this._tick);
        }

        _initPathFinders() {
            var pathFinders = [],
                count = this.options.pathFinderCount,
                origins = this.options.origin,
                options = {
                    speed: this.options.speed,
                    turningAngle: this.options.turningAngle,
                    key: this.options.key,
                    sampleSize: this.options.sampleSize,
                    pathMemory: this.options.pathMemory,
                    jitter: this.options.jitter,
                    alphaThreshold: this.options.alphaThreshold,
                    random: this._random,
                    guidanceData: this.guidanceData
                };

            // Per-pathfinder range sampling support
            this._ranges = this.options.ranges || null;
            this._baseOptions = options;

            // Region detection support
            if (this.options.regionMask && this.options.regionProfiles) {
                // Resize mask if dimensions differ from natural image size
                var maskW = this.options.regionMaskWidth || this.dimensions.width;
                var maskH = this.options.regionMask.length / maskW;
                if (maskW !== this.dimensions.width || maskH !== this.dimensions.height) {
                    var resized = new Uint8Array(this.dimensions.width * this.dimensions.height);
                    for (var ry = 0; ry < this.dimensions.height; ry++) {
                        for (var rx = 0; rx < this.dimensions.width; rx++) {
                            var srcX = Math.floor(rx * maskW / this.dimensions.width);
                            var srcY = Math.floor(ry * maskH / this.dimensions.height);
                            resized[ry * this.dimensions.width + rx] = this.options.regionMask[srcY * maskW + srcX];
                        }
                    }
                    options.regionMask = resized;
                } else {
                    options.regionMask = this.options.regionMask;
                }
                options.regionMaskWidth = this.dimensions.width;
                options.regionProfiles = this.options.regionProfiles;
            }

            // Convert radial percentages to pixel values
            if (this.options.radialEnabled) {
                var minDim = Math.min(this.dimensions.width, this.dimensions.height);
                options.radialEnabled = true;
                options.radialStrength = this.options.radialStrength;
                options.radialRadius = Math.round(minDim / 2 * this.options.radialRadius / 100);
                options.radialCW = this.options.radialCW;
                options.radialPercent = this.options.radialPercent;
                options.radialCenterX = Math.round(this.dimensions.width * this.options.radialCenterX / 100);
                options.radialCenterY = Math.round(this.dimensions.height * this.options.radialCenterY / 100);
                options.radialDrift = this.options.radialDrift;
                options.radialDriftSpread = this.options.radialDriftSpread;
                options.radialOnConverge = this.options.radialOnConverge;
                options.radialMinRadius = Math.round(minDim / 2 * this.options.radialMinRadius / 100);
            }

            // Math mode: pass params and convert center to pixels
            if (this.options.mathMode && this.options.mathMode !== 'none') {
                options.mathMode = this.options.mathMode;
                options.mathStrength = this.options.mathStrength;
                options.mathCenterXpx = Math.round(this.dimensions.width * this.options.mathCenterX / 100);
                options.mathCenterYpx = Math.round(this.dimensions.height * this.options.mathCenterY / 100);
                options.mathCurvatureRate = this.options.mathCurvatureRate;
                options.mathCurvatureMax = this.options.mathCurvatureMax;
                options.mathFreqX = this.options.mathFreqX;
                options.mathFreqY = this.options.mathFreqY;
                options.mathLissRate = this.options.mathLissRate;
                options.mathLorenzChaos = this.options.mathLorenzChaos;
                options.mathLorenzDt = this.options.mathLorenzDt;
                options.mathFlowScale = this.options.mathFlowScale;
                options.mathFlowEvolution = this.options.mathFlowEvolution;
                options.mathFlowOctaves = this.options.mathFlowOctaves;
                options.mathSeparation = this.options.mathSeparation;
                options.mathAlignment = this.options.mathAlignment;
                options.mathCohesion = this.options.mathCohesion;
                options.mathPerception = this.options.mathPerception;
                options.mathBranchInterval = this.options.mathBranchInterval;
                options.mathBranchAngle = this.options.mathBranchAngle;
                options.mathGenerations = this.options.mathGenerations;
            }

            // Convert force node percentages to pixel coordinates
            if (this.options.forceNodes && this.options.forceNodes.length > 0) {
                var fnWidth = this.dimensions.width;
                var fnHeight = this.dimensions.height;
                var fnMinDim = Math.min(fnWidth, fnHeight);
                options.forceNodes = this.options.forceNodes.map(function(n) {
                    var converted = {
                        type: n.type,
                        cx: fnWidth * n.x / 100,
                        cy: fnHeight * n.y / 100,
                        radiusPx: fnMinDim / 2 * n.radius / 100,
                        strength: n.strength,
                        ring: n.ring,
                        falloff: n.falloff,
                        // Extended properties
                        direction: (n.direction || 0) * Math.PI / 180, // degrees → radians
                        orbitRadius: fnMinDim / 2 * (n.orbit || 0) / 100, // % → pixels
                        orbitSpeed: (n.orbitSpeed || 10) / 100, // % → 0-1 scalar
                        pulse: n.pulse || 0, // Hz, 0 = off
                        brightnessMode: n.brightnessMode === 'bright' ? 1 : (n.brightnessMode === 'dark' ? 2 : 0)
                    };
                    // Store orbit center and base strength for animation
                    converted._orbitCx = converted.cx;
                    converted._orbitCy = converted.cy;
                    converted._baseStrength = converted.strength;
                    return converted;
                });
            }

            // Prepare face landmark gravity for all PathFinders
            if (this.options.faceLandmarks && this.options.faceLandmarks.length > 0) {
                var allFaceLms = [];
                var fsx = this.dimensions.width / (this.sourceImageElement.naturalWidth || this.dimensions.width);
                var fsy = this.dimensions.height / (this.sourceImageElement.naturalHeight || this.dimensions.height);
                for (var ffi = 0; ffi < this.options.faceLandmarks.length; ffi++) {
                    var ffl = this.options.faceLandmarks[ffi];
                    if (!ffl) continue;
                    for (var ffli = 0; ffli < ffl.length; ffli++) {
                        allFaceLms.push({
                            x: Math.round(ffl[ffli].x * fsx),
                            y: Math.round(ffl[ffli].y * fsy)
                        });
                    }
                }
                if (allFaceLms.length > 0) {
                    options.faceLandmarks = allFaceLms;
                    options.faceGravityStrength = this.options.faceGravityStrength;
                    var gravMinDim = Math.min(this.dimensions.width, this.dimensions.height);
                    options.faceGravityRadius = gravMinDim * 0.25;
                }
            }

            // Focus region: steal pathfinders from the total count
            var focusCount = 0;
            if (this.options.focusEnabled && this.options.focusPercent > 0) {
                focusCount = Math.round(count * this.options.focusPercent / 100);
                if (this.options.faceLandmarks && this.options.faceLandmarks.length > 0) {
                    // Give face-seeded pathfinders boundary containment
                    if (this._faceMaskFlat) {
                        options.faceMask = this._faceMaskFlat;
                        options.faceMaskWidth = this.dimensions.width;
                    }
                    this._seedFaceLandmarks(focusCount, pathFinders, options);
                    // Remove containment for edge pathfinders
                    delete options.faceMask;
                    delete options.faceMaskWidth;
                } else if (this.options.focusRegions && this.options.focusRegions.length > 0) {
                    this._seedFocusRegions(focusCount, pathFinders, options);
                } else {
                    this._seedFocusRegion(focusCount, pathFinders, options);
                }
                count = count - focusCount;
            }

            // Support weighted origins: { name: 'bottom', weight: 50 } or just 'bottom'
            // If originWeights is provided, use percentage-based distribution
            const originWeights = this.options.originWeights;

            if (originWeights && typeof originWeights === 'object') {
                // Weighted distribution mode
                let totalWeight = 0;
                for (let key in originWeights) {
                    totalWeight += originWeights[key] || 0;
                }

                // Distribute remainder equally if under 100
                const activeOrigins = Object.keys(originWeights).filter(k => originWeights[k] > 0);
                if (totalWeight < 100 && activeOrigins.length > 0) {
                    const remainder = 100 - totalWeight;
                    const perOrigin = remainder / activeOrigins.length;
                    activeOrigins.forEach(k => {
                        originWeights[k] += perOrigin;
                    });
                    totalWeight = 100;
                }

                // Spawn pathfinders based on weights
                for (let originName in originWeights) {
                    const weight = originWeights[originName];
                    if (weight <= 0) continue;
                    const originCount = Math.round(count * weight / 100);
                    this._seedByName(originName, originCount, pathFinders, options);
                }
            } else {
                // Legacy mode: equal distribution across origins array
                const pathFindersPerOrigin = count / origins.length;

                origins.forEach((origin) => {
                    if (typeof origin === 'string') {
                        this._seedByName(origin, pathFindersPerOrigin, pathFinders, options);
                    }
                });
            }

            return pathFinders;
        }

        _seedByName(originName, count, pathFinders, options) {
            // Handle X% Y% coordinate pattern
            const coordMatch = originName.match(/^(\d{1,3})%\s*(\d{1,3})%$/);
            if (coordMatch) {
                this._seedPoint(count, pathFinders, options, coordMatch[1], coordMatch[2]);
                return;
            }

            // Named origins
            switch (originName) {
                case 'top':
                    this._seedTop(count, pathFinders, options);
                    break;
                case 'bottom':
                    this._seedBottom(count, pathFinders, options);
                    break;
                case 'left':
                    this._seedLeft(count, pathFinders, options);
                    break;
                case 'right':
                    this._seedRight(count, pathFinders, options);
                    break;
                case 'top-left':
                case 'topLeft':
                    this._seedTopLeft(count, pathFinders, options);
                    break;
                case 'top-right':
                case 'topRight':
                    this._seedTopRight(count, pathFinders, options);
                    break;
                case 'bottom-left':
                case 'bottomLeft':
                    this._seedBottomLeft(count, pathFinders, options);
                    break;
                case 'bottom-right':
                case 'bottomRight':
                    this._seedBottomRight(count, pathFinders, options);
                    break;
                case 'center':
                    this._seedCenter(count, pathFinders, options);
                    break;
                default:
                    console.warn('Unknown origin:', originName);
            }
        }

        _seedTop(count, pathFinders, options) {
            var width = this.dimensions.width,
                unit = width / count,
                xPosFn = i => unit * i - unit / 2,
                yPosFn = () => this.options.speed;

            options.startingVelocity = [0, this.options.speed];
            this._seedCreateLoop(count, pathFinders, xPosFn, yPosFn, options);
        }

        _seedBottom(count, pathFinders, options) {
            var width = this.dimensions.width,
                height = this.dimensions.height,
                unit = width / count,
                xPosFn = i => unit * i - unit / 2,
                yPosFn = () => height - this.options.speed;

            options.startingVelocity = [0, -this.options.speed];
            this._seedCreateLoop(count, pathFinders, xPosFn, yPosFn, options);
        }

        _seedLeft(count, pathFinders, options) {
            var height = this.dimensions.height,
                unit = height / count,
                xPosFn = () => this.options.speed,
                yPosFn = i => unit * i - unit / 2;

            options.startingVelocity = [this.options.speed, 0];
            this._seedCreateLoop(count, pathFinders, xPosFn, yPosFn, options);
        }

        _seedRight(count, pathFinders, options) {
            var width = this.dimensions.width,
                height = this.dimensions.height,
                unit = height / count,
                xPosFn = () => width - this.options.speed,
                yPosFn = i => unit * i - unit / 2;

            options.startingVelocity = [-this.options.speed, 0];
            this._seedCreateLoop(count, pathFinders, xPosFn, yPosFn, options);
        }

        _seedTopLeft(count, pathFinders, options) {
            var xPos = this.options.speed,
                yPos = this.options.speed;

            for (let i = 1; i < count + 1; i++) {
                let color = Utils._indexToRgbString(i),
                    angle = (Math.PI / 2) * (i / count);
                options.startingVelocity = [
                    Math.cos(angle) * this.options.speed,
                    Math.sin(angle) * this.options.speed
                ];
                pathFinders.push(this._createPathFinder(color, xPos, yPos, options));
            }
        }

        _seedTopRight(count, pathFinders, options) {
            var xPos = this.dimensions.width - this.options.speed,
                yPos = this.options.speed;

            for (let i = 1; i < count + 1; i++) {
                let color = Utils._indexToRgbString(i),
                    angle = (Math.PI / 2) + (Math.PI / 2) * (i / count);
                options.startingVelocity = [
                    Math.cos(angle) * this.options.speed,
                    Math.sin(angle) * this.options.speed
                ];
                pathFinders.push(this._createPathFinder(color, xPos, yPos, options));
            }
        }

        _seedBottomLeft(count, pathFinders, options) {
            var xPos = this.options.speed,
                yPos = this.dimensions.height - this.options.speed;

            for (let i = 1; i < count + 1; i++) {
                let color = Utils._indexToRgbString(i),
                    angle = -(Math.PI / 2) * (i / count);
                options.startingVelocity = [
                    Math.cos(angle) * this.options.speed,
                    Math.sin(angle) * this.options.speed
                ];
                pathFinders.push(this._createPathFinder(color, xPos, yPos, options));
            }
        }

        _seedBottomRight(count, pathFinders, options) {
            var xPos = this.dimensions.width - this.options.speed,
                yPos = this.dimensions.height - this.options.speed;

            for (let i = 1; i < count + 1; i++) {
                let color = Utils._indexToRgbString(i),
                    angle = Math.PI + (Math.PI / 2) * (i / count);
                options.startingVelocity = [
                    Math.cos(angle) * this.options.speed,
                    Math.sin(angle) * this.options.speed
                ];
                pathFinders.push(this._createPathFinder(color, xPos, yPos, options));
            }
        }

        _seedCenter(count, pathFinders, options) {
            var xPos = Math.floor(this.dimensions.width / 2),
                yPos = Math.floor(this.dimensions.height / 2);

            for (let i = 1; i < count + 1; i++) {
                let color = Utils._indexToRgbString(i),
                    angle = (2 * Math.PI) * (i / count);
                options.startingVelocity = [
                    Math.cos(angle) * this.options.speed,
                    Math.sin(angle) * this.options.speed
                ];
                pathFinders.push(this._createPathFinder(color, xPos, yPos, options));
            }
        }

        _seedFocusRegion(count, pathFinders, options) {
            var w = this.dimensions.width,
                h = this.dimensions.height,
                cx = Math.round(w * this.options.focusX / 100),
                cy = Math.round(h * this.options.focusY / 100),
                rw = Math.round(w * this.options.focusWidth / 100 / 2),
                rh = Math.round(h * this.options.focusHeight / 100 / 2),
                x0 = Math.max(1, cx - rw),
                y0 = Math.max(1, cy - rh),
                x1 = Math.min(w - 1, cx + rw),
                y1 = Math.min(h - 1, cy + rh);

            for (let i = 1; i < count + 1; i++) {
                let color = Utils._indexToRgbString(i),
                    xPos = Math.round(x0 + this._random() * (x1 - x0)),
                    yPos = Math.round(y0 + this._random() * (y1 - y0)),
                    angle = this._random() * 2 * Math.PI;

                options.startingVelocity = [
                    Math.cos(angle) * this.options.speed,
                    Math.sin(angle) * this.options.speed
                ];
                pathFinders.push(this._createPathFinder(color, xPos, yPos, options));
            }
        }

        _seedFaceLandmarks(count, pathFinders, options) {
            var w = this.dimensions.width, h = this.dimensions.height;
            var natW = this.sourceImageElement.naturalWidth || w;
            var natH = this.sourceImageElement.naturalHeight || h;
            var sx = w / natW, sy = h / natH;

            // Flatten all faces' landmarks to canvas coords
            var allLandmarks = [];
            for (var fi = 0; fi < this.options.faceLandmarks.length; fi++) {
                var face = this.options.faceLandmarks[fi];
                if (!face || face.length < 68) continue;
                for (var li = 0; li < face.length; li++) {
                    allLandmarks.push({
                        x: Math.round(face[li].x * sx),
                        y: Math.round(face[li].y * sy)
                    });
                }
            }
            if (allLandmarks.length === 0) return;

            // Distribute pathfinders across landmarks evenly
            var spawned = 0;
            for (var i = 0; i < count; i++) {
                var lm = allLandmarks[i % allLandmarks.length];
                var color = Utils._indexToRgbString(pathFinders.length + 1);
                // Small random offset (5px radius) so they don't stack
                var xPos = Math.max(1, Math.min(w - 2, Math.round(lm.x + (this._random() - 0.5) * 10)));
                var yPos = Math.max(1, Math.min(h - 2, Math.round(lm.y + (this._random() - 0.5) * 10)));
                var angle = this._random() * 2 * Math.PI;
                options.startingVelocity = [
                    Math.cos(angle) * this.options.speed,
                    Math.sin(angle) * this.options.speed
                ];
                pathFinders.push(this._createPathFinder(color, xPos, yPos, options));
            }
        }

        _seedFocusRegions(count, pathFinders, options) {
            var regions = this.options.focusRegions;
            if (!regions || regions.length === 0) return;

            var w = this.dimensions.width, h = this.dimensions.height;
            // Scale from source image natural pixels to internal canvas pixels
            var natW = this.sourceImageElement.naturalWidth || w,
                natH = this.sourceImageElement.naturalHeight || h,
                sx = w / natW, sy = h / natH;

            var totalArea = 0;
            var scaled = regions.map(function(r) {
                var sr = {
                    x: Math.max(1, Math.round(r.x * sx)),
                    y: Math.max(1, Math.round(r.y * sy)),
                    width: Math.round(r.width * sx),
                    height: Math.round(r.height * sy)
                };
                sr.width = Math.min(sr.width, w - sr.x - 1);
                sr.height = Math.min(sr.height, h - sr.y - 1);
                sr.area = sr.width * sr.height;
                totalArea += sr.area;
                return sr;
            });
            if (totalArea === 0) return;

            var assigned = 0;
            for (var ri = 0; ri < scaled.length; ri++) {
                var region = scaled[ri];
                var regionCount = (ri === scaled.length - 1)
                    ? count - assigned
                    : Math.round(count * region.area / totalArea);
                assigned += regionCount;

                var x0 = region.x, y0 = region.y,
                    x1 = region.x + region.width, y1 = region.y + region.height;

                for (var i = 0; i < regionCount; i++) {
                    var color = Utils._indexToRgbString(pathFinders.length + 1),
                        xPos = Math.round(x0 + this._random() * (x1 - x0)),
                        yPos = Math.round(y0 + this._random() * (y1 - y0)),
                        angle = this._random() * 2 * Math.PI;
                    options.startingVelocity = [
                        Math.cos(angle) * this.options.speed,
                        Math.sin(angle) * this.options.speed
                    ];
                    pathFinders.push(this._createPathFinder(color, xPos, yPos, options));
                }
            }
        }

        _seedPoint(count, pathFinders, options, xPc, yPc) {
            var xPos = Math.floor(this.dimensions.width * xPc / 100),
                yPos = Math.floor(this.dimensions.height * yPc / 100);

            for (let i = 1; i < count + 1; i++) {
                let color = Utils._indexToRgbString(i),
                    direction = i % 4;

                switch (direction) {
                    case 0:
                        options.startingVelocity = [-this.options.speed, 0];
                        break;
                    case 1:
                        options.startingVelocity = [0, this.options.speed];
                        break;
                    case 2:
                        options.startingVelocity = [this.options.speed, 0];
                        break;
                    case 3:
                        options.startingVelocity = [0, -this.options.speed];
                        break;
                }

                pathFinders.push(this._createPathFinder(color, xPos, yPos, options));
            }
        }

        _computePixelGrid() {
            var ps = this.options.pixelSize;
            var w = this.dimensions.width;
            var h = this.dimensions.height;
            var cols = Math.ceil(w / ps);
            var rows = Math.ceil(h / ps);
            var grid = new Uint8ClampedArray(cols * rows * 3);
            var pd = this.pixelData;

            for (var row = 0; row < rows; row++) {
                for (var col = 0; col < cols; col++) {
                    var x0 = col * ps;
                    var y0 = row * ps;
                    var x1 = Math.min(x0 + ps, w);
                    var y1 = Math.min(y0 + ps, h);
                    var rSum = 0, gSum = 0, bSum = 0, count = 0;

                    for (var py = y0; py < y1; py++) {
                        for (var px = x0; px < x1; px++) {
                            var idx = (py * w + px) * 4;
                            rSum += pd[idx];
                            gSum += pd[idx + 1];
                            bSum += pd[idx + 2];
                            count++;
                        }
                    }

                    var gi = (row * cols + col) * 3;
                    grid[gi] = Math.round(rSum / count);
                    grid[gi + 1] = Math.round(gSum / count);
                    grid[gi + 2] = Math.round(bSum / count);
                }
            }

            this._pixelGrid = grid;
            this._pixelRevealed = new Uint8Array(cols * rows);
            this._pixelGridCols = cols;
            this._pixelGridRows = rows;
        }

        _sampleRangedOptions(options) {
            if (!this._ranges) return options;
            var sampled = Object.assign({}, options);
            var r = this._ranges;
            var rng = this._random;
            // Transform conventions match getOptions(): turningAngle is already ×π, jitter is ÷50, lineOpacity is ÷100, radialStrength is ÷100
            if (r.speed) sampled.speed = Math.round(r.speed.min + rng() * (r.speed.max - r.speed.min));
            if (r.lineWidth) sampled._rangedLineWidth = r.lineWidth.min + rng() * (r.lineWidth.max - r.lineWidth.min);
            if (r.turningAngle) sampled.turningAngle = (r.turningAngle.min + rng() * (r.turningAngle.max - r.turningAngle.min)) * Math.PI;
            if (r.jitter) sampled.jitter = (r.jitter.min + rng() * (r.jitter.max - r.jitter.min)) / 50;
            if (r.lineOpacity) sampled._rangedLineOpacity = (r.lineOpacity.min + rng() * (r.lineOpacity.max - r.lineOpacity.min)) / 100;
            if (r.sampleSize) sampled.sampleSize = Math.round(r.sampleSize.min + rng() * (r.sampleSize.max - r.sampleSize.min));
            if (r.radialStrength) sampled.radialStrength = (r.radialStrength.min + rng() * (r.radialStrength.max - r.radialStrength.min)) / 100;
            if (r.radialRadius) {
                var minDim = Math.min(this.dimensions.width, this.dimensions.height);
                sampled.radialRadius = Math.round(minDim / 2 * (r.radialRadius.min + rng() * (r.radialRadius.max - r.radialRadius.min)) / 100);
            }
            return sampled;
        }

        _createPathFinder(color, xPos, yPos, options) {
            var opts = this._sampleRangedOptions(options);
            return new PathFinder(this.pixelData, this.workingData, this.dimensions.width, this.dimensions.height, color, xPos, yPos, opts);
        }

        _seedCreateLoop(count, pathFinders, xPosFn, yPosFn, options) {
            for (let i = 1; i < count + 1; i++) {
                let color = Utils._indexToRgbString(i),
                    xPos = xPosFn(i),
                    yPos = yPosFn(i);

                pathFinders.push(this._createPathFinder(color, xPos, yPos, options));
            }
        }
    }

    window.Chromata = Chromata;
})();
