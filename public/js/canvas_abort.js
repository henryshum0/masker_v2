
export class Canvas {
    constructor(img_canvasID, label_canvasID, width=1200, height=800) {
        this.drawing = false;
        this.last_pos = false;
        this.panning = false;
        this.img = null;
        this.label = null;

        this.img_canvas = document.getElementById(img_canvasID);
        this.label_canvas = document.getElementById(label_canvasID);
        this.off_canvas = document.createElement('off-canvas');
        this.img_ctx = this.img_canvas.getContext('2d', { willReadFrequently: true });
        this.label_ctx = this.label_canvas.getContext('2d', { willReadFrequently: true });

        this.img_canvas.width = width; // Default width
        this.img_canvas.height = height; // Default height
        this.label_canvas.width = width; // Default width
        this.label_canvas.height = height; // Default height

        this.color = "rgb(255, 255, 255)"; // Default color is white
        this.brush_width = 5; // Default pen size
        this.brush_spacing = 1;

        this.past = [];
        this.future = [];
        this.history_size = 20;

        
        this.view_transform = {
            x: 0,
            y: 0,
            scale: 5
        }
        this.add_listeners();
    }

    add_listeners() {
        this.label_canvas.addEventListener('mousedown', (e) => { this.paint_down(e); this.drag_down(e); });
        this.label_canvas.addEventListener('mouseup', (e) => { this.paint_up(e); this.drag_up(e); });
        this.label_canvas.addEventListener('mousemove', (e) => { this.paint_move(e); this.drag_move(e); });
        this.label_canvas.addEventListener('mouseleave', (e) => this.mouse_leave(e));
        this.label_canvas.addEventListener('wheel', (e) => this.zoom(e));
        
    }
 
    load_image(image){
        if (image){
            this.img = new Image();
            this.img.src = image;
            this.img.onload = () => {
                this.off_canvas.width = this.img.naturalWidth;
                this.off_canvas.height = this.img.naturalHeight;
            };
            this.img.onerror = (error) => {
                console.error("Error loading image:", error);
            }
        }
        else {
            this.img = null;
        }
    }

    draw_image(x, y, transform){
        if (this.img && this.img_ctx) {
            this.img_ctx.setTransform(transform.scale, 0, 0, 
                                    transform.scale, transform.x, transform.y);
            this.img_ctx.imageSmoothingEnabled = false; // Disable smoothing for pixel art
            this.img_ctx.drawImage(this.img, x, y);
        }
        else {
            this.img_ctx.clearRect(0, 0, this.img_canvas.width, this.img_canvas.height);
            this.img_ctx.fillText("No image to draw");
            console.log("No image to draw");
        }
    }

    load_label(label){
        if(this.img && label){
            this.label = new Image();
            this.label.src = label;
            // this.label.onload = () => {
            //     this.render();
            // };
            this.label.onerror = (error) => {
                console.error("Error loading label:", error);
            }
        }
        else {
            this.label = null;
        }
    }

    draw_label(x, y, transform){
        if (this.label && this.label_ctx) {
            this.label_ctx.setTransform(transform.scale, 0, 0, 
                                    transform.scale, transform.x, transform.y);
            this.label_ctx.imageSmoothingEnabled = false; // Disable smoothing for pixel art
            this.label_ctx.drawImage(this.label, x, y);
        }
        else {
            this.label_ctx.clearRect(0, 0, this.label_canvas.width, this.label_canvas.height);
            this.label_ctx.color = "rgb(0, 0, 0)";
            this.label_ctx.drawRect(0, 0, this.label_canvas.width, this.label_canvas.height);
        }
        
    }

    paint_down(e) {
        if (e.button === 0 && this.label){
            this.label_ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
            e.preventDefault();
            this.drawing = true;
            let [x, y] = this.get_xy(e);
            this.draw_point(x, y);
            this.last_pos = [x, y];
        }
        
    }

    paint_up(e) {
        if (e.button === 0){
            this.drawing = false;
            this.last_pos = false;
            // this.save_state();
        }
        
    }

    paint_move(e) {
        if (e.button === 0) {
            e.preventDefault();
            e.stopPropagation();

            if (this.drawing) {
                let [x, y] = this.get_xy(e);
                this.draw_point(x, y);
                this.remove_gray();
                this.last_pos = [x, y];
            }
        }
        
    }

    mouse_leave(e){
        this.panning = false;
        this.drawing = false;
        this.last_pos = false;
    }

    drag_down(e){
        if (e.button === 1) {
            e.preventDefault();
            this.panning = true;
            this.last_pos = [e.clientX, e.clientY];
        }
    }

    drag_up(e){
        if (e.button === 1) {
            e.preventDefault();
            this.panning = false;
            this.last_pos = false;
        }
    }

