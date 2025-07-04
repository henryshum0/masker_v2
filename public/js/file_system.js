
export class FileSystem {
    constructor(dataset_name) {
        this.dataset_name = dataset_name;
        this.opened_image = new Image();
        this.opened_label = new Image();
        this.image_name = null;
        this.label_name = null;
    }

    async upload_image(image_base64, img_name) {
        return fetch(`/datasets/${this.dataset_name}/images/${img_name}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'type':'upload'
            },
            body: JSON.stringify({ image: image_base64 })
        })
        .then(async (response) => {
            return response.json();
        })
        .catch(error => {
            console.error("Error saving image:", error);
            return null;
        });
    }

    async upload_label(label_base64, img_name) {
        return fetch(`/datasets/${this.dataset_name}/labels/${img_name}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'type':'upload',

            },
            body: JSON.stringify({ label: label_base64 })
        })
        .then(async (response) => {
            return response.json();
        })
        .catch(error => {
            console.error("Error saving label:", error);
            return null;
        });
    }

    async get_corr_label(img_file_or_id){
        let img_id = img_file_or_id.split('.')[0];
        let available_labels = await this.get_label_list();
        for (let label of available_labels) {
            if (label.split(/[_\-.]/).includes(img_id)) {
                return label;
            }
        }
        return null;
    }

    async save_label() {
        return fetch(`/datasets/${this.dataset_name}/labels/${this.label_name}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'type':'save'
            },
            body: JSON.stringify({ label: this.opened_label.src.split(',')[1]})
        })
        .then(async (response) => {
            return response.json();
        })
        .catch(error => {
            console.error("Error saving label:", error);
            return null;
        });
        
    }

    async get_img_list() {
    return await fetch(`/datasets/${this.dataset_name}/images`)
        .then(response => response.json())
        .catch(error => {
            console.error("Error fetching image list:", error);
            return [];
        });
    }

    async get_label_list() {
        return await fetch(`/datasets/${this.dataset_name}/labels`)
            .then(response => response.json())
            .catch(error => {
                console.error("Error fetching label list:", error);
                return [];
            });
    }

    async get_img(img_name) {
        
        return await fetch(`datasets/${this.dataset_name}/images/${img_name}`)
            .then(async (response) => {
                if (!response.ok) {
                    console.warn("Image not found");
                    return false;
                }
                let img_base64 = await response.text();
                this.opened_image.src = `data:image/png;base64,${img_base64}`;
                this.image_name = img_name;
                this.label_name = img_name.split('.')[0] + ".png";
                return true;
            })
            .catch(error => {
                console.error("Error fetching image:", error);
                return false;
            });
    }

    async get_label(label_name) {
        return await fetch(`datasets/${this.dataset_name}/labels/${label_name}`)
            .then(async (response) =>  {
                if (!response.ok) {
                    return false;
                }
                let label_base64 = await response.text();
                this.opened_label.src = `data:image/png;base64,${label_base64}`;
                return true;
            })
            .catch(error => {
                console.error("Error fetching label:", error);
                return false;
            });
    }
}