import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import { spawn } from 'child_process';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { GoogleGenerativeAI } from "@google/generative-ai";

const execPromise = util.promisify(exec);

/**
 * Clean transcript from common Whisper hallucinations (e.g. static/silence translations)
 */
const cleanTranscript = (text) => {
    if (!text) return "";
    const lower = text.toLowerCase().trim();
    const hallucinations = [
        "takk for at du så med",
        "takk for at du",
        "takk for",
        "takk",
        "så med",
        "thank you",
        "kjell",
        "subtitles by",
        "amara.org",
        "watching",
        "please subscribe",
        "subscribe"
    ];
    
    // Remove if it contains only punctuation
    if (/^[.,\s!?\-()]+$/.test(lower)) {
        return "";
    }
    
    // Filter out common silent hallucination patterns
    for (const h of hallucinations) {
        if (lower === h || lower.includes("takk for at du så") || lower === "takk for watching") {
            console.log(`[Whisper Clean] Filtered out hallucination: "${text}"`);
            return "";
        }
    }
    
    return text;
};

/**
 * Transcribes audio using Groq Cloud Whisper API
 */
const transcribeAudioWithGroq = async (audioPath) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error("GROQ_API_KEY not found in .env");
    }

    if (!fs.existsSync(audioPath)) {
        throw new Error(`Audio file not found: ${audioPath}`);
    }

    console.log('[Groq Voice] Sending audio to Groq API for transcription...');
    
    const fileBuffer = fs.readFileSync(audioPath);
    const fileBlob = new Blob([fileBuffer], { type: 'audio/webm' });

    const formData = new FormData();
    formData.append('file', fileBlob, 'voice.webm');
    formData.append('model', 'whisper-large-v3');
    formData.append('prompt', 'Suzuki Mehran, Toyota Corolla, Honda Civic, Alto, automatic, manual, price, budget, Lahore, Karachi, Islamabad, buy car, gari chahiye');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: formData
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq Whisper API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const rawText = data.text ? data.text.trim() : '';
    const cleanedText = cleanTranscript(rawText);
    console.log(`[Groq Voice] Transcription: raw="${rawText}", cleaned="${cleanedText}"`);
    return cleanedText;
};

/**
 * Transcribes audio using Google Generative AI (Gemini API)
 */
