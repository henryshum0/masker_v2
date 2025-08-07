const log = console.log
export class Canvas {
    constructor(mask_canvas_ID, image_canvas_ID, magic_pen_canvas_ID) {

        // Mode properties
        this.foreground_color = 'rgb(255, 255, 255)'; // White
        this.background_color = 'rgb(0, 0, 0)'; // Black
        this.magic_pen_color = 'rgba(255, 0, 255, 0.01)'; // Semi-transparent magenta
        this.draw_size = 5;
        this.magic_pen_size = 200;

        // brush properties
        this.brush_mode = 'draw';
        this.color = this.foreground_color;
        this.brush_width = this.draw_size;
        this.brush_spacing = 1;
        this.drawing = false;
        this.last_pos = false;
        this.line_len = 0;

        // Window properties
        this.dragging = false;
        this.window_lastX;
        this.window_lastY;

        // Canvas dimensions
        this.canvas_width;
        this.canvas_height;
        this.img_w;
        this.img_h;

        // History management
        this.past = [];
        this.future = [];
        this.history_size = 20;

        // Canvas elements and contexts
        this.mask_canvas = document.getElementById(mask_canvas_ID);
        this.mask_ctx = this.mask_canvas.getContext('2d', { willReadFrequently: true });
        this.img_canvas = document.getElementById(image_canvas_ID);
        this.img_ctx = this.img_canvas.getContext('2d');
        this.magic_pen_canvas = document.getElementById(magic_pen_canvas_ID);
        this.magic_pen_ctx = this.magic_pen_canvas.getContext('2d', { willReadFrequently: true });
        this.magic_pen_ctx.strokeStyle = this.magic_pen_color;
        this.magic_pen_ctx.fillStyle = this.magic_pen_color;

        // Make mask_canvas focusable to receive keyboard events
        this.mask_canvas.tabIndex = 1000;
        this.addListeners();

        // Initialize custom cursor
        this.updateCustomCursor();
    }

    // ============================================================
    // Event Handling and Initialization
    // ============================================================

