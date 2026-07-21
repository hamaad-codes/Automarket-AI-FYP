import sys
import os
import warnings

# Suppress warnings to keep stdout clean
warnings.filterwarnings("ignore")

def main():
    if len(sys.argv) < 2:
        print("Error: No audio file path provided", file=sys.stderr)
        sys.exit(1)
        
    audio_path = sys.argv[1]
    if not os.path.exists(audio_path):
        print(f"Error: File not found at {audio_path}", file=sys.stderr)
        sys.exit(1)
        
    # Read model name from env, default to 'base'
    model_name = os.getenv("WHISPER_MODEL", "base")
    
    try:
        # Import whisper and torch inside main
        import torch
        import whisper
        
        # Use CUDA if available
        device = "cuda" if torch.cuda.is_available() else "cpu"
        
        # Load whisper model (will download to cache if not already present)
        model = whisper.load_model(model_name, device=device)
        
        # Transcribe with fp16 disabled on CPU to prevent empty outputs
        result = model.transcribe(
            audio_path,
            fp16=(device == "cuda"),
            beam_size=1,
            best_of=1,
            condition_on_previous_text=False
        )
        
        # Output ONLY the transcription text to stdout
        print(result["text"].strip())
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