    drag_move(e){
        if (this.panning) {
            e.preventDefault();
            e.stopPropagation();
            this.update_panning(e);
        }
    }

    update_panning(e){
        const imgW = this.img_canvas.width;
        const imgH = this.img_canvas.height;
        const scale = this.view_transform.scale;
        const canvasW = this.view_transform.x
        const canvasH = this.view_transform.y;

        console.log(e.clientX, e.clientY, this.last_pos);
        this.view_transform.x += (e.clientX - this.last_pos[0])/ Math.min(1, scale);
        this.view_transform.y += (e.clientY- this.last_pos[1])/ Math.min(1, scale);
        //prevent panning out of bounds
        this.view_transform.x = Math.min(0, this.view_transform.x); 
        this.view_transform.y = Math.min(0, this.view_transform.y);
        this.view_transform.x = Math.max(this.view_transform.x, canvasW * scale - imgW );
        this.view_transform.y = Math.max(this.view_transform.y, canvasH * scale - imgH );
        this.last_pos = [e.clientX, e.clientY];
        this.render();
    }

    zoom(e) {
        e.preventDefault();
        const oldX = this.view_transform.x;
        const oldY = this.view_transform.y;

        const localX = e.clientX;
        const localY = e.clientY;

        const previousScale = this.view_transform.scale;
        let newScale = previousScale + e.deltaY * -0.001;
        newScale = Math.max(Math.min(5, newScale), 0.5); // Prevent negative or zero scale

        const newX = localX - (localX - oldX) * (newScale / previousScale);
        const newY = localY - (localY - oldY) * (newScale / previousScale);

        this.view_transform.x = newX;
        this.view_transform.y = newY;
        this.view_transform.scale = newScale;
        this.render();
    }

    dist(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
    }

    draw_circle(x, y, width) {
        this.label_ctx.strokeStyle = this.color;
        this.label_ctx.fillStyle = this.color;
        this.label_ctx.beginPath();
        this.label_ctx.imageSmoothingEnabled = false;
        this.label_ctx.arc(x, y, width, 0, 2 * Math.PI);
        this.label_ctx.fill();
    }

    draw_point(x, y) {
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
                    this.draw_circle(xn, yn, this.brush_width * this.view_transform.scale);

                    spacing_ratio_total += spacing_ratio;
                }
            } else {
                this.draw_circle(x, y, this.brush_width * this.view_transform.scale);
            }
        } else {
            this.draw_circle(x, y, this.brush_width * this.view_transform.scale);
        }
    }

    remove_gray(){
        let imageData = this.label_ctx.getImageData(0, 0, this.label_canvas.width, this.label_canvas.height);
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
        this.label_ctx.putImageData(imageData, 0, 0);
    }

    render(){
        this.label_ctx.clearRect(0, 0, this.img.width, this.img.height);
        this.img_ctx.clearRect(0, 0, this.img.width, this.img.height);
        this.draw_image(0, 0, this.view_transform);
        this.draw_label(0, 0, this.view_transform);
    }

    switch_color() {
        if (this.color === "rgb(255, 255, 255)") {
            this.color = "rgb(0, 0, 0)"; // Use RGB for black
        } else {
            this.color = "rgb(255, 255, 255)"; // Use RGB for white
        }
    }

    undo() {
        if (this.past.length > 0) {
            // Save the current state for redo
            current_state = this.label_ctx.getImageData(0, 0, canvas_width, canvas_height);
            this.future.push(current_state);
            // Reload the past state
            past_state = this.past.pop()
            this.label_ctx.putImageData(past_state, 0, 0);
            this.label = past_state;
            this.render();
            this.save_state();
        }
    }

    redo() {
        if (future.length > 0) {
            // Save the current state for undo
            current_state = this.label_ctx.getImageData(0, 0, canvas_width, canvas_height);
            this.past.push(current_state);
            // Reload the past state
            state = this.future.pop()
            this.label_ctx.putImageData(state, 0, 0);
            this.label = state;
            this.render();
            this.save_state();
        }
    }

    change_brush_size(size) {
        if (this.brush_width + size < 1) {
            return; 
        }
        this.brush_width += size;
    }

    reset_mask() {
        this.label = null;
        this.draw_label();
        this.save_state();
    }

    save_state() {
        this.img = this.img_ctx.getImageData(0, 0, this.img_canvas.width, this.img_canvas.height);
        this.label = this.label_ctx.getImageData(0, 0, this.label_canvas.width, this.label_canvas.height);
    }

    get_xy(e) {
        let rect = e.target.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;

        x = (x / rect.width) * this.img_canvas.width;
        y = (y / rect.height) * this.img_canvas.height;

        return [x, y];
    }
}