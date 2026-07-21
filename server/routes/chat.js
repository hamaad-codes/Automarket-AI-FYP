import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { transcribeAudioWithWhisper } from '../services/whisperService.js';
import { analyzeChat } from '../services/aiService.js';

const router = express.Router();

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// Multer Config: Save with .webm for Chrome compatibility
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // Unique name to prevent conflicts
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'voice-' + uniqueSuffix + '.webm');
    }
});

const upload = multer({ storage: storage });

/* ---------------- CHAT ENDPOINT ---------------- */
router.post('/message', async (req, res) => {
    try {
        const { messages, preferredLanguage, userPreferences } = req.body;

        // Use the Fallback AI Chat service (Gemini -> Groq)
        const result = await analyzeChat(messages, preferredLanguage, userPreferences);

        res.json({
            message: result.chat_response,
            recommendations: result.recommendations || []
        });

    } catch (error) {
        console.error('Chat Logic Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


/* ---------------- VOICE ENDPOINT ---------------- */
router.post('/voice', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No audio file' });

        const audioPath = req.file.path;
        console.log(`Processing voice input: ${audioPath}`);

        // Use the local Whisper service for transcription
        const transcriptionResult = await transcribeAudioWithWhisper(audioPath);

        // Handle transcription output which might be a string
        let text = "";
        if (typeof transcriptionResult === 'string') {
            text = transcriptionResult;
        } else if (transcriptionResult && transcriptionResult.toString) {
            text = transcriptionResult.toString();
        }

        console.log("Gemini Voice Output:", text);

        if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);

        res.json({ text: text ? text.trim() : "" });
    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        console.error('Voice Error:', error);
        res.status(500).json({ error: 'Transcription failed' });
    }
});

export default router;
