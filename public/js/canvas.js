export class Canvas{
    constructor(mask_canvas_ID, image_canvas_ID) {
        this.canvas = document.getElementById(mask_canvas_ID);
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.img_canvas = document.getElementById(image_canvas_ID);
        this.img_ctx = this.img_canvas.getContext('2d');
        this.drawing = false;

        this.color = 'rgb(255, 255, 255)';
        this.brush_width = 5;
        this.brush_spacing = 1;

        this.last_pos = false;
        this.dragging = false;

        this.past = [];
        this.future = [];
        this.history_size = 20;
        
        this.window_lastX;
        this.window_lastY;
        this.canvas_width;
        this.canvas_height;
        this.img_w;
        this.img_h;

        // Make canvas focusable to receive keyboard events
        this.canvas.tabIndex = 1000;
        this.addListeners();
        
    }

    addListeners() {
        this.canvas.addEventListener('mousedown', (e) => {
            this.paintMouseDown(e);
            this.dragWindowDown(e);
        });
        this.canvas.addEventListener('mousemove', (e) => {
            this.paintMouseMove(e);
            this.dragWindowMove(e);
        });
        this.canvas.addEventListener('mouseup', (e)=> {
            this.paintMouseUp(e);
            this.dragWindowUp(e);
        });
        this.canvas.addEventListener('mouseleave', (e) =>{
            this.mouseLeave(e);
        })  
        this.canvas.addEventListener('mouseover', ()=>{document.body.style.cursor = 'none';});
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault(); // Prevent the context menu from appearing
            this.storeState();
            this.floodFill(...this.getMouseXY(e), this.color);
        });
    }

    storeState() {
        this.past.push(this.ctx.getImageData(0, 0, this.canvas_width, this.canvas_height));
        if (this.past.length > this.history_size) {
            // Remove the first element (oldest state)
            this.past.shift()
        }

        if (this.future.length > 0) {
            // Reset future array to remove all redos
            this.future = [];
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


    // Drawing functions
    drawMask(mask) {
        if (!mask || mask.src==null || mask.src=="") {
            // No mask present, start with black
            this.ctx.fillStyle = "black";
            this.ctx.fillRect(0, 0, this.canvas_width, this.canvas_height);
        } else {
            this.ctx.drawImage(mask, 0, 0, this.canvas_width, this.canvas_height);
        }
        
    }

    drawImage(img) {
        this.img_canvas.width = img.width;
        this.img_canvas.height = img.height;
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.canvas_width = img.width;
        this.canvas_height = img.height;
        
        this.img_ctx.imageSmoothingEnabled = false; // Disable smoothing for pixel art
        this.img_ctx.drawImage(img, 0, 0, this.canvas_width, this.canvas_height);
    }

    paintMouseDown(e) {
        if (e.button === 0){
            this.storeState();
            this.drawing = true;
            let [x, y] = this.getMouseXY(e);
            this.drawPoint(x, y);
            this.last_pos = [x, y];
        }
    }

    paintMouseUp(e) {
        if (e.button === 0){
            this.drawing = false;
            this.last_pos = false;
            this.removeGray();
        }
    }

    paintMouseMove(e) {
        const now = Date.now();
        if (now - this.lastDraw < 20) return; // Only draw every
        this.lastDraw = now;
        if (e.button === 0) {
            e.preventDefault();
            e.stopPropagation();

            if (this.drawing) {
                let [x, y] = this.getMouseXY(e);
                this.drawPoint(x, y);
                this.last_pos = [x, y];
            }
        }
    }

    dist(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
    }

    drawCircle(x, y, width) {
        this.ctx.strokeStyle = this.color;
        this.ctx.fillStyle = this.color;
        this.ctx.beginPath();
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.arc(x, y, width, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    drawPoint(x, y) {
        // Linear interpolation from last point
        if (this.last_pos) {
            let [x0, y0] = this.last_pos;
            let d = this.dist(x0, y0, x, y);
            if (d > this.brush_spacing) {
                let spacing_ratio = this.brush_spacing / d;
                let spacing_ratio_total = spacing_ratio;
                while (spacing_ratio_total <= 1) {
                    let xn = x0 + spacing_ratio_total * (x - x0);
                    let yn = y0 + spacing_ratio_total * (y - y0);

                    // Draw at the interpolated point
                    this.drawCircle(xn, yn, this.brush_width);

                    spacing_ratio_total += spacing_ratio;
                }
            } else {
                this.drawCircle(x, y, this.brush_width);
            }
        } else {
            this.drawCircle(x, y, this.brush_width);
        }
    }

    removeGray(){
        let imageData = this.ctx.getImageData(0, 0, this.canvas_width, this.canvas_height);
        let data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
        // Simple threshold: if closer to white, set to white; else black
            let avg = (data[i] + data[i+1] + data[i+2]) / 3;
            if (avg > 127) {
                data[i] = data[i+1] = data[i+2] = 255;
            } else {
                data[i] = data[i+1] = data[i+2] = 0;
            }
            data[i+3] = 255; // fully opaque
        }
        this.ctx.putImageData(imageData, 0, 0);
    }
    // Drawing functions


    // Dragging window
    dragWindowDown(e){
        if (e.button === 1) { // Middle mouse button
            e.preventDefault();
            this.dragging = true;
            let [x, y] = [e.clientX, e.clientY];
            this.lastX = x;
            this.lastY = y;
        }
    }

    dragWindowMove(e) {  
        if (this.dragging) {
            let [x, y] = [e.clientX, e.clientY];
            const dx = x - this.lastX;
            const dy = y - this.lastY;
            window.scrollBy(-dx, -dy);
            this.lastX = x;
            this.lastY = y;
        }
    }

    dragWindowUp(e) {
        if (e.button === 1) {
            this.dragging = false;
        }
    }
    // Dragging window

    toggleMask() {
        this.canvas.classList.toggle("hidden");
    }

    switchColor() {
        if (this.color === "rgb(255, 255, 255)") {
            this.color = "rgb(0, 0, 0)"; // Use RGB for black        
        } else {
            this.color = "rgb(255, 255, 255)"; // Use RGB for white
        }
    }

    changeBrushSize(size) {
        if (this.brush_width + size < 1) {
            return; // Prevent brush size from going below 1
        }
        this.brush_width += size;
    }

    undo() {
        if (this.past.length > 0) {
            // Save the current state for redo
            let current_state = this.ctx.getImageData(0, 0, this.canvas_width, this.canvas_height);
            this.future.push(current_state);
            // Reload the this.past state
            let past_state = this.past.pop()
            this.ctx.putImageData(past_state, 0, 0);
        }
    }

    redo() {
        if (this.future.length > 0) {
            // Save the current state for undo
            let current_state = this.ctx.getImageData(0, 0, this.canvas_width, this.canvas_height);
            this.past.push(current_state);
            // Reload the past state
            let state = this.future.pop()
            this.ctx.putImageData(state, 0, 0);
        }
    }

    resetMask() {
        this.storeState();
        this.drawMask(null);
    }

    mouseLeave(e) {
        this.paintMouseUp(e);
        this.drawing = false;
        this.last_pos = false;
        this.dragging = false;
        document.body.style.cursor = 'crosshair'; // Reset cursor to crosshair
    }

    add_event_listener(event, callback){
        this.canvas.addEventListener(event, callback);
    }

    floodFill(x, y, fillColor, tolerance = 254) {
        // Get image data
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        const width = this.canvas.width;
        const height = this.canvas.height;

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

        // Update the this.canvas
        this.ctx.putImageData(imageData, 0, 0);
    }

    getMaskBase64() {
        return this.canvas.toDataURL("image/png");
    }
}