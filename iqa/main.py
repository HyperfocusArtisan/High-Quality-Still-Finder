import pyiqa
import torch
import os
import cv2
from video2images import Video2Images
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


model = None
video_path = None
output_dir = None
images = None

# @app.route('/iqa', methods=['POST'])
# def iqa():
#     return jsonify({"message": "iqa method triggered"})
    
# def get_video_result():
#     output_dir = os.path.join(os.path.dirname(video_path.value), os.path.basename(video_path.value).split('.')[0])
#     os.makedirs(output_dir, exist_ok=True)
#     video2images = Video2Images(video_filepath=video_path.value, out_dir=output_dir)
#     file_count = len(os.listdir(output_dir))


@app.route('/iqa', methods=['POST'])
def iqa():
    data = request.get_json()
    directory_path = data.get('directory_path')
    model = data.get('model')
    print(f"iqa method triggered")
    if not directory_path or not model:
        return jsonify({"error": "Missing directory_path or model"}), 400
    
    files = [f for f in os.listdir(directory_path) if f.lower().endswith('.jpg')]
    results = []
    csv_path = os.path.join(directory_path, '.results.csv')
    
    with open(csv_path, 'w') as f1:
        print(f"Starting...")
        for infile in files:
            full_path = os.path.join(directory_path, infile)
            print(f"Processing: {full_path}")
            device = torch.device("cuda") if torch.cuda.is_available() else torch.device("cpu")
            
            if model == 'clipiqa':
                iqa_metric = pyiqa.create_metric('clipiqa', device=device)
            elif model == 'clipiqa+':
                iqa_metric = pyiqa.create_metric('clipiqa+', device=device)
            elif model == 'clipiqa+_vitL14_512':
                iqa_metric = pyiqa.create_metric('clipiqa+_vitL14_512', device=device)
            elif model == 'fid':
                iqa_metric = pyiqa.create_metric('fid', device=device)
            elif model == 'brisque':
                iqa_metric = pyiqa.create_metric('brisque', device=device)
            elif model == 'qalign':
                iqa_metric = pyiqa.create_metric('qalign', device=device)
            elif model == 'topiq_iaa':
                iqa_metric = pyiqa.create_metric('topiq_iaa', device=device)
            elif model == 'nima':
                iqa_metric = pyiqa.create_metric('nima', device=device)
            elif model == 'dbcnn':
                iqa_metric = pyiqa.create_metric('dbcnn', device=device)
            elif model == 'hyperiqa':
                iqa_metric = pyiqa.create_metric('hyperiqa', device=device)
            elif model == 'topiq_nr':
                iqa_metric = pyiqa.create_metric('topiq_nr', device=device)
            elif model == 'clipiqa+_rn50_512':
                iqa_metric = pyiqa.create_metric('clipiqa+_rn50_512', device=device)
            elif model == 'maniqa':
                iqa_metric = pyiqa.create_metric('maniqa', device=device)
            elif model == 'musiq-koniq':
                iqa_metric = pyiqa.create_metric('musiq-koniq', device=device)
            else:
                raise ValueError(f'Unknown model: {model}')
            
            score = iqa_metric(full_path).item()
            print(f"SCORE: {score}")
            f1.write(f"{infile},{score}\n")
            results.append({"file": infile, "score": score})
    
    return jsonify({"results": results, "csv_path": csv_path}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)