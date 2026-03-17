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

            if (this.options.key === 'low') {
                this.comparatorFn = (distance, closest) => {
                    return 0 < distance && distance < closest;
                };
            } else {
                this.comparatorFn = (distance, closest) => {
                    return closest < distance && distance < MAX;
                };
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

            for(let angle = theta - arcSize / 2, deviance = -sampleSize/2; angle <= theta + arcSize / 2; angle += arcSize / sampleSize, deviance++) {
                let x = this.x + Math.round(radius * Math.cos(angle)),
                    y = this.y + Math.round(radius * Math.sin(angle)),
                    colorDistance = MAX;

                if (this._isInRange(x, y)) {
                    let wIdx = (y * this.arrayWidth + x) * 3 + this.rgbIndex,
                        pIdx = (y * this.arrayWidth + x) * 4,
                        visited = this.workingData[wIdx],
                        alpha = this.pixelData[pIdx + 3];

                    colorDistance = MAX - this.pixelData[pIdx + this.rgbIndex];

                    if (this.comparatorFn(colorDistance, closestColor) && !visited && alpha >= this.alphaThreshold) {
                        nextPixel = [x, y, MAX - colorDistance];
                        closestColor = colorDistance;
                    }
                }

                if (deviance === 0) {
                    if (this._isInRange(x, y) && this.pixelData[(y * this.arrayWidth + x) * 4 + 3] >= this.alphaThreshold) {
                        defaultNextPixel = [x, y, MAX - colorDistance];
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
        }

        drawNextLine() {
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
                    this.context.lineWidth = this.options.lineWidth;
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
                    this.context.lineWidth = this.options.lineWidth;
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

        _getStrokeColor(colorValue) {
            var colorString,
                opacity = this.options.lineOpacity !== undefined ? this.options.lineOpacity : 1;

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
            });

            svg += '</svg>';
            return svg;
        }

        getStats() {
            return {
                iterations: this.iterationCount,
                fps: Math.round(this.fps),
                pathfinders: this._renderers.length
            };
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
                stepsPerFrame: 1,
                alphaThreshold: 255,
                seed: null
            };

            var merged = {};
            for(var prop in defaults) {
                if (defaults.hasOwnProperty(prop)) {
                    merged[prop] = options[prop] !== undefined ? options[prop] : defaults[prop];
                }
            }

            merged.origin = merged.origin.constructor === Array ? merged.origin : defaults.origin;
            merged.pathFinderCount = this._limitToRange(merged.pathFinderCount, 1, 10000);
            merged.lineWidth = this._limitToRange(merged.lineWidth, 1, 100);
            merged.speed = this._limitToRange(merged.speed, 1, 100);
            merged.turningAngle = this._limitToRange(merged.turningAngle, 0.1, 10);
            merged.sampleSize = this._limitToRange(merged.sampleSize, 2, 32);
            merged.lineOpacity = this._limitToRange(merged.lineOpacity, 0, 1);
            merged.jitter = this._limitToRange(merged.jitter, 0, 2);
            merged.edgeDetect = this._limitToRange(merged.edgeDetect, 0, 1);
            merged.edgeStrength = this._limitToRange(merged.edgeStrength, 0.5, 3);
            merged.stepsPerFrame = this._limitToRange(merged.stepsPerFrame, 1, 20);
            merged.alphaThreshold = this._limitToRange(merged.alphaThreshold, 1, 255);

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
                    speed: this.options.speed
                };

            this._appendRenderCanvas();
            this.renderContext.globalCompositeOperation = this.options.compositeOperation;

            this._renderers = [];
            pathFinders.forEach((pathFinder) => {
                this._renderers.push(new PathRenderer(this.renderContext, pathFinder, renderOptions));
            });

            this._lastTimestamp = 0;
            this._accumulator = 0;

            const step = () => {
                this._renderers.forEach(renderer => {
                    for (let s = 0; s < this.options.stepsPerFrame; s++) {
                        renderer.drawNextLine();
                    }
                });
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
                    random: this._random
                };

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
                    angle = (Math.PI / 2) * (i / count); // Spread from right to down
                options.startingVelocity = [
                    Math.cos(angle) * this.options.speed,
                    Math.sin(angle) * this.options.speed
                ];
                pathFinders.push(new PathFinder(this.pixelData, this.workingData, this.dimensions.width, this.dimensions.height, color, xPos, yPos, options));
            }
        }

        _seedTopRight(count, pathFinders, options) {
            var xPos = this.dimensions.width - this.options.speed,
                yPos = this.options.speed;

            for (let i = 1; i < count + 1; i++) {
                let color = Utils._indexToRgbString(i),
                    angle = (Math.PI / 2) + (Math.PI / 2) * (i / count); // Spread from down to left
                options.startingVelocity = [
                    Math.cos(angle) * this.options.speed,
                    Math.sin(angle) * this.options.speed
                ];
                pathFinders.push(new PathFinder(this.pixelData, this.workingData, this.dimensions.width, this.dimensions.height, color, xPos, yPos, options));
            }
        }

        _seedBottomLeft(count, pathFinders, options) {
            var xPos = this.options.speed,
                yPos = this.dimensions.height - this.options.speed;

            for (let i = 1; i < count + 1; i++) {
                let color = Utils._indexToRgbString(i),
                    angle = -(Math.PI / 2) * (i / count); // Spread from right to up
                options.startingVelocity = [
                    Math.cos(angle) * this.options.speed,
                    Math.sin(angle) * this.options.speed
                ];
                pathFinders.push(new PathFinder(this.pixelData, this.workingData, this.dimensions.width, this.dimensions.height, color, xPos, yPos, options));
            }
        }

        _seedBottomRight(count, pathFinders, options) {
            var xPos = this.dimensions.width - this.options.speed,
                yPos = this.dimensions.height - this.options.speed;

            for (let i = 1; i < count + 1; i++) {
                let color = Utils._indexToRgbString(i),
                    angle = Math.PI + (Math.PI / 2) * (i / count); // Spread from left to up
                options.startingVelocity = [
                    Math.cos(angle) * this.options.speed,
                    Math.sin(angle) * this.options.speed
                ];
                pathFinders.push(new PathFinder(this.pixelData, this.workingData, this.dimensions.width, this.dimensions.height, color, xPos, yPos, options));
            }
        }

        _seedCenter(count, pathFinders, options) {
            var xPos = Math.floor(this.dimensions.width / 2),
                yPos = Math.floor(this.dimensions.height / 2);

            for (let i = 1; i < count + 1; i++) {
                let color = Utils._indexToRgbString(i),
                    angle = (2 * Math.PI) * (i / count); // Radial burst in all directions
                options.startingVelocity = [
                    Math.cos(angle) * this.options.speed,
                    Math.sin(angle) * this.options.speed
                ];
                pathFinders.push(new PathFinder(this.pixelData, this.workingData, this.dimensions.width, this.dimensions.height, color, xPos, yPos, options));
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

                pathFinders.push(new PathFinder(this.pixelData, this.workingData, this.dimensions.width, this.dimensions.height, color, xPos, yPos, options));
            }
        }

        _seedCreateLoop(count, pathFinders, xPosFn, yPosFn, options) {
            for (let i = 1; i < count + 1; i++) {
                let color = Utils._indexToRgbString(i),
                    xPos = xPosFn(i),
                    yPos = yPosFn(i);

                pathFinders.push(new PathFinder(this.pixelData, this.workingData, this.dimensions.width, this.dimensions.height, color, xPos, yPos, options));
            }
        }
    }

    window.Chromata = Chromata;
})();
