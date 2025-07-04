from os import listdir
from os.path import join, isfile, splitext, basename
import base64
import re
import argparse
from typing import Union

from flask import Flask, render_template, jsonify, request, redirect, url_for


parser = argparse.ArgumentParser()
# Config
parser.add_argument('--root_data_path', default="./datasets", type=str,
                    help="""Path to the root data folder. Must be the
                            parent folder containing category folders.
                            Defaults to ./datasets""")
args = parser.parse_args()


# Utility Functions
def atoi(text: str) -> Union[int, str]:
    """Transforms string-based integers into Python integers.
    Text that is not an integer remains as text.

    :param text: A potentially containing an integer
    :type text: str
    :return: An integer or a string
    :rtype: Union[int, str]
    """

    return int(text) if text.isdigit() else text


def natural_keys(text: str) -> list[Union[int, str]]:
    """Splits and parses zero padded, string-based integers
    so that comparison and sorting are in 'human' order.

    :param text: A string potentially containing an integer
    :type text: str
    :return: A split and integer-parsed list
    :rtype: list[Union[int, str]]
    """

    return [atoi(c) for c in re.split(r'(\d+)', text)]


def get_files(path: str) -> list[str]:
    """Retrieves a list of files from a directory sorted
    in human order.

    :param path: A string-based path to a valid directory
    :type path: str
    :return: A list of string-based file paths
    :rtype: list[str]
    """

    files = [f for f in listdir(path) if isfile(join(path, f))]
    files.sort(key=natural_keys)  # Sorted in human order
    return files


def get_image_paths(path: str) -> list[str]:
    """Retrieves a list of valid PNG or JPEG images in a
    specified directory. The paths returned are scoped at
    a level relative to the input path.

    :param path: A valid folder path
    :type path: str
    :return: A list of image file paths
    :rtype: list[str]
    """

    paths = get_files(path)
    imgs = []
    for img in paths:
        if (img.endswith('.jpg') or img.endswith('.png')
                or img.endswith('.jpeg')):
            imgs.append(join(path, img))
    return imgs


def get_base64_encoded_image(image_path: str) -> str:
    """Retrieves and encodes an image into a base64 string
    from a given path.

    :param image_path: A valid file path to an image
    :type image_path: str
    :return: A base64 encoded string
    :rtype: str
    """

    with open(image_path, "rb") as img_file:
        return base64.b64encode(img_file.read())


# Flask App
app = Flask(__name__,
            static_url_path='',
            static_folder='public',
            )


@app.route("/")
def index():
    return redirect("/datasets")
    
@app.route("/datasets")
def datasets() -> str:
    datasets_path = args.root_data_path
    try:
        datasets = [d for d in listdir(datasets_path) if not isfile(join(datasets_path, d))]
        return render_template('select_dataset.html', datasets=datasets)
    except Exception as e:
        return f"Error: {e}", 500


@app.route("/masking", methods=["GET"])
def img_mask() -> str:
    return render_template('index.html', 
                           dataset=request.args.get('dataset', 'none'))

@app.route("/datasets/<dataset>/<img_or_label>/<filename>", methods=["GET"])
def get_file(dataset: str, img_or_label: str, filename: str) -> str:

    path = join('datasets', dataset, img_or_label, filename)
    if not isfile(path):
        return jsonify({"status": "error", "message": "File not found."}), 404
    return get_base64_encoded_image(path)
    
@app.route('/datasets/<dataset>/images', methods=['GET'])
def get_images(dataset: str) -> str:
    path = join('datasets', dataset, 'images')
    images = get_files(path)
    return jsonify(images)

@app.route('/datasets/<dataset>/labels', methods=['GET'])
def get_labels(dataset: str) -> str:
    path = join('datasets', dataset, 'labels')
    labels = get_files(path)
    return jsonify(labels)

@app.route('/datasets/<dataset>/<img_or_label>/<filename>', methods=['POST'])
def upload(dataset: str, img_or_label: str, filename: str) -> str:
    """Saves a file to the specified dataset's images or labels folder."""
    
    path = join('datasets', dataset, img_or_label, filename)
    
    # Ensure the directory exists
    import os
    os.makedirs(os.path.dirname(path), exist_ok=True)
    type = request.headers.get('type')
    if type == 'save':
        if img_or_label != 'labels':
            return jsonify({"status": "error", "message": "this method only allow for saving mask."}), 400
        mask = request.json.get('label')
        if not mask:
            return jsonify({"status": "error", "message": "No data provided."}), 400
        if (not is_base64_png(mask)) and (not is_base64_jpg(mask)):
            return jsonify({"status": "error", "message": "Data is not a valid base64 PNG or JPG."}), 400
        if (save(path, mask)):
            return jsonify({"status": "success", "message": f"File saved to {path}"}), 200
        else:
            return jsonify({"status": "error", "message": "Failed to save file."}), 500
        
    elif type == 'upload':
        if img_or_label == 'images':
            data = request.json.get('image')
        elif img_or_label == 'labels':
            data = request.json.get('label')
        else:
            return jsonify({"status": "error", "message": "Invalid img_or_label type."}), 400
        if not data:
            return jsonify({"status": "error", "message": "No file provided."}), 400
        if (not is_base64_png(data)) and (not is_base64_jpg(data)):
            return jsonify({"status": "error", "message": "File is not a valid base64 PNG or JPG."}), 400
        if (save(path, data)):
            return jsonify({"status": "success", "message": f"File uploaded to {path}"}), 200
        else:
            return jsonify({"status": "error", "message": "Failed to upload file."}), 500
    else:
        return jsonify({"status": "error", "message": "Invalid request type."}), 400
        
    
def is_base64_jpg(data: str) -> bool:
    # Check for data URL prefix
    prefix = 'data:image/jpeg;base64,'
    if isinstance(data, bytes):
        try:
            data = data.decode('utf-8')
        except Exception:
            return False
    if data.startswith(prefix):
        data = data[len(prefix):]
    elif ',' in data:
        data = data.split(',', 1)[1]
    try:
        decoded = base64.b64decode(data)
        # JPEG files start with 0xFFD8
        return decoded.startswith(b'\xff\xd8')
    except Exception:
        return False
    
def is_base64_png(data: str) -> bool:
    # Check for data URL prefix
    prefix = 'data:image/png;base64,'
    if isinstance(data, bytes):
        try:
            data = data.decode('utf-8')
        except Exception:
            return False
    if data.startswith(prefix):
        data = data[len(prefix):]
    elif ',' in data:
        data = data.split(',', 1)[1]
    try:
        decoded = base64.b64decode(data)
        # PNG files start with these 8 bytes
        return decoded.startswith(b'\x89PNG\r\n\x1a\n')
    except Exception as e:
        print(f"Error decoding PNG: {e}")
        return False
    
def save(path:str, data:str, postfix:str='.png') -> bool:
    try:
        if isinstance(data, str):
            data = data.split(',')[-1]  # Remove the base64 prefix if present
            decoded_data = base64.b64decode(data)
            path = path.split('.')[0] + postfix 
            with open(path, 'wb') as f:
                f.write(decoded_data)
            return True
    except Exception as e:
        raise Exception(f"Failed to save file: {e}")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
