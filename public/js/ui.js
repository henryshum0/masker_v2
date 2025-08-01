export class UI {

    constructor(ui_container_ID, canvas, file_system) {
        this.canvas = canvas;
        this.file_system = file_system;
        this.container = document.getElementById(ui_container_ID);
        this.cursor = document.getElementById('custom-cursor');
        document.body.style.cursor = 'none';
        this.update_custom_cursor();
        this.init();
        this.add_event_listeners();
    }

    add_event_listeners() {
        this.back_btn.addEventListener('click', () => {
            window.location.href = '/';
        });
        this.open_img_btn.addEventListener('click', this.openImg.bind(this));
        this.upload_img_btn.addEventListener('click', this.uplaodImage.bind(this));
        this.upload_mask_btn.addEventListener('click', this.uplaodLabel.bind(this));
        this.save_btn.addEventListener('click', this.saveLabel.bind(this));
        this.redo_btn.addEventListener('click', this.canvas.redo.bind(this.canvas));
        this.undo_btn.addEventListener('click', this.canvas.undo.bind(this.canvas));
        this.clear_btn.addEventListener('click', this.canvas.resetMask.bind(this.canvas));
        this.toggle_mask_btn.addEventListener('click', this.canvas.toggleMask.bind(this.canvas));
        this.hide_btn.addEventListener('click', this.toggleUI.bind(this));
        this.switch_color_btn.addEventListener('click',()=> {this.canvas.switchColor(); this.update_custom_cursor();});
        this.crop_btn.addEventListener('click', this.startCropMode.bind(this));
        this.inc_pensize_btn.addEventListener('click', () => {
            this.canvas.changeBrushSize(2);
            this.update_custom_cursor();
        });
        this.dec_pensize_btn.addEventListener('click', () => {
            this.canvas.changeBrushSize(-2);
            this.update_custom_cursor();
        });
        this.canvas.add_event_listener('mousemove', this.move_custom_cursor.bind(this));
        window.addEventListener('keydown', this.keyboard_shortcuts.bind(this));
    }

    init() {

        const back_btn = document.createElement('button');
        back_btn.textContent = '🚪 Back';
        back_btn.className = 'control-button';
        back_btn.id = 'back';
        this.back_btn = back_btn;

        const open_img_btn = document.createElement('button');
        open_img_btn.textContent = '📂 Open Image (o)';
        open_img_btn.className = 'control-button';
        open_img_btn.id = 'open-image';
        this.open_img_btn = open_img_btn;

        const upload_img_btn = document.createElement('button');
        upload_img_btn.textContent = '📂 Upload Image';
        upload_img_btn.className = 'control-button';
        upload_img_btn.id = 'upload-image';
        this.upload_img_btn = upload_img_btn;

        const upload_mask_btn = document.createElement('button');
        upload_mask_btn.textContent = '📂 Upload Mask';
        upload_mask_btn.className = 'control-button';
        upload_mask_btn.id = 'upload-mask';
        this.upload_mask_btn = upload_mask_btn;

        const save_btn = document.createElement('button');
        save_btn.textContent = '💾 Save Mask (s)';
        save_btn.className = 'control-button';
        save_btn.id = 'save'
        this.save_btn = save_btn;

        const hide_btn = document.createElement('button');
        hide_btn.textContent = '👁️ Hide UI (h)'
        hide_btn.className = 'control-button'
        hide_btn.id = 'hide-mask';
        this.hide_btn = hide_btn;

        const toggle_mask_btn = document.createElement('button');
        toggle_mask_btn.textContent = '👁️ Toggle Mask (m)';
        toggle_mask_btn.className = 'control-button';
        toggle_mask_btn.id = 'toggle-mask';
        this.toggle_mask_btn = toggle_mask_btn;

        const inc_pensize_btn = document.createElement('button');
        inc_pensize_btn.textContent = '➕ Pen Size (e/3)';
        inc_pensize_btn.className = 'control-button';
        inc_pensize_btn.id = 'inc-pensize';
        this.inc_pensize_btn = inc_pensize_btn;

        const dec_pensize_btn = document.createElement('button');
        dec_pensize_btn.textContent = '➖ Pen Size (q/1)';
        dec_pensize_btn.className = 'control-button';
        dec_pensize_btn.id = 'dec-pensize';
        this.dec_pensize_btn = dec_pensize_btn;

        const switch_color_btn = document.createElement('button');
        switch_color_btn.textContent = `Switch Color (c)`
        switch_color_btn.className = 'control-button'
        switch_color_btn.id = 'switch-color';
        this.switch_color_btn = switch_color_btn;

        const crop_btn = document.createElement('button');
        crop_btn.textContent = '✂️ Predict';
        crop_btn.className = 'control-button';
        crop_btn.id = 'crop';
        this.crop_btn = crop_btn;

        const clear_btn = document.createElement('button');
        clear_btn.textContent = '🗑️ Clear Mask (f)';
        clear_btn.className = 'control-button';
        clear_btn.id = 'clear-mask';
        this.clear_btn = clear_btn;
        
        const undo_btn = document.createElement('button');
        undo_btn.textContent = '↩️ Undo (ctrl+z)';
        undo_btn.className = 'control-button';
        undo_btn.id = 'undo';
        this.undo_btn = undo_btn;

        const redo_btn = document.createElement('button');
        redo_btn.textContent = '↪️ Redo (ctrl+y)';
        redo_btn.className = 'control-button';
        redo_btn.id = 'redo';
        redo_btn.addEventListener('click', this.canvas.redo.bind(this.canvas));
        this.redo_btn = redo_btn;


        this.container.appendChild(back_btn);
        this.container.appendChild(open_img_btn);
        this.container.appendChild(upload_img_btn);
        this.container.appendChild(upload_mask_btn);
        this.container.appendChild(save_btn);
        this.container.appendChild(hide_btn);
        this.container.appendChild(toggle_mask_btn);
        this.container.appendChild(inc_pensize_btn);
        this.container.appendChild(dec_pensize_btn);
        this.container.appendChild(switch_color_btn);
        this.container.appendChild(crop_btn);
        this.container.appendChild(clear_btn);
        this.container.appendChild(undo_btn);
        this.container.appendChild(redo_btn);
    }

    keyboard_shortcuts(e) {
    
    if (e.ctrlKey && e.key === 'z') {
        this.canvas.undo();
    }

    if (e.ctrlKey && e.key === 'y') {
        this.canvas.redo();
    }
    
    if (e.key === '1') {
        this.canvas.changeBrushSize(-8);
        this.update_custom_cursor();
    } else if (e.key === '3') {
        this.canvas.changeBrushSize(8);
        this.update_custom_cursor();
    }

    else if (e.key === 'c') {
        this.canvas.switchColor();
        this.update_custom_cursor();
    }
    
    else if (e.key === 'm') {
        this.canvas.toggleMask();
    }
    
    else if (e.key === 'h') {
        this.toggleUI();
    }

    else if (e.key === 'e') {
        this.canvas.changeBrushSize(2);
        this.update_custom_cursor();
    }
    else if (e.key === 'q') {
        this.canvas.changeBrushSize(-2);
        this.update_custom_cursor();
    }
    else if (e.key === 'f') {
        this.canvas.resetMask();
    }
    }   

    update_custom_cursor() {
        this.cursor.style.display = "block";
        this.cursor.style.width = 2 * this.canvas.brush_width + "px";
        this.cursor.style.height = 2 * this.canvas.brush_width + "px";
        this.cursor.style.borderColor = this.canvas.color === "rgb(255, 255, 255)" ? "rgb(255, 255, 255)" : "rgb(255, 0, 0)";
    }

    hide_custom_cursor() {
        this.cursor.style.display = "none";
    }

    move_custom_cursor(e) {
        this.cursor.style.left = (e.clientX - this.canvas.brush_width -2) + "px";
        this.cursor.style.top = (e.clientY - this.canvas.brush_width -2) + "px";
        this.cursor.style.display = "block";    
    }

    toggleUI() {
        if(this.container.style.display === "none") {
            this.container.style.display = "flex";
        }
        else {
            this.container.style.display = "none";
        }
    }

    async openImg(){
        document.getElementById('modal').style.display = 'flex';
        const itemList = document.getElementById('item-list');
        while (itemList.firstChild) {
            itemList.removeChild(itemList.firstChild);
        }
        let img_list = await this.file_system.get_img_list()
        img_list.forEach((img_name) => {
            const btn = document.createElement('button');
            btn.className = 'modal-button';
            btn.textContent = img_name
            btn.onclick = async () => {
                let img_ok = await this.file_system.get_img(img_name);
                if (img_ok) {
                    this.canvas.drawImage(this.file_system.opened_image);
                }
                else {
                    console.warn("Image not found")
                    return;
                }
                let correct_label = await this.file_system.get_corr_label(img_name);
                let label_ok = await this.file_system.get_label(correct_label);
                if (label_ok) {
                    this.canvas.drawMask(this.file_system.opened_label);
                }
                else {
                    console.warn("label not found")
                    this.canvas.resetMask();
                }

                document.getElementById('modal').style.display = 'none';
            }
            itemList.appendChild(btn);
        })
    }

    async uplaodImage(e) {
        // Store original button text
        const originalText = this.upload_img_btn.textContent;
        
        document.getElementById('file-input').click();
        document.getElementById('file-input').onchange = async (event) => {
            const files = event.target.files;
            if (files.length > 0) {
                let successCount = 0;
                let failCount = 0;
                
                for (let file of files) {
                    if (file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = async (e) => {
                            try {
                                let img_base64 = e.target.result;
                                let img_ok = await this.file_system.upload_image(img_base64, file.name);
                                console.log(img_ok);
                                
                                if (img_ok) {
                                    successCount++;
                                } else {
                                    failCount++;
                                }
                                
                                // Update button with progress
                                if (files.length > 1) {
                                    this.upload_img_btn.textContent = `Uploaded ${successCount}/${files.length}`;
                                } else {
                                    this.upload_img_btn.textContent = '✅ Uploaded!';
                                }
                                this.upload_img_btn.style.backgroundColor = '#4caf50'; // Green
                                
                                // When all files are processed
                                if (successCount + failCount === files.length) {
                                    if (failCount > 0) {
                                        this.upload_img_btn.textContent = `⚠️ ${successCount}/${files.length} Uploaded`;
                                        this.upload_img_btn.style.backgroundColor = '#ff9800'; // Orange
                                    }
                                    
                                    // Reset button after delay
                                    setTimeout(() => {
                                        this.upload_img_btn.textContent = originalText;
                                        this.upload_img_btn.style.backgroundColor = '';
                                    }, 1500);
                                }
                            } catch (error) {
                                console.error("Error uploading image:", error);
                                failCount++;
                                
                                this.upload_img_btn.textContent = '❌ Failed!';
                                this.upload_img_btn.style.backgroundColor = '#f44336'; // Red
                                
                                // Reset button after delay
                                setTimeout(() => {
                                    this.upload_img_btn.textContent = originalText;
                                    this.upload_img_btn.style.backgroundColor = '';
                                }, 1500);
                            }
                        };
                        
                        reader.onerror = (error) => {
                            console.error("Error reading file:", error);
                            failCount++;
                            
                            // Update button to show error
                            this.upload_img_btn.textContent = '❌ Failed!';
                            this.upload_img_btn.style.backgroundColor = '#f44336'; // Red
                            
                            // Reset button after delay
                            setTimeout(() => {
                                this.upload_img_btn.textContent = originalText;
                                this.upload_img_btn.style.backgroundColor = '';
                            }, 1500);
                        };
                        
                        reader.readAsDataURL(file);
                    }
                }
            }
        }
    }

    async uplaodLabel(e) {
        // Store original button text
        const originalText = this.upload_mask_btn.textContent;
        
        document.getElementById('file-input').click();
        document.getElementById('file-input').onchange = async (event) => {
            const files = event.target.files;
            if (files.length > 0) {
                let successCount = 0;
                let failCount = 0;
                
                for (let file of files) {
                    if (file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = async (e) => {
                            try {
                                let label_base64 = e.target.result;
                                let label_ok = await this.file_system.upload_label(label_base64, file.name);
                                console.log(label_ok);
                                
                                if (label_ok) {
                                    successCount++;
                                } else {
                                    failCount++;
                                }
                                
                                // Update button with progress
                                if (files.length > 1) {
                                    this.upload_mask_btn.textContent = `Uploaded ${successCount}/${files.length}`;
                                } else {
                                    this.upload_mask_btn.textContent = '✅ Uploaded!';
                                }
                                this.upload_mask_btn.style.backgroundColor = '#4caf50'; // Green
                                
                                // When all files are processed
                                if (successCount + failCount === files.length) {
                                    if (failCount > 0) {
                                        this.upload_mask_btn.textContent = `⚠️ ${successCount}/${files.length} Uploaded`;
                                        this.upload_mask_btn.style.backgroundColor = '#ff9800'; // Orange
                                    }
                                    
                                    // Reset button after delay
                                    setTimeout(() => {
                                        this.upload_mask_btn.textContent = originalText;
                                        this.upload_mask_btn.style.backgroundColor = '';
                                    }, 1500);
                                }
                            } catch (error) {
                                console.error("Error uploading mask:", error);
                                failCount++;
                                
                                this.upload_mask_btn.textContent = '❌ Failed!';
                                this.upload_mask_btn.style.backgroundColor = '#f44336'; // Red
                                
                                // Reset button after delay
                                setTimeout(() => {
                                    this.upload_mask_btn.textContent = originalText;
                                    this.upload_mask_btn.style.backgroundColor = '';
                                }, 1500);
                            }
                        };
                        
                        reader.onerror = (error) => {
                            console.error("Error reading file:", error);
                            failCount++;
                            
                            // Update button to show error
                            this.upload_mask_btn.textContent = '❌ Failed!';
                            this.upload_mask_btn.style.backgroundColor = '#f44336'; // Red
                            
                            // Reset button after delay
                            setTimeout(() => {
                                this.upload_mask_btn.textContent = originalText;
                                this.upload_mask_btn.style.backgroundColor = '';
                            }, 1500);
                        };
                        
                        reader.readAsDataURL(file);
                    }
                }
            }
        }
    }

    async saveLabel() {
        // Store original button text
        const originalText = this.save_btn.textContent;
        
        try {
            const mask_base64 = this.canvas.getMaskBase64();
            this.file_system.opened_label.src = mask_base64;
            let label_ok = await this.file_system.save_label();
            console.log("save label:", label_ok);
            
            // Show success message
            this.save_btn.textContent = '✅ Saved!';
            this.save_btn.style.backgroundColor = '#4caf50'; // Green
        } catch (error) {
            // Show failure message
            console.error("Error saving label:", error);
            this.save_btn.textContent = '❌ Failed!';
            this.save_btn.style.backgroundColor = '#f44336'; // Red
        }
        
        // Reset button text and style after a short delay
        setTimeout(() => {
            this.save_btn.textContent = originalText;
            this.save_btn.style.backgroundColor = ''; // Reset to default
        }, 1500); // 1.5 seconds
    }

    startCropMode() {
        // Update button to show we're in crop mode
        const originalText = this.crop_btn.textContent;
        this.crop_btn.textContent = '✂️ Selecting...';
        this.crop_btn.style.backgroundColor = '#2196F3'; // Blue
        
        // Start the crop selection mode in the canvas
        this.canvas.startCropMode(async (x1, y1, x2, y2) => {
            // This is the callback function that will be called when the user
            // has selected two points for cropping
            console.log(`Crop selection completed: (${x1}, ${y1}) to (${x2}, ${y2})`);
            
            // Get the cropped image as base64
            const croppedImageBase64 = this.canvas.cropImageToBase64(x1, y1, x2, y2);
            
            // Update button to show we're now predicting
            this.crop_btn.textContent = '🔄 Predicting...';
            this.crop_btn.style.backgroundColor = '#FF9800'; // Orange
            
            try {
                // Send the cropped image for prediction
                const predictionResult = await this.file_system.predictCropImage(croppedImageBase64);
                
                if (predictionResult.success) {
                    // If prediction was successful, replace the mask region with the predicted mask
                    console.log("Prediction successful, updating mask");
                    this.canvas.replaceMaskRegion(x1, y1, x2, y2, predictionResult.maskBase64);
                    
                    // Show success on button
                    this.crop_btn.textContent = '✅ Predicted!';
                    this.crop_btn.style.backgroundColor = '#4CAF50'; // Green
                } else {
                    // If prediction failed, just use the original cropped image
                    console.warn("Prediction failed:", predictionResult.error);
                    this.canvas.replaceMaskRegion(x1, y1, x2, y2, croppedImageBase64);
                    
                    // Show failure on button
                    this.crop_btn.textContent = '❌ Prediction Failed';
                    this.crop_btn.style.backgroundColor = '#F44336'; // Red
                    
                    // Display error in console
                    console.error("Prediction failed:", predictionResult.error);
                }
            } catch (error) {
                // If there was an error during prediction, fallback to using the original image
                console.error("Error during prediction:", error);
                this.canvas.replaceMaskRegion(x1, y1, x2, y2, croppedImageBase64);
                
                // Show error on button
                this.crop_btn.textContent = '❌ Error';
                this.crop_btn.style.backgroundColor = '#F44336'; // Red
            }
            
            // Reset button appearance after a delay
            setTimeout(() => {
                this.crop_btn.textContent = originalText;
                this.crop_btn.style.backgroundColor = '';
            }, 2000);
        });
    }
}