    addListeners() {
        this.mask_canvas.addEventListener('mousedown', (e) => {
            this.mouseDown(e);
            this.dragDown(e);
        });
        this.mask_canvas.addEventListener('mousemove', (e) => {
            this.mouseMove(e);
            this.dragMove(e);
        });
        this.mask_canvas.addEventListener('mouseup', (e) => {
            this.mouseUp(e);
            this.dragUp(e);
        });
        this.mask_canvas.addEventListener('mouseleave', (e) => {
            this.mouseLeave(e);
        });
        this.mask_canvas.addEventListener('mouseover', () => {
            this.updateCustomCursor(); // Use custom cursor instead of default
        });
        this.mask_canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault(); // Prevent the context menu from appearing
            this.storeState();
            this.floodFill(...this.getMouseXY(e), this.color, 254);
        });
        this.mask_canvas.addEventListener('wheel', () => {
            this.updateCustomCursor(); // Update cursor on zoom
        });
    }

    add_event_listener(event, callback) {
        this.mask_canvas.addEventListener(event, callback);
    }

    mouseLeave(e) {
        this.mouseUp(e);
        this.drawing = false;
        this.last_pos = false;
        this.dragging = false;
        document.body.style.cursor = 'default'; // Reset cursor to default
    }

    mouseDown(e) {
        if (e.button === 0) {
            if (this.brush_mode === 'draw') {
                this.storeState();
                this.drawing = true;
                let [x, y] = this.getMouseXY(e);
                this.drawPoint(x, y, this.mask_ctx);
                this.last_pos = [x, y];
            }
            else if (this.brush_mode === 'magic_pen') {
                this.drawing = true;
                this.line_len = 0; 
                let [x, y] = this.getMouseXY(e);
                this.drawPoint(x, y, this.magic_pen_ctx);
                this.last_pos = [x, y];
            }
        }
    }

    mouseUp(e) {
        if (this.crop) {
            return;
        }
        if (e.button === 0) {
            if (this.brush_mode === 'draw') {
                this.drawing = false;
                this.last_pos = false;
                this.removeGray();
            }
            else if (this.brush_mode === 'magic_pen') {
                this.drawing = false;
                this.last_pos = false;
                this.clear_magic_pen();
            }
        }
    }

    mouseMove(e) {
        const now = Date.now();
        if (now - this.lastDraw < 20) return; // Only draw every
        this.lastDraw = now;
        if (e.button === 0) {
            e.preventDefault();
            e.stopPropagation();

            if (this.drawing && this.brush_mode === 'draw') {
                let [x, y] = this.getMouseXY(e);
                this.drawPoint(x, y, this.mask_ctx);
                this.last_pos = [x, y];
            }
            else if (this.drawing && this.brush_mode === 'magic_pen') {
                let [x, y] = this.getMouseXY(e);
                this.drawPoint(x, y, this.magic_pen_ctx);
                this.last_pos = [x, y];
                log(`Drawing with magic pen at (${x}, ${y})`);
                log(`Line length: ${this.line_len}`);
            }
        }
    }

    getMouseXY(e) {
        let rect = e.target.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;

        x = (x / rect.width) * this.canvas_width;
        y = (y / rect.height) * this.canvas_height;

        return [x, y];
    }

    dragDown(e) {
        if (e.button === 1) { // Middle mouse button
            e.preventDefault();
            this.dragging = true;
            let [x, y] = [e.clientX, e.clientY];
            this.lastX = x;
            this.lastY = y;
        }
    }

    dragMove(e) {
        if (this.dragging) {
            let [x, y] = [e.clientX, e.clientY];
            const dx = x - this.lastX;
            const dy = y - this.lastY;
            window.scrollBy(-dx, -dy);
            this.lastX = x;
            this.lastY = y;
        }
    }

    dragUp(e) {
        if (e.button === 1) {
            this.dragging = false;
        }
    }


    // ============================================================
    // Custom Cursor
    // ============================================================

    updateCustomCursor() {
        const zoom = window.devicePixelRatio;
        const size = Math.max(this.brush_width * 2, 8) * zoom; // Minimum size of 8px for visibility
        const halfSize = size / 2;

        // Create a canvas for the custom cursor
        const cursorCanvas = document.createElement('canvas');
        cursorCanvas.width = size;
        cursorCanvas.height = size;
        const ctx = cursorCanvas.getContext('2d');

        // Draw outer circle (border)
        ctx.beginPath();
        ctx.arc(halfSize, halfSize, halfSize - 1, 0, Math.PI * 2);
        if (this.color === this.foreground_color) {
            ctx.strokeStyle = 'rgb(0, 255, 0)'; // Green for foreground
        }
        else if (this.color === this.background_color) {
            ctx.strokeStyle = 'rgb(255, 0, 0)'; // Red for background
        }
        else if (this.color === this.magic_pen_color) {
            ctx.strokeStyle = 'rgb(0, 0, 255)'; // Blue for magic pen
        }
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw inner circle (fill)
        ctx.beginPath();
        ctx.arc(halfSize, halfSize, Math.max(0, halfSize - 2), 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.3; // Make it semi-transparent

        // Draw crosshair
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(halfSize, 0);
        ctx.lineTo(halfSize, size);
        ctx.moveTo(0, halfSize);
        ctx.lineTo(size, halfSize);
        if (this.color === this.foreground_color) {
            ctx.strokeStyle = 'rgb(0, 255, 0)'; // Green for foreground
        }
        else if (this.color === this.background_color) {
            ctx.strokeStyle = 'rgb(255, 0, 0)'; // Red for background
        }
        else if (this.color === this.magic_pen_color) {
            ctx.strokeStyle = 'rgb(0, 0, 255)'; // Blue for magic pen
        }
        ctx.lineWidth = 1;
        ctx.stroke();

        // Convert to data URL
        const cursorDataURL = cursorCanvas.toDataURL();

        // Apply custom cursor
        this.mask_canvas.style.cursor = `url(${cursorDataURL}) ${halfSize + 1} ${halfSize}, crosshair`;
    }


    // ============================================================
    // Image and Mask Functions
    // ============================================================

    drawImage(img) {
        this.img_canvas.width = img.width;
        this.img_canvas.height = img.height;
        this.mask_canvas.width = img.width;
        this.mask_canvas.height = img.height;
        this.magic_pen_canvas.width = img.width;
        this.magic_pen_canvas.height = img.height;
        this.img_ctx.clearRect(0, 0, img.width, img.height);
        this.mask_ctx.clearRect(0, 0, img.width, img.height);
        this.magic_pen_ctx.clearRect(0, 0, img.width, img.height);

        this.canvas_width = img.width;
        this.canvas_height = img.height;

        this.img_ctx.imageSmoothingEnabled = false; // Disable smoothing for pixel art
        this.img_ctx.drawImage(img, 0, 0, this.canvas_width, this.canvas_height);
    }

    drawMask(mask) {
        if (!mask || mask.src == null || mask.src == "") {
            // No mask present, start with black
            this.mask_ctx.fillStyle = "black";
            this.mask_ctx.fillRect(0, 0, this.canvas_width, this.canvas_height);
        } else {
            this.mask_ctx.drawImage(mask, 0, 0, this.canvas_width, this.canvas_height);
        }
    }

    toggleMask() {
        this.mask_canvas.classList.toggle("hidden");
    }

    resetMask() {
        this.storeState();
        this.drawMask(null);
    }

    getMaskBase64() {
        return this.mask_canvas.toDataURL("image/png");
    }

    cropImageBase64(x1, y1, x2, y2) {
        // Ensure coordinates are in the right order
        const [startX, startY] = [Math.min(x1, x2), Math.min(y1, y2)];
        const [endX, endY] = [Math.max(x1, x2), Math.max(y1, y2)];

        // Calculate width and height of the crop
        const cropWidth = endX - startX;
        const cropHeight = endY - startY;

        // Create a temporary mask_canvas for the crop
        const cropCanvas = document.createElement('mask_canvas');
        cropCanvas.width = cropWidth;
        cropCanvas.height = cropHeight;
        const cropCtx = cropCanvas.getContext('2d');

        // First, crop from the image mask_canvas
        if (this.img_ctx) {
            const imageData = this.img_ctx.getImageData(startX, startY, cropWidth, cropHeight);
            cropCtx.putImageData(imageData, 0, 0);
        }
        // Convert to base64 and return
        return cropCanvas.toDataURL("image/png");
    }

    replaceMaskRegionWithImage(x, y, width, height, image) {
        // Clip to ensure we don't try to replace outside the mask_canvas
        const clipX = Math.max(0, x);
        const clipY = Math.max(0, y);
        const clipWidth = Math.min(width, this.canvas_width - clipX);
        const clipHeight = Math.min(height, this.canvas_height - clipY);

        if (clipWidth <= 0 || clipHeight <= 0) return;

        // Create a temporary mask_canvas to process the image
        const tempCanvas = document.createElement('mask_canvas');
        tempCanvas.width = clipWidth;
        tempCanvas.height = clipHeight;
        const tempCtx = tempCanvas.getContext('2d');

        // Draw the crop image onto the temporary mask_canvas, scaling if necessary
        tempCtx.drawImage(image, 0, 0, image.width, image.height, 0, 0, clipWidth, clipHeight);

        // Get the pixel data
        const imageData = tempCtx.getImageData(0, 0, clipWidth, clipHeight);

        // Apply to the mask mask_canvas
        this.mask_ctx.putImageData(imageData, clipX, clipY);

        // If we have auto-thresholding, apply it
        this.removeGray();
    }



    // ============================================================
    // Drawing and Painting Functions
    // ============================================================

    drawPoint(x, y, ctx) {
        // Linear interpolation from last point
        if (this.last_pos) {
            let [x0, y0] = this.last_pos;
            let d = this.dist(x0, y0, x, y);
            if (d > this.brush_spacing) {
                this.line_len += d;
                let spacing_ratio = this.brush_spacing / d;
                let spacing_ratio_total = spacing_ratio;
                while (spacing_ratio_total <= 1) {
                    let xn = x0 + spacing_ratio_total * (x - x0);
                    let yn = y0 + spacing_ratio_total * (y - y0);

                    // Draw at the interpolated point
                    this.drawCircle(xn, yn, this.brush_width, ctx);

                    spacing_ratio_total += spacing_ratio;
                }
            } else {
                this.drawCircle(x, y, this.brush_width, ctx);
            }
        } else {
            this.drawCircle(x, y, this.brush_width, ctx);
        }
    }

    drawCircle(x, y, width, ctx) {
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        ctx.beginPath();
        ctx.imageSmoothingEnabled = false;
        ctx.arc(x, y, width, 0, 2 * Math.PI);
        ctx.fill();
    }

    dist(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
    }

    switchColor() {
        if (this.brush_mode === 'draw') {
            if (this.color === this.foreground_color) {
                this.color = this.background_color;
            }
            else {
                this.color = this.foreground_color;
            }
        }

        else if (this.brush_mode === 'magic_pen') {
            this.color = this.magic_pen_color;
        }
        this.updateCustomCursor(); // Update cursor to match new color
    }

    switchBrushMode() {
        if (this.brush_mode === 'draw') {
            this.brush_mode = 'magic_pen';
            this.draw_size = this.brush_width; // Store current draw size
            this.brush_width = this.magic_pen_size;
            this.updateCustomCursor();
        } else if (this.brush_mode === 'magic_pen') {
            this.brush_mode = 'draw';
            this.brush_width = this.draw_size; // Reset brush width for drawing
            this.updateCustomCursor();
        }
        this.switchColor(); // Switch color when changing brush mode
        this.updateCustomCursor(); // Update cursor to match new brush mode
        log(`Switched brush mode to: ${this.brush_mode}`);
    }

    changeBrushSize(size) {
        if (this.brush_width + size < 1) {
            return; // Prevent brush size from going below 1
        }
        this.brush_width += size;
        this.updateCustomCursor(); // Update cursor to match new size
    }

    clear_magic_pen() {
        this.magic_pen_ctx.clearRect(0, 0, this.magic_pen_canvas.width, this.magic_pen_canvas.height);
        this.magic_pen_ctx.fillStyle = this.magic_pen_color;
        this.magic_pen_ctx.strokeStyle = this.magic_pen_color;
    }

    removeGray() {
        let imageData = this.mask_ctx.getImageData(0, 0, this.mask_ctx.canvas.width, this.mask_ctx.canvas.height);
        let data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            // Simple threshold: if closer to white, set to white; else black
            let avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            if (avg > 127) {
                data[i] = data[i + 1] = data[i + 2] = 255;
            } else {
                data[i] = data[i + 1] = data[i + 2] = 0;
            }
            data[i + 3] = 255; // fully opaque
        }
        this.mask_ctx.putImageData(imageData, 0, 0);
    }

    floodFill(x, y, fillColor, tolerance = 254) {

        // Get image data
        const imageData = this.mask_ctx.getImageData(0, 0, this.mask_ctx.canvas.width, this.mask_ctx.canvas.height);
        const data = imageData.data;
        const width = this.mask_ctx.canvas.width;
        const height = this.mask_ctx.canvas.height;

        // Convert fillColor to RGBA array
        let fillR, fillG, fillB, fillA;
        if (fillColor === 'rgb(255, 255, 255)') {
            [fillR, fillG, fillB, fillA] = [255, 255, 255, 255];
        } else if (fillColor === 'rgb(0, 0, 0)') {
            [fillR, fillG, fillB, fillA] = [0, 0, 0, 255];
        } else {
            [fillR, fillG, fillB, fillA] = [255, 255, 255, 255];
        }

        // Get the starting pixel color
        const startX = Math.floor(x);
        const startY = Math.floor(y);
        const startIdx = (startY * width + startX) * 4;
        const startColor = [
            data[startIdx],
            data[startIdx + 1],
            data[startIdx + 2],
            data[startIdx + 3]
        ];

        // If the fill color is the same as the start color, do nothing
        if (
            startColor[0] === fillR &&
            startColor[1] === fillG &&
            startColor[2] === fillB &&
            startColor[3] === fillA
        ) {
            return;
        }

        // Helper to compare pixel color with tolerance
        function matchColor(idx) {
            return (
                Math.abs(data[idx] - startColor[0]) <= tolerance &&
                Math.abs(data[idx + 1] - startColor[1]) <= tolerance &&
                Math.abs(data[idx + 2] - startColor[2]) <= tolerance &&
                Math.abs(data[idx + 3] - startColor[3]) <= tolerance
            );
        }

        // Helper to set pixel color
        function setColor(idx) {
            data[idx] = fillR;
            data[idx + 1] = fillG;
            data[idx + 2] = fillB;
            data[idx + 3] = fillA;
        }

        // Optimized scanline flood fill
        const stack = [[startX, startY]];
        while (stack.length > 0) {
            let [x, y] = stack.pop();
            let idx = (y * width + x) * 4;

            // Move to the leftmost pixel in this scanline
            while (x >= 0 && matchColor(idx)) {
                x--;
                idx -= 4;
            }
            x++;
            idx += 4;

            let spanAbove = false;
            let spanBelow = false;

            // Fill rightwards and check above/below
            while (x < width && matchColor(idx)) {
                setColor(idx);

                // Check pixel above
                if (y > 0) {
                    const aboveIdx = ((y - 1) * width + x) * 4;
                    if (matchColor(aboveIdx)) {
                        if (!spanAbove) {
                            stack.push([x, y - 1]);
                            spanAbove = true;
                        }
                    } else if (spanAbove) {
                        spanAbove = false;
                    }
                }

                // Check pixel below
                if (y < height - 1) {
                    const belowIdx = ((y + 1) * width + x) * 4;
                    if (matchColor(belowIdx)) {
                        if (!spanBelow) {
                            stack.push([x, y + 1]);
                            spanBelow = true;
                        }
                    } else if (spanBelow) {
                        spanBelow = false;
                    }
                }

                x++;
                idx += 4;
            }
        }

        // Update the canvas
        this.mask_ctx.putImageData(imageData, 0, 0);
    }

    // ============================================================
    // History Management (Undo/Redo)
    // ============================================================

    storeState() {
        this.past.push(this.mask_ctx.getImageData(0, 0, this.canvas_width, this.canvas_height));
        if (this.past.length > this.history_size) {
            // Remove the first element (oldest state)
            this.past.shift()
        }

        if (this.future.length > 0) {
            // Reset future array to remove all redos
            this.future = [];
        }
    }

    undo() {
        if (this.past.length > 0) {
            // Save the current state for redo
            let current_state = this.mask_ctx.getImageData(0, 0, this.canvas_width, this.canvas_height);
            this.future.push(current_state);
            // Reload the this.past state
            let past_state = this.past.pop()
            this.mask_ctx.putImageData(past_state, 0, 0);
        }
    }

    redo() {
        if (this.future.length > 0) {
            // Save the current state for undo
            let current_state = this.mask_ctx.getImageData(0, 0, this.canvas_width, this.canvas_height);
            this.past.push(current_state);
            // Reload the past state
            let state = this.future.pop()
            this.mask_ctx.putImageData(state, 0, 0);
        }
    }
}
