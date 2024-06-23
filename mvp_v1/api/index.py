from flask import Flask, jsonify, request, current_app
from dotenv import load_dotenv
import os
from werkzeug.utils import secure_filename
from flask_cors import CORS


import requests
import time
 # Enable CORS for all routes

load_dotenv()  # Load environment variables from .env file
app = Flask(__name__)
CORS(app) 

@app.route("/api/python", methods=['POST'])
def translate():
    print(request.files)
    if 'audioFile' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400
    
    file = request.files['audioFile']
    
    print("file",file.filename)
    # Example: Save the file to a specific location
    if file:
        # Save the file with a new name
        new_filename = 'test.flac'
        try:
            # Save the file with the new name
            file.save(f'api/uploads/{new_filename}')
            print(f'File successfully uploaded and saved as {new_filename}')
        except Exception as e:
            print(f'Failed to save file: {e}')
    
    # Process the file (for example, save it to disk or read its content)
    
    API_URL = "https://api-inference.huggingface.co/models/openai/whisper-large-v3"
    headers = {"Authorization": "Bearer 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"}

    with open('api/uploads/test.flac', "rb") as f:
        data = f.read()
        
    print("data",data)
        
    with app.app_context():
        response = requests.post(API_URL, headers=headers, data=data)
        print(response.json())

    if response.status_code == 503:
        estimated_time = response.json().get('estimated_time', 0)
        print(f"Model is currently loading. Waiting for {estimated_time} seconds...")
        time.sleep(estimated_time)
        
    return jsonify(response.json())

if __name__ == "__main__":
    app.run(debug=True)
