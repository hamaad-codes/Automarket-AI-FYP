import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);
dotenv.config();

const convertToWav = async (inputPath) => {
    const outputPath = inputPath + '.converted.wav';
    // 16kHz, mono, PCM s16le
    const command = `"${ffmpegPath}" -y -i "${inputPath}" -ar 16000 -ac 1 -c:a pcm_s16le "${outputPath}"`;
    try {
        await execPromise(command);
        if (!fs.existsSync(outputPath)) {
            throw new Error('FFmpeg executed but output file not found');
        }
        return outputPath;
    } catch (error) {
        console.error('FFmpeg Conversion Error:', error);
        throw new Error('Failed to convert audio to WAV using ffmpeg-static.');
    }
};

const callGeminiTranscription = async (genAI, audioData, prompt) => {
    // Try Gemini 2.5 Flash first (verified active quota)
    try {
        console.log("🤖 Attempting transcription with gemini-2.5-flash...");
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent([prompt, audioData]);
        return result.response.text();
    } catch (err25) {
        console.warn("Gemini 2.5 Flash transcription failed. Trying gemini-flash-latest fallback. Error:", err25.message);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const result = await model.generateContent([prompt, audioData]);
        return result.response.text();
    }
};

export const transcribeAudioWithGemini = async (inputAudioPath) => {
    let convertedWavPath = null;
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY not found in environment variables");
        
        const genAI = new GoogleGenerativeAI(apiKey);

        if (!fs.existsSync(inputAudioPath)) {
            throw new Error(`Audio file not found: ${inputAudioPath}`);
        }

        console.log('[Gemini Voice] Converting audio to WAV using FFmpeg-static...');
        convertedWavPath = await convertToWav(inputAudioPath);

        console.log('[Gemini Voice] Sending audio to Gemini API...');
        
        // Convert WAV audio to inline data object for Gemini
        const audioBuffer = fs.readFileSync(convertedWavPath);
        const audioData = {
            inlineData: {
                data: audioBuffer.toString("base64"),
                mimeType: "audio/wav"
            }
        };

        const prompt = "Transcribe the following audio exactly as spoken. Return only the transcription text, without any additional explanations, notes, or intros. The audio may be in English, Urdu, or Punjabi. If it is Urdu, write it in native Arabic script or Roman Urdu. If it is Punjabi, write it in Shahmukhi (Urdu script) or Roman Punjabi. If it is English, write it in English. Do not translate the text, only transcribe it.";

        const text = await callGeminiTranscription(genAI, audioData, prompt);

        console.log(`[Gemini Voice] Response: ${text}`);
        return text;

    } catch (error) {
        console.error('Gemini Transcription Error:', error.message);
        throw new Error('Transcription failed: ' + error.message);
    } finally {
        if (convertedWavPath && fs.existsSync(convertedWavPath)) {
            try {
                fs.unlinkSync(convertedWavPath);
            } catch (e) { /* ignore */ }
        }
    }
};
