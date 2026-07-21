import sys
import io
import os
import whisper
from flask import Flask, request, jsonify
import warnings

# Suppress warnings
warnings.filterwarnings("ignore")

app = Flask(__name__)

# Load Model ONCE when script starts
print("Loading Whisper Model (Small)... This may take a moment.")
try:
    # Use CUDA if available
    import torch
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")
    model = whisper.load_model("small", device=device)
    print("Model Loaded Successfully!")
except Exception as e:
    print(f"Failed to load model: {e}")
    sys.exit(1)

@app.route('/transcribe', methods=['POST'])
def transcribe():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Save to temp file (Whisper's transcribed method works best with paths)
        temp_path = "temp_audio_flask.wav"
        file.save(temp_path)

        # Transcribe - Optimized for extreme speed
        # beam_size=1 (greedy) is the fastest way to get results
        # temperature=0 prevents extra sampling passes
        result = model.transcribe(
            temp_path, 
            language="ur", 
            beam_size=1, 
            best_of=1,
            fp16=(device == "cuda"),
            condition_on_previous_text=False # Faster, less context
        )
        text = result["text"].strip()

        # Cleanup
        if os.path.exists(temp_path):
            os.remove(temp_path)

        return jsonify({'text': text})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Run on port 5001 to avoid conflict with Node (5000)
    print("Starting Flask Server on port 5001...")
    app.run(host='0.0.0.0', port=5001)