const transcribeAudioWithGemini = async (audioPath) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY not found in .env");
    }

    console.log('[Gemini Voice] Loading Gemini API for transcription...');
    const genAI = new GoogleGenerativeAI(apiKey);
    const models = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-8b"];
    let lastError = null;

    if (!fs.existsSync(audioPath)) {
        throw new Error(`Audio file not found: ${audioPath}`);
    }

    const audioBuffer = fs.readFileSync(audioPath);
    const base64Data = audioBuffer.toString("base64");

    const audioPart = {
        inlineData: {
            data: base64Data,
            mimeType: "audio/webm"
        }
    };

    const prompt = "Transcribe the audio exactly in the language spoken. If the user speaks in Roman Urdu, Roman Punjabi, or a mix of English and Urdu/Punjabi, transcribe it exactly in Roman script (using English letters, e.g., 'meinu automatic gari chahiye', '3 lakh tak di gadi'). If they speak in native Urdu/Punjabi, transcribe it in Urdu script. Do not translate to English, do not add introductions, explanations, notes, or punctuation details. Just output the raw transcribed text. If the audio has only silence or noise, return nothing.";

    for (const modelName of models) {
        try {
            console.log(`[Gemini Voice] Sending audio to ${modelName} for transcription...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent([audioPart, prompt]);
            const rawText = result.response.text().trim();
            const cleanedText = cleanTranscript(rawText);
            console.log(`[Gemini Voice] Transcription successful with ${modelName}: raw="${rawText}", cleaned="${cleanedText}"`);
            return cleanedText;
        } catch (err) {
            console.warn(`[Gemini Voice] Transcription failed with ${modelName}. Error: ${err.message}`);
            lastError = err;
        }
    }
    throw lastError || new Error("All Gemini models failed for transcription");
};

/**
 * Converts input audio file to mono 16kHz WAV format (PCM s16le)
 */
const convertToWav = async (inputPath) => {
    const outputPath = inputPath + '.whisper.wav';
    const command = `"${ffmpegPath}" -y -i "${inputPath}" -ar 16000 -ac 1 -c:a pcm_s16le "${outputPath}"`;
    try {
        await execPromise(command);
        if (!fs.existsSync(outputPath)) {
            throw new Error('FFmpeg conversion executed but output file not found');
        }
        return outputPath;
    } catch (error) {
        console.error('[Whisper] FFmpeg Conversion Error:', error);
        throw new Error('Failed to convert audio to WAV for Whisper.');
    }
};

/**
 * Transcribes audio using local Python script executing Whisper
 */
export const transcribeAudioWithWhisper = async (inputAudioPath) => {
    if (process.env.USE_LOCAL_WHISPER !== 'true') {
        try {
            // Try Gemini API first (much better accuracy for Pakistani accents, Roman Urdu, and Punjabi)
            return await transcribeAudioWithGemini(inputAudioPath);
        } catch (geminiError) {
            console.warn("⚠️ Gemini voice transcription failed, trying Groq API. Error:", geminiError.message);
            try {
                // Try Groq API as backup
                return await transcribeAudioWithGroq(inputAudioPath);
            } catch (groqError) {
                console.warn("⚠️ Groq voice transcription failed as well. Falling back to local Whisper. Error:", groqError.message);
            }
        }
    }
    let wavPath = null;
    try {
        if (!fs.existsSync(inputAudioPath)) {
            throw new Error(`Audio file not found: ${inputAudioPath}`);
        }

        console.log('[Whisper] Converting audio to WAV using FFmpeg...');
        wavPath = await convertToWav(inputAudioPath);

        console.log('[Whisper] Launching Python Whisper transcription script...');
        const scriptPath = path.join(process.cwd(), 'scripts', 'transcribe.py');
        const venvPythonPath = path.join(process.cwd(), 'venv', 'Scripts', 'python.exe');

        // Determine python executable to use (venv python first, fallback to global python)
        const pythonCommand = fs.existsSync(venvPythonPath) ? venvPythonPath : 'python';
        console.log(`[Whisper] Using python executable: ${pythonCommand}`);

        const ffmpegDir = path.dirname(ffmpegPath);
        const envPath = process.env.PATH ? `${ffmpegDir};${process.env.PATH}` : ffmpegDir;

        return new Promise((resolve, reject) => {
            const pythonProcess = spawn(pythonCommand, [scriptPath, wavPath], {
                env: { 
                    ...process.env, 
                    PATH: envPath,
                    PYTHONIOENCODING: 'utf-8' 
                }
            });

            let stdoutData = '';
            let stderrData = '';

            pythonProcess.stdout.on('data', (data) => {
                stdoutData += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                stderrData += data.toString();
            });

            pythonProcess.on('close', (code) => {
                // Clean up wav file as soon as process closes
                if (wavPath && fs.existsSync(wavPath)) {
                    try { fs.unlinkSync(wavPath); } catch (e) { /* ignore */ }
                    wavPath = null;
                }

                if (code !== 0) {
                    console.error('[Whisper] Python script error (exit code ' + code + '):', stderrData);
                    let errMsg = stderrData.trim();
                    if (stderrData.includes("ModuleNotFoundError") && stderrData.includes("whisper")) {
                        errMsg = "Local Whisper is not fully installed. Please run: 'venv\\Scripts\\pip install openai-whisper torch soundfile' in the server directory.";
                    }
                    reject(new Error(errMsg || 'Whisper transcription script exited with code ' + code));
                } else {
                    const text = stdoutData.trim();
                    console.log(`[Whisper] Transcription result: "${text}"`);
                    resolve(text);
                }
            });

            pythonProcess.on('error', (err) => {
                if (wavPath && fs.existsSync(wavPath)) {
                    try { fs.unlinkSync(wavPath); } catch (e) { /* ignore */ }
                    wavPath = null;
                }
                console.error('[Whisper] Failed to start Python process:', err.message);
                reject(err);
            });
        });

    } catch (error) {
        if (wavPath && fs.existsSync(wavPath)) {
            try { fs.unlinkSync(wavPath); } catch (e) { /* ignore */ }
        }
        console.error('[Whisper] Transcription Error:', error.message);
        throw error;
    }
};
