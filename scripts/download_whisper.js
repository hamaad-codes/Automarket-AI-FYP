import https from 'https';
import fs from 'fs';
import path from 'path';

const MODEL_DIR = 'D:\\whisper_models';
const MODEL_URL = 'https://huggingface.co/distil-whisper/distil-small.en/resolve/main/ggml-tiny.bin'; // Example URL for tiny model
// Correct URL for ggml tiny model from official whisper.cpp repo or similar
const WHISPER_TINY_URL = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin';

if (!fs.existsSync(MODEL_DIR)) {
    fs.mkdirSync(MODEL_DIR, { recursive: true });
}

const dest = path.join(MODEL_DIR, 'ggml-tiny.bin');

console.log(`Downloading Whisper tiny model to ${dest}...`);

const file = fs.createWriteStream(dest);
https.get(WHISPER_TINY_URL, (response) => {
    response.pipe(file);
    file.on('finish', () => {
        file.close();
        console.log('Download complete!');
    });
}).on('error', (err) => {
    fs.unlink(dest);
    console.error(`Error downloading model: ${err.message}`);
});
