import { Canvas } from "./canvas.js";
import { UI } from "./ui.js";
import { FileSystem } from "./file_system.js";

let dataset_name = document.getElementById("dataset").textContent;
let canvas = new Canvas("mask-canvas", "image-canvas");
let file_system = new FileSystem(dataset_name);
let ui = new UI("controls", canvas, file_system);


let image = await file_system.get_img("1.JPG");
let label = await file_system.get_label("137.png");

if (image) {
    canvas.drawImage(file_system.opened_image);
}
if (label) {
    canvas.drawMask(file_system.opened_label);
}



// console.log(await file_system.save_label(image, dataset_name, "138.png"))
// console.log(await file_system.upload_label(image, dataset_name, "139.png"))
// console.log(await file_system.upload_image(image, dataset_name, "140.png"))


console.log(file_system.image_name);
console.log(file_system.label_name);

console.log(await file_system.save_label());