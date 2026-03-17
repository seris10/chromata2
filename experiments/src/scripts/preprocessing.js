/**
 * WebGL Preprocessing Pipeline
 * GPU-accelerated edge detection and image processing
 */

export default class PreprocessingPipeline {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

        if (!this.gl) {
            console.warn('WebGL not available, preprocessing disabled');
            this.enabled = false;
            return;
        }

        this.enabled = true;
        this.programs = {};
        this.textures = {};
        this.framebuffers = {};
    }

    /**
     * Initialize WebGL programs and resources
     */
    async initialize() {
        if (!this.enabled) return false;

        try {
            // Create edge detection program
            this.programs.edgeDetection = await this.createProgram(
                this.getVertexShader(),
                this.getEdgeDetectionShader()
            );

            // Create gaussian blur program
            this.programs.gaussianBlur = await this.createProgram(
                this.getVertexShader(),
                this.getGaussianBlurShader()
            );

            // Setup vertex buffer
            this.setupVertexBuffer();

            return true;
        } catch (error) {
            console.error('Failed to initialize preprocessing pipeline:', error);
            this.enabled = false;
            return false;
        }
    }

    /**
     * Create WebGL program from vertex and fragment shaders
     */
    createProgram(vertexSource, fragmentSource) {
        const gl = this.gl;

        const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentSource);

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error('Program link failed: ' + gl.getProgramInfoLog(program));
        }

        return program;
    }

    /**
     * Compile a shader
     */
    compileShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error('Shader compilation failed: ' + info);
        }

        return shader;
    }

    /**
     * Setup vertex buffer for full-screen quad
     */
    setupVertexBuffer() {
        const gl = this.gl;

        // Full-screen quad
        const vertices = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
             1,  1
        ]);

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    }

    /**
     * Create texture from ImageData
     */
    createTexture(imageData) {
        const gl = this.gl;
        const texture = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageData);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        return texture;
    }

    /**
     * Detect edges using Sobel operator
     * Returns edge map as ImageData with edge strength [0-255]
     */
    detectEdges(imageData) {
        if (!this.enabled) {
            return this.detectEdgesCPU(imageData);
        }

        const gl = this.gl;
        const program = this.programs.edgeDetection;

        // Create texture from input
        const inputTexture = this.createTexture(imageData);

        // Create framebuffer for output
        const framebuffer = gl.createFramebuffer();
        const outputTexture = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, outputTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, imageData.width, imageData.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outputTexture, 0);

        // Use program
        gl.useProgram(program);
        gl.viewport(0, 0, imageData.width, imageData.height);

        // Set uniforms
        const textureLoc = gl.getUniformLocation(program, 'u_image');
        const resolutionLoc = gl.getUniformLocation(program, 'u_resolution');

        gl.uniform1i(textureLoc, 0);
        gl.uniform2f(resolutionLoc, imageData.width, imageData.height);

        // Bind input texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, inputTexture);

        // Setup attributes
        const positionLoc = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(positionLoc);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

        // Draw
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Read pixels
        const pixels = new Uint8ClampedArray(imageData.width * imageData.height * 4);
        gl.readPixels(0, 0, imageData.width, imageData.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

        // Cleanup
        gl.deleteTexture(inputTexture);
        gl.deleteTexture(outputTexture);
        gl.deleteFramebuffer(framebuffer);

        return new ImageData(pixels, imageData.width, imageData.height);
    }

    /**
     * CPU fallback for edge detection (Sobel operator)
     */
    detectEdgesCPU(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        const output = new Uint8ClampedArray(data.length);

        // Sobel kernels
        const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
        const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let gx = 0, gy = 0;

                // Apply Sobel kernels
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = ((y + ky) * width + (x + kx)) * 4;
                        const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                        const kernelIdx = (ky + 1) * 3 + (kx + 1);

                        gx += gray * sobelX[kernelIdx];
                        gy += gray * sobelY[kernelIdx];
                    }
                }

                const magnitude = Math.sqrt(gx * gx + gy * gy);
                const outputIdx = (y * width + x) * 4;

                output[outputIdx] = magnitude;
                output[outputIdx + 1] = magnitude;
                output[outputIdx + 2] = magnitude;
                output[outputIdx + 3] = 255;
            }
        }

        return new ImageData(output, width, height);
    }

    /**
     * Create edge map normalized to [0-255]
     */
    createEdgeMap(imageData) {
        const edgeData = this.detectEdges(imageData);
        const width = edgeData.width;
        const height = edgeData.height;
        const edgeMap = [];

        for (let y = 0; y < height; y++) {
            edgeMap[y] = [];
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                edgeMap[y][x] = edgeData.data[idx]; // Use red channel
            }
        }

        return edgeMap;
    }

    /**
     * Standard vertex shader for full-screen quad
     */
    getVertexShader() {
        return `
            attribute vec2 a_position;
            varying vec2 v_texCoord;

            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
                v_texCoord = a_position * 0.5 + 0.5;
            }
        `;
    }

    /**
     * Edge detection fragment shader (Sobel operator)
     */
    getEdgeDetectionShader() {
        return `
            precision mediump float;

            uniform sampler2D u_image;
            uniform vec2 u_resolution;
            varying vec2 v_texCoord;

            void main() {
                vec2 texel = 1.0 / u_resolution;

                // Sobel kernels
                float gx = 0.0;
                float gy = 0.0;

                // Sample 3x3 neighborhood
                for (int y = -1; y <= 1; y++) {
                    for (int x = -1; x <= 1; x++) {
                        vec2 offset = vec2(float(x), float(y)) * texel;
                        vec4 sample = texture2D(u_image, v_texCoord + offset);
                        float gray = (sample.r + sample.g + sample.b) / 3.0;

                        // Sobel X
                        if (x == -1) gx -= gray * (y == 0 ? 2.0 : 1.0);
                        if (x == 1) gx += gray * (y == 0 ? 2.0 : 1.0);

                        // Sobel Y
                        if (y == -1) gy -= gray * (x == 0 ? 2.0 : 1.0);
                        if (y == 1) gy += gray * (x == 0 ? 2.0 : 1.0);
                    }
                }

                float magnitude = sqrt(gx * gx + gy * gy);
                gl_FragColor = vec4(vec3(magnitude), 1.0);
            }
        `;
    }

    /**
     * Gaussian blur fragment shader
     */
    getGaussianBlurShader() {
        return `
            precision mediump float;

            uniform sampler2D u_image;
            uniform vec2 u_resolution;
            varying vec2 v_texCoord;

            void main() {
                vec2 texel = 1.0 / u_resolution;
                vec4 color = vec4(0.0);

                // 5x5 Gaussian kernel (simplified)
                float kernel[25];
                kernel[0] = 1.0; kernel[1] = 4.0; kernel[2] = 6.0; kernel[3] = 4.0; kernel[4] = 1.0;
                kernel[5] = 4.0; kernel[6] = 16.0; kernel[7] = 24.0; kernel[8] = 16.0; kernel[9] = 4.0;
                kernel[10] = 6.0; kernel[11] = 24.0; kernel[12] = 36.0; kernel[13] = 24.0; kernel[14] = 6.0;
                kernel[15] = 4.0; kernel[16] = 16.0; kernel[17] = 24.0; kernel[18] = 16.0; kernel[19] = 4.0;
                kernel[20] = 1.0; kernel[21] = 4.0; kernel[22] = 6.0; kernel[23] = 4.0; kernel[24] = 1.0;

                float kernelSum = 256.0;
                int i = 0;

                for (int y = -2; y <= 2; y++) {
                    for (int x = -2; x <= 2; x++) {
                        vec2 offset = vec2(float(x), float(y)) * texel;
                        color += texture2D(u_image, v_texCoord + offset) * kernel[i] / kernelSum;
                        i++;
                    }
                }

                gl_FragColor = color;
            }
        `;
    }

    /**
     * Clean up resources
     */
    destroy() {
        if (!this.enabled) return;

        const gl = this.gl;

        // Delete programs
        Object.values(this.programs).forEach(program => {
            gl.deleteProgram(program);
        });

        // Delete buffer
        if (this.vertexBuffer) {
            gl.deleteBuffer(this.vertexBuffer);
        }
    }
}
