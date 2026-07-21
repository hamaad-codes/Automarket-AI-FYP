# AutoMarket: AI-Powered Vehicle Marketplace - Project Analysis

## 1. Project Overview
AutoMarket is a modern, AI-integrated web application designed to simplify the process of buying and selling vehicles in Pakistan. It combines a traditional vehicle listing marketplace with an advanced **AI Chatbot Advisor** that allows users to find cars using natural language (voice or text) in both **English and Urdu**.

## 2. Technology Stack

### Frontend (Client-Side)
The frontend is built for performance and modern aesthetics, utilizing the React ecosystem.
*   **Framework**: [React](https://react.dev/) with [Vite](https://vitejs.dev/) (Fast build tool).
*   **Language**: [TypeScript](https://www.typescriptlang.org/) (Type safety).
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Utility-first CSS) with [Shadcn UI](https://ui.shadcn.com/) (Accessible components).
*   **State & Routing**: `react-router-dom` for navigation.
*   **Icons**: `lucide-react`.
*   **HTTP Client**: `axios` for API communication.
*   **Voice**: Native Web Audio API (`MediaRecorder`).

### Backend (Server-Side)
The backend uses a hybrid architecture to leverage the best of Node.js (Web IO) and Python (AI Processing).
*   **Core Server**: [Node.js](https://nodejs.org/) with [Express.js](https://expressjs.com/).
    *   Handles API Routes, Authentication, Database connections, and file uploads.
*   **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/) ORM.
*   **Authentication**: JSON Web Tokens (JWT) & bcrypt for security.
*   **File Uploads**: `multer` for handling car images and voice audio.

### AI Implementation (The "Brain")
The project features a sophisticated AI layer:
1.  **Speech-to-Text (Ear)**:
    *   **Engine**: OpenAI Whisper (`small` model).
    *   **Implementation**: A dedicated Python Flask Microservice (`flask_transcribe.py`) running on port `5001`.
    *   **Why**: Python has native support for Whisper and PyTorch. Running it as a persistent server ensures instant transcription after the initial load.
    *   **Workflow**: Frontend records audio -> Sends to Node API -> Node forwards to Flask -> Flask runs Whisper -> Returns Text.

2.  **Reasoning Engine (Brain)**:
    *   **Model**: Google Gemini Pro/Flash (`@google/generative-ai`).
    *   **Function Calling**: The LLM has access to "Tools" (`search_cars`, `get_market_stats`). It can technically query the MongoDB database to answer user questions like "Show me Honda City under 30 lakhs".
    *   **Implementation**: `server/services/geminiService.js`.

3.  **Language Support**:
    *   **Urdu Support**: Optimizations for Urdu font (`Jameel Noori Nastaleeq`) and "Roman Urdu" understanding.

## 3. Key Concepts & Logic

### A. The Hybrid Transcription Pipeline
To solve the slowness of loading AI models, we implemented a **Persistent Sidecar Pattern**:
1.  **User** records voice in the Chatbot.
2.  **Frontend** sends `blob` to Node.js endpoint `/api/chat/voice`.
3.  **Node.js** converts the audio to standard WAV format using `ffmpeg`.
4.  **Node.js** sends the WAV file to the local Python Flask Server (`localhost:5001/transcribe`).
5.  **Python Server** (which keeps the Whisper model loaded in RAM) instantly transcribes it and returns text (e.g., "مجھے کرولا دکھاؤ").
6.  **Node.js** sends this text back to the Frontend.

### B. The AI Chatbot Loop
1.  **Input**: User sends text (e.g., "I need a family car").
2.  **Context**: The history of the chat is sent to Gemini.
3.  **Tool Use**: Gemini analyzes the request. If it sees a search intent, it generates a structure `search_cars({ bodyType: 'SUV' })`.
4.  **Execution**: The Node.js server executes this query against MongoDB.
5.  **Response**: The found cars are fed back to Gemini, which generates a natural language summary (e.g., "I found these 3 SUVs for you...").
6.  **Display**: The frontend renders the specific "Car Cards" alongside the text response.

## 4. Folder Structure (Key Files)
```
/
├── src/
│   ├── components/ChatBot/   # The AI Assistant UI & Logic
│   ├── pages/                # Main Routes (Home, Inventory, Post Ad)
│   └── index.css             # Global Styles (Urdu Fonts defined here)
├── server/
│   ├── index.js              # Main Node.js Entry Point
│   ├── services/
│   │   ├── flask_transcribe.py  # Python Whisper Server
│   │   ├── geminiService.js     # LLM Logic & Tool Definitions
│   │   └── whisperService.js    # Node->Python Bridge
│   ├── models/               # MongoDB Schemas (Car.js, User.js)
│   └── routes/               # API Endpoints
```

## 5. Development Workflow
To run the full stack, you need two or three terminals:
1.  **Frontend**: `npm run dev` (Vite Server)
2.  **Backend (Node)**: `npm run dev` (Nodemon Express Server)
3.  **Backend (AI)**: `python services/flask_transcribe.py` (Whisper Server)

This architecture ensures a scalable, fast, and feature-rich application that bridges the gap between traditional web apps and modern AI agents.
