# 🚗 AI-Powered Vehicle Marketplace — Complete Project Deep Dive

> **Project Name:** AutoMarket — AI-Powered Vehicle Marketplace  
> **Type:** Full-Stack Web Application (Final Year Project)  
> **Domain:** Pakistani Automobile Market (PKR currency, Urdu/English bilingual)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Frontend — Deep Dive](#4-frontend--deep-dive)
5. [Backend (Server) — Deep Dive](#5-backend-server--deep-dive)
6. [AI/ML Pipeline](#6-aiml-pipeline)
7. [Database Layer](#7-database-layer)
8. [Authentication & Security](#8-authentication--security)
9. [Design System & Theming](#9-design-system--theming)
10. [Scripts & Utilities](#10-scripts--utilities)
11. [Configuration Files](#11-configuration-files)
12. [Data Flow Diagrams](#12-data-flow-diagrams)
13. [API Reference](#13-api-reference)
14. [Key Algorithms & Logic](#14-key-algorithms--logic)
15. [Environment Variables](#15-environment-variables)
16. [How to Run](#16-how-to-run)

---

## 1. Architecture Overview

The project follows a **three-tier architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                          │
│  React 18 + TypeScript + Vite (Port 8080)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │  Pages   │ │Components│ │  Hooks   │ │  ChatBot UI  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP (REST API + Multipart)
┌────────────────────────▼────────────────────────────────────┐
│                  EXPRESS SERVER (Port 5000)                   │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────────────────┐ │
│  │Auth API│ │Cars API│ │Chat API│ │  AI Services Layer   │ │
│  └────────┘ └────────┘ └────────┘ └──────────┬───────────┘ │
│                                               │              │
│  ┌────────────────────────────────────────────▼───────────┐ │
│  │ aiccService │ carQueryService │ compatibilityScorer    │ │
│  │ whisperService ──► Flask Python Server (Port 5001)     │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │ Mongoose ODM
┌────────────────────────▼────────────────────────────────────┐
│                  MongoDB (Port 27017)                         │
│  Database: "Automarket"                                      │
│  Collections: users, cars                                    │
└─────────────────────────────────────────────────────────────┘
```

**External AI Services:**
- **AI.CC (OpenAI-compatible)** — Primary LLM (`gpt-4o-mini`) with function-calling
- **Google Gemini 1.5 Flash** — Fallback LLM
- **Whisper (OpenAI)** — Local speech-to-text via Python Flask server

---

## 2. Technology Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI library (functional components + hooks) |
| **TypeScript** | Static typing |
| **Vite** | Build tool & dev server (SWC plugin for fast refresh) |
| **React Router DOM** | Client-side routing (9 routes) |
| **TailwindCSS** | Utility-first CSS framework |
| **shadcn/ui** | Pre-built Radix UI component library (49 components) |
| **Radix UI** | Headless UI primitives (Accordion, Dialog, Avatar, etc.) |
| **Lucide React** | Icon library |
| **Axios** | HTTP client (ChatBot requests) |
| **ReactMarkdown + remark-gfm** | Markdown rendering in chat messages |
| **Google Fonts** | Outfit (headings) + DM Sans (body) |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express** | REST API server |
| **Mongoose** | MongoDB ODM |
| **bcryptjs** | Password hashing (salt rounds: 10) |
| **jsonwebtoken (JWT)** | Token-based authentication (5-day expiry) |
| **multer** | File upload handling (voice audio) |
| **cors** | Cross-Origin Resource Sharing |
| **dotenv** | Environment variable management |
| **OpenAI SDK** | AI.CC API integration (OpenAI-compatible) |
| **@google/generative-ai** | Google Gemini fallback |
| **fluent-ffmpeg** | Audio format conversion |
| **axios + form-data** | Whisper Flask server communication |

### AI/ML (Python)
| Technology | Purpose |
|---|---|
| **Flask** | Python microservice for speech-to-text |
| **OpenAI Whisper** | Speech recognition model ("small" variant) |
| **PyTorch** | ML framework (CUDA/CPU) |

---

## 3. Project Structure

```
ai-powered-vehical-market-place/
├── index.html                    # Entry HTML (SEO meta, Google Fonts)
├── package.json                  # Frontend dependencies & scripts
├── vite.config.ts                # Vite configuration
├── tailwind.config.ts            # TailwindCSS design tokens
├── tsconfig.json                 # TypeScript base config
├── tsconfig.app.json             # App-specific TS config
├── tsconfig.node.json            # Node-specific TS config
├── postcss.config.js             # PostCSS (TailwindCSS + autoprefixer)
├── components.json               # shadcn/ui configuration
├── eslint.config.js              # ESLint rules
│
├── public/
│   ├── favicon.ico
│   ├── robots.txt
│   └── fonts/
│       └── JameelNoori.ttf       # Urdu Nastaleeq font
│
├── src/
│   ├── main.tsx                  # React entry point (createRoot)
│   ├── App.tsx                   # Router & global providers
│   ├── index.css                 # Global styles + CSS variables
│   ├── vite-env.d.ts             # Vite type declarations
│   │
│   ├── pages/                    # Route-level components (9 pages)
│   │   ├── Index.tsx             # Homepage (hero + featured vehicles)
│   │   ├── BuyNow.tsx            # Browse listings with filters
│   │   ├── Auctions.tsx          # Auction listings with tabs
│   │   ├── CreateListing.tsx     # Multi-step listing form
│   │   ├── Inventory.tsx         # User's listings & liked cars
│   │   ├── Login.tsx             # Login form
│   │   ├── Register.tsx          # Registration form
│   │   ├── VehicleDetails.tsx    # Single vehicle detail view
│   │   └── NotFound.tsx          # 404 page
│   │
│   ├── components/
│   │   ├── Header.tsx            # Navigation bar + auth state
│   │   ├── SearchBar.tsx         # Global search component
│   │   ├── VehicleCard.tsx       # Vehicle listing card
│   │   ├── CategoryCard.tsx      # Category display card
│   │   ├── FilterSidebar.tsx     # Advanced filter panel
│   │   ├── NavLink.tsx           # Navigation link component
│   │   ├── ChatBot/
│   │   │   ├── ChatBot.tsx       # AI chatbot widget (385 lines)
│   │   │   └── index.ts          # ChatBot barrel export
│   │   └── ui/                   # shadcn/ui library (49 components)
│   │       ├── button.tsx, card.tsx, input.tsx, badge.tsx, ...
│   │       ├── dialog.tsx, dropdown-menu.tsx, scroll-area.tsx, ...
│   │       └── toast.tsx, toaster.tsx, sonner.tsx, ...
│   │
│   ├── hooks/
│   │   ├── use-toast.ts          # Toast notification system (reducer pattern)
│   │   └── use-mobile.tsx        # Mobile breakpoint detection hook
│   │
│   ├── lib/
│   │   └── utils.ts              # cn() utility (clsx + tailwind-merge)
│   │
│   └── assets/                   # Static images (logo, icons, etc.)
│
├── server/
│   ├── index.js                  # Express server entry point
│   ├── package.json              # Server dependencies
│   ├── .env                      # Environment variables
│   ├── ggml-small.bin            # Whisper model weights (~487 MB)
│   │
│   ├── models/
│   │   ├── User.js               # User Mongoose schema
│   │   └── Car.js                # Car Mongoose schema
│   │
│   ├── routes/
│   │   ├── auth.js               # Authentication endpoints
│   │   ├── cars.js               # Car CRUD + search endpoints
│   │   └── chat.js               # Chat & voice endpoints
│   │
│   ├── services/
│   │   ├── aiccService.js        # AI chat service (OpenAI + Gemini)
│   │   ├── carQueryService.js    # AI-optimized car database queries
│   │   ├── compatibilityScorer.js# Weighted car-user matching algorithm
│   │   ├── whisperService.js     # Audio processing + Flask relay
│   │   └── flask_transcribe.py   # Python Whisper microservice
│   │
│   ├── middleware/
│   │   └── auth.js               # JWT verification middleware
│   │
│   ├── uploads/                  # Temporary audio file storage
│   └── temp_stt_repo/            # Whisper model cache
│
└── scripts/
    ├── download_whisper.js       # Whisper model download script
    ├── download_dataset.py       # Dataset download utility
    └── inspect_data.cjs          # Data inspection tool
```

---

## 4. Frontend — Deep Dive

### 4.1 Entry Point — `main.tsx`

```tsx
createRoot(document.getElementById("root")!).render(<App />);
```

Mounts the React app to the `#root` div in `index.html`. No `StrictMode` wrapper is used.

### 4.2 App Router — `App.tsx`

Defines 9 routes using `react-router-dom`:

| Path | Component | Description |
|---|---|---|
| `/` | `Index` | Homepage with hero, categories, featured vehicles |
| `/buy-now` | `BuyNow` | Browse all buy-now listings with filters |
| `/auctions` | `Auctions` | Browse auction listings with tab navigation |
| `/create-listing` | `CreateListing` | Multi-step form to create a listing |
| `/vehicles/:id` | `VehicleDetails` | Individual vehicle detail page |
| `/inventory` | `Inventory` | User's own listings and liked cars |
| `/login` | `Login` | Login page |
| `/register` | `Register` | Registration page |
| `*` | `NotFound` | 404 catch-all |

**Global Features:**
- `<ChatBot />` is rendered globally on every page (except Login/Register where it hides itself)
- `<Toaster />` and `<Sonner />` for notifications
- `<TooltipProvider>` wraps everything for shadcn/ui tooltips

### 4.3 Pages

#### `Index.tsx` — Homepage
- **Parallax hero section** with `scrollY` state tracking via `useEffect`
- **Category cards** (SUV, Sedan, Truck) linking to BuyNow with pre-set filters
- **Featured vehicles grid** — fetches 8 random cars from `/api/cars?random=true&limit=8`
- **Gradient overlays**, animated text, and CTA buttons
- Uses `useState` and `useEffect` for scroll position and data fetching

#### `BuyNow.tsx` — Buy Now Listings
- **FilterSidebar integration** with `FilterState` interface
- **Search bar** with keyword filtering
- **Sort options**: Newest, Price Low-High, Price High-Low, Year
- **View toggle**: Grid (3 columns) vs List view
- **Pagination** with page buttons and prev/next navigation
- **Debounced API calls** with `useCallback` for filter changes
- Builds complex query strings from `FilterState` (price range, year range, makes, body types, fuel types, transmissions, colors, registration cities, locations, engine CC range)

#### `Auctions.tsx` — Auction Listings
- **Tab system**: Live, Upcoming, Ending Soon
- Same filter and search capabilities as BuyNow
- Fetches cars with `type=auction` parameter
- Displays auction-specific info (current bid, time left)

#### `CreateListing.tsx` — Create Listing (25KB — largest page)
- **4-step wizard form**:
  1. **Basic Info**: Title, make, model, year, body type, VIN
  2. **Details**: Transmission, fuel type, engine displacement, mileage, colors (exterior/interior)
  3. **Pricing**: Buy-now vs Auction toggle, price, description, features (comma-separated)
  4. **Media & Location**: Image URL, location, registration city
- **Buy-now / Auction selector** changes the form flow
- Submits via POST to `/api/cars` with all fields
- Stores `user` ID from `localStorage` to associate listing with the logged-in user

#### `Login.tsx` / `Register.tsx` — Authentication
- **Login**: Email + password → POST `/api/auth/login`
  - Stores JWT token and user object in `localStorage`
  - Redirects to homepage on success
  - Toggle password visibility
- **Register**: Name + email + password + confirm password
  - Client-side validation (password match, minimum length)
  - POST `/api/auth/register` → auto-login on success
- Both pages feature animated backgrounds with gradient circles

#### `VehicleDetails.tsx` — Vehicle Detail Page
- Fetches single car by ID from `/api/cars/:id`
- **Image gallery** with fullscreen preview support
- **Specifications grid**: Year, mileage, fuel type, transmission, engine, color, body type
- **Description section** with expandable text
- **Features list** as badges
- **Price display** in PKR with Lac conversion
- **Seller contact info** and inquiry button
- Loading skeleton states

#### `Inventory.tsx` — User's Inventory
- **Two tabs**: My Listings / Liked Cars
- **My Listings**: Fetches cars by `user` query param, supports edit and delete operations
- **Liked Cars**: Fetches from `/api/auth/favorites`
- Each car can be edited inline or deleted via DELETE `/api/cars/:id`
- Auth-gated — redirects to login if no token

### 4.4 Components

#### `Header.tsx` — Navigation Bar
- **Sticky header** with `backdrop-blur-xl` glassmorphism effect
- **Desktop nav** with active link indication (gradient underline animation)
- **Mobile hamburger menu** with slide-down animation
- **User state** from `localStorage`: shows dropdown with Sign Out or Sign In button
- **Dark/Light theme toggle** using `class` strategy on `<html>` element
- **Search toggle** with slide-down `SearchBar` component
- **Dynamic nav links**: Inventory link only appears when logged in

#### `VehicleCard.tsx` — Vehicle Listing Card
- **Image with hover zoom** (scale-110 on group-hover)
- **Gradient overlay** on image
- **Badges**: Year, Verified, Time Left (auction)
- **Favorite heart button**: Calls `/api/auth/favorites/:id` toggle endpoint
- Checks favorite status on mount by fetching user's favorites
- **Specs grid**: Mileage (Gauge icon), Fuel Type (Fuel icon)
- **Price display** in PKR format
- Links to `/vehicles/:id` detail page
- **Staggered animations** with configurable `delay` prop
- **Fallback image** from Unsplash on error

#### `FilterSidebar.tsx` — Advanced Filter Panel
- **FilterState interface** with 10 filter categories:
  - `priceRange`: [0, 50,000,000] PKR with Slider
  - `yearRange`: [1980, 2025] with Slider
  - `makes`: 15 Pakistani market brands (Suzuki, Toyota, Honda, Kia, Hyundai, etc.)
  - `bodyTypes`: 8 types (Sedan, SUV, Hatchback, etc.)
  - `fuelTypes`: Petrol, Diesel, Hybrid, Electric, CNG
  - `transmissions`: Automatic, Manual
  - `colors`: 9 colors with visual color swatches (circle indicators)
  - `registrationCities`: 11 major Pakistani cities
  - `locations`: 11 Pakistani cities
  - `engineCCRange`: [600, 6000] CC with Slider
- **Apply/Reset buttons** — Reset returns all filters to defaults
- Responsive: hidden on mobile, shown via toggle button

#### `ChatBot/ChatBot.tsx` — AI Chatbot Widget (385 lines)
- **Float button** (bottom-right, 70×70px) with pulsing glow animation
- **Expandable chat window**: 340px wide × 500px tall (default) or fullscreen
- **Features:**
  - Text chat (Enter to send)
  - Voice recording via `MediaRecorder` API (WebM format)
  - Language toggle (English ↔ Urdu) with RTL support
  - Text-to-Speech via `SpeechSynthesis` API (Urdu `ur-PK` voice)
  - Markdown rendering of assistant responses
  - **Car recommendation cards** inline in chat with:
    - Compatibility score badge (e.g., "92% Match")
    - Specs grid (mileage, fuel, transmission, location)
    - "View Details" button → navigates to `/vehicles/:id`
  - Loading animation (bouncing dots)
  - Auto-scroll to bottom on new messages
- **Hides on** `/login` and `/register` paths
- Communicates with `/api/chat/message` (text) and `/api/chat/voice` (audio)

### 4.5 Custom Hooks

#### `use-toast.ts` — Toast Notification System
- Implements a **reducer pattern** (ADD, UPDATE, DISMISS, REMOVE)
- Global state via `memoryState` (singleton outside React tree)
- Listener pattern: any component using `useToast()` subscribes to updates
- `TOAST_LIMIT = 1` (only 1 toast visible at a time)
- Used across login/register for success/error feedback

#### `use-mobile.tsx` — Mobile Detection
- Uses `window.matchMedia` with breakpoint at **768px**
- Returns boolean `isMobile` flag
- Cleans up listener on unmount

### 4.6 Utility Library

#### `lib/utils.ts` — `cn()` Function
```ts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```
Combines `clsx` (conditional class names) with `tailwind-merge` (resolves TailwindCSS conflicts). Used extensively in every shadcn/ui component for composable styling.

---

## 5. Backend (Server) — Deep Dive

### 5.1 Server Entry — `index.js`

```javascript
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
```

- **Express** app on port 5000
- **MongoDB** connection via `mongoose.connect(process.env.MONGO_URI)`
- **CORS** enabled globally (allows frontend on port 8080)
- **3 route groups** mounted:
  - `/api/auth` → Authentication
  - `/api/cars` → Car CRUD
  - `/api/chat` → AI Chat & Voice

### 5.2 Routes

#### `routes/auth.js` — Authentication (4 endpoints)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ | Register new user |
| `POST` | `/api/auth/login` | ❌ | Login existing user |
| `GET` | `/api/auth/favorites` | ✅ JWT | Get user's saved cars |
| `POST` | `/api/auth/favorites/:id` | ✅ JWT | Toggle car in favorites |

**Register Flow:**
1. Check if email already exists
2. Create User object
3. Generate bcrypt salt (10 rounds) → hash password
4. Save to MongoDB
5. Create JWT payload with `user.id`
6. Sign JWT with `JWT_SECRET` (5-day expiry)
7. Return `{ token, user: { id, name, email, role } }`

**Login Flow:**
1. Find user by email
2. Compare password with `bcrypt.compare()`
3. Generate JWT (same as register)
4. Return token + user object

**Favorites Toggle:**
- If car ID exists in `savedCars[]`, remove it
- If not, push it
- Returns updated `savedCars` array

#### `routes/cars.js` — Car CRUD (5 endpoints)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/cars` | ❌ | Get all cars with filtering & pagination |
| `GET` | `/api/cars/:id` | ❌ | Get single car by ID |
| `POST` | `/api/cars` | ❌ | Create new car listing |
| `PUT` | `/api/cars/:id` | ❌ | Update car listing |
| `DELETE` | `/api/cars/:id` | ❌ | Delete car listing |

**GET `/api/cars` — Advanced Query Engine:**
Supports 12+ filter parameters combined with `$and`:

| Parameter | Query Type |
|---|---|
| `search` | `$or` across title, description, make, model (case-insensitive regex) |
| `make` | Comma-separated → `$in` with RegExp |
| `bodyType` | Comma-separated → `$in` with RegExp |
| `fuelType` | Comma-separated → `$in` with RegExp |
| `transmission`| Comma-separated → `$in` with RegExp |
| `color` | Matches both `color` and `exteriorColor` fields |
| `registrationCity` | Comma-separated → `$in` with RegExp |
| `location` | Comma-separated → `$in` with RegExp |
| `minPrice/maxPrice` | `$gte` / `$lte` on `price` |
| `minYear/maxYear` | `$gte` / `$lte` on `year` |
| `minEngineCC/maxEngineCC` | `$expr` with `$regexFind` to extract numeric CC from string |
| `user` | Exact match for user ObjectId |
| `type` | `buy-now` or `auction` |
| `random=true` | Uses `$sample` aggregation for random results |

**Pagination**: `page` (default 1) and `limit` (default 12), returns `{ cars, currentPage, totalPages, totalCars }`

#### `routes/chat.js` — AI Chat (2 endpoints)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/chat/message` | ❌ | Send text message to AI |
| `POST` | `/api/chat/voice` | ❌ | Upload voice audio for transcription |

**Text Chat Flow:**
1. Receives `{ messages[], preferredLanguage }` body
2. Calls `analyzeWithAICC()` service
3. Returns `{ message, recommendations[] }`

**Voice Chat Flow:**
1. Multer saves uploaded WebM audio to `uploads/` with unique filename
2. Calls `transcribeAudio()` which converts to WAV via FFmpeg then sends to Flask
3. Returns transcribed text `{ text }`
4. Cleans up temporary audio file

### 5.3 Middleware

#### `middleware/auth.js` — JWT Authentication
```javascript
const token = req.header('x-auth-token');
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = decoded.user; // { id: "..." }
```
- Reads token from `x-auth-token` header
- Verifies with `JWT_SECRET`
- Attaches `req.user` with user ID
- Returns 401 if missing or invalid

---

## 6. AI/ML Pipeline

### 6.1 AI Chatbot Service — `aiccService.js`

This is the **brain of the chatbot**. It uses a sophisticated multi-step pipeline:

#### Step 1: System Prompt Construction
The AI is configured as **"AutoMarket Expert"** — a Pakistani automobile consultant. Key rules:
- Always use database tools when user asks for car options
- Respond in user's preferred language (English or Urdu)
- Use markdown formatting
- Highlight "Best Deal" or "Top Pick"

#### Step 2: Function Calling (Tool Use)
Two tools are defined for the LLM:

```json
{
  "name": "search_cars",
  "parameters": {
    "make": "string", "model": "string",
    "minPrice": "number", "maxPrice": "number",
    "minYear": "number", "maxYear": "number",
    "transmission": "enum[Automatic,Manual]",
    "fuelType": "enum[Petrol,Diesel,Hybrid,CNG]",
    "location": "string"
  }
}
```

```json
{
  "name": "get_car_details",
  "parameters": { "id": "string (required)" }
}
```

#### Step 3: Two-Pass LLM Flow
1. **First call** → LLM decides if it needs tools → may return `tool_calls`
2. If tools called → execute `searchCarsForAI()` or `getCarDetailsById()` → collect results
3. **Second call** → Feed tool results back → LLM synthesizes natural language response
4. If no tools needed → direct response with language enforcement

#### Step 4: Response Formatting
Returns up to 6 car recommendations with compatibility scores (random 85-98%).

#### Fallback — Google Gemini
If AI.CC fails, uses `gemini-1.5-flash` with:
- Simple keyword extraction for car search
- Appends "(Note: I'm currently running on a backup system.)"
- Returns maximum 3 recommendations

### 6.2 Car Query Service — `carQueryService.js`

Three functions optimized for AI usage:

1. **`searchCarsForAI(filters)`** — Builds MongoDB query with RegExp filters, returns max 8 cars with lean projection (only essential fields: title, price, image, year, mileage, etc.)
2. **`getCarStatsForAI()`** — Returns total active cars, popular makes (top 10), available body types
3. **`getCarDetailsById(id)`** — Full car document by ObjectId

### 6.3 Compatibility Scorer — `compatibilityScorer.js`

Weighted scoring algorithm (0-100 scale):

| Factor | Weight | Logic |
|---|---|---|
| **Budget** | 30% | ≤90% of max: full points, ≤110%: 70% points, >110%: 0 |
| **Usage** | 20% | City → Hatchback/Sedan; Highway → SUV/Sedan |
| **Family Size** | 20% | >4 people → SUV/Van; ≤4 → full points |
| **Fuel Type** | 15% | Exact match = full, no preference = 50% (neutral) |
| **Location** | 10% | Car location includes user's city |
| **Transmission** | 5% | Exact match |

Returns `{ score, pros[], cons[] }` — e.g., `{ score: 85, pros: ["Fits your budget perfectly", "Excellent for city driving"], cons: [] }`

### 6.4 Speech-to-Text Pipeline

```
Browser (MediaRecorder API)
    │ WebM audio blob
    ▼
POST /api/chat/voice (Multer saves as .webm)
    │
    ▼
whisperService.js
    │ FFmpeg: webm → 16kHz mono PCM WAV
    ▼
Flask Server (port 5001)
    │ Whisper "small" model
    │ Language: Urdu ("ur")
    │ beam_size=1 (greedy, fastest)
    │ CUDA if available, else CPU
    ▼
Transcribed text returned to browser
```

**`flask_transcribe.py`** details:
- Loads Whisper "small" model once at startup (~487MB)
- Uses `torch.cuda.is_available()` for GPU detection
- Optimized for speed: `beam_size=1`, `best_of=1`, `condition_on_previous_text=False`
- Saves temp audio to `temp_audio_flask.wav`, transcribes, deletes
- Runs on port 5001 to avoid port 5000 conflict with Express

---

## 7. Database Layer

### 7.1 User Schema (`models/User.js`)

```javascript
{
    name:      { type: String, required: true },
    email:     { type: String, required: true, unique: true },
    password:  { type: String, required: true },        // bcrypt hashed
    role:      { type: String, enum: ['user','admin'], default: 'user' },
    createdAt: { type: Date, default: Date.now },
    savedCars: [{ type: ObjectId, ref: 'Car' }]         // Favorites array
}
```

### 7.2 Car Schema (`models/Car.js`)

```javascript
{
    // Core Identity
    title:              { type: String, required: true },
    url:                String,
    description:        String,
    image:              String,

    // Vehicle Specifications
    make:               String,          // e.g., "Toyota"
    model:              String,          // e.g., "Corolla"
    year:               Number,          // e.g., 2024
    bodyType:           String,          // e.g., "Sedan"
    transmission:       String,          // "Automatic" / "Manual"
    fuelType:           String,          // "Petrol", "Diesel", "Hybrid", etc.
    engineDisplacement: String,          // e.g., "1800 cc"
    mileage:            String,          // e.g., "45,000 km"

    // Colors
    color:              String,
    exteriorColor:      String,
    interiorColor:      String,

    // Location
    location:           String,          // City
    registrationCity:   String,          // Registration city

    // Pricing
    price:              { type: Number, required: true },
    currency:           { type: String, default: 'PKR' },

    // Listing Meta
    status:             { type: String, default: 'active' },
    type:               { type: String, default: 'buy-now' },  // or 'auction'
    views:              { type: Number, default: 0 },
    inquiries:          { type: Number, default: 0 },
    vin:                String,
    features:           [String],        // e.g., ["ABS", "Airbags", "Sunroof"]

    // Ownership
    user:               { type: ObjectId, ref: 'User' },
    createdAt:          { type: Date, default: Date.now }
}
```

---

## 8. Authentication & Security

### Authentication Flow

```
┌──────────┐     POST /auth/register     ┌────────────┐
│  Client  │ ─────────────────────────►  │   Server   │
│          │  { name, email, password }  │            │
│          │                              │ bcrypt.hash│
│          │                              │ User.save()│
│          │                              │ jwt.sign() │
│          │  ◄───────────────────────── │            │
│          │    { token, user }          │            │
│          │                              │            │
│ localStorage.setItem('token', token)   │            │
│ localStorage.setItem('user', user)     │            │
│          │                              │            │
│          │  GET /auth/favorites         │            │
│          │  Header: x-auth-token       │            │
│          │ ─────────────────────────►  │            │
│          │                              │ jwt.verify │
│          │                              │ req.user = │
│          │  ◄───────────────────────── │ decoded    │
│          │    { savedCars[] }          │            │
└──────────┘                              └────────────┘
```

**Key Security Details:**
- **Password hashing**: bcryptjs with 10 salt rounds
- **JWT**: 5-day expiry, signed with `JWT_SECRET`
- **Token storage**: `localStorage` (client-side)
- **Token header**: `x-auth-token` (custom header)
- **CORS**: Fully open (no origin restrictions)

---

## 9. Design System & Theming

### 9.1 Theme System — CSS Variables

The project uses **HSL-based CSS custom properties** for light/dark theming:

```css
:root {
    --background: 220 20% 97%;       /* Off-white with blue tint */
    --foreground: 222 47% 11%;
    --primary: 221 83% 53%;           /* Vibrant blue */
    --accent: 262 83% 58%;            /* Purple accent */
    --card: 0 0% 100%;
    --border: 220 13% 91%;
    --muted-foreground: 215 16% 47%;
    /* ... 20+ more variables */
}

.dark {
    --background: 224 20% 6%;         /* Near-black */
    --foreground: 210 40% 98%;
    --primary: 224 76% 48%;
    --card: 224 15% 9%;
    /* ... dark variants */
}
```

### 9.2 TailwindCSS Custom Extensions

**Custom Colors:**
- `accent-racing`: Red (#ef4444) — used for favorites, destructive actions
- `accent-electric`: Purple (#a855f7) — used for premium badges
- `accent-neon`: Blue (#3b82f6)
- `midnight`: Deep blue (#0f172a) — dark mode background

**Custom Shadows:**
```css
shadow-premium:    0 20px 60px -15px rgba(0,0,0,0.25)
shadow-neon:       0 0 30px rgba(59,130,246,0.3)
shadow-glass:      0 8px 32px rgba(0,0,0,0.1)
```

**Custom Animations:**
- `pan` — Background position pan (60s infinite)
- `shimmer` — Gradient shimmer effect (2s infinite)
- `float` — Up/down floating animation (6s infinite)
- `pulse-glow` — Scale + opacity pulse (2s infinite)
- `fade-in` — Opacity + translateY entrance

**Typography:**
- Headings: **Outfit** (Google Fonts) — `font-heading`
- Body: **DM Sans** (Google Fonts) — `font-sans`
- Urdu: **Jameel Noori Nastaleeq** (custom TTF) — `font-family: 'Jameel Noori Nastaleeq'`

### 9.3 Glassmorphism Utilities
```css
.glass-card {
    background: hsl(var(--card) / 0.6);
    backdrop-filter: blur(20px) saturate(1.5);
    border: 1px solid hsl(var(--border) / 0.3);
    box-shadow: /* multi-layer glass shadow */;
}
```

---

## 10. Scripts & Utilities

### `scripts/download_whisper.js`
Downloads the Whisper small model using `nodejs-whisper` library to the server directory.

### `scripts/download_dataset.py`
Python script for downloading car dataset (likely from Kaggle or similar).

### `scripts/inspect_data.cjs`
CommonJS Node.js script for inspecting downloaded dataset files (CSV parsing).

---

## 11. Configuration Files

### `vite.config.ts`
- Dev server on port **8080** with `host: "::"` (all IPv6/v4 interfaces)
- **SWC** plugin for React Fast Refresh (faster than Babel)
- Path alias: `@` → `./src/` for clean imports

### `tailwind.config.ts`
- **Dark mode**: `class` strategy (toggleable via JS)
- **Content paths**: `pages/`, `components/`, `app/`, `src/`
- Extended with custom fonts, colors, shadows, and animations
- Full design token system with HSL CSS variables

### `postcss.config.js`
- TailwindCSS plugin
- Autoprefixer plugin

### `tsconfig.json`
- Project references to `tsconfig.app.json` and `tsconfig.node.json`
- Path mapping: `@/*` → `./src/*`

### `components.json`
- shadcn/ui configuration
- Style: "new-york" variant
- CSS variables enabled
- Alias: `@/components`, `@/lib`, `@/hooks`

---

## 12. Data Flow Diagrams

### User Browsing Cars
```
User Opens /buy-now
    │
    ├─► FilterSidebar renders with defaults
    │
    ├─► useEffect fetches GET /api/cars?page=1&limit=12
    │       │
    │       └─► MongoDB: Car.find({}).skip(0).limit(12)
    │               │
    │               └─► Returns { cars[], totalPages, totalCars }
    │
    ├─► User applies filters (make=Toyota, minPrice=1000000)
    │       │
    │       └─► GET /api/cars?make=Toyota&minPrice=1000000&page=1&limit=12
    │               │
    │               └─► MongoDB: Car.find({ $and: [
    │                       { make: /Toyota/i },
    │                       { price: { $gte: 1000000 } }
    │                   ]})
    │
    └─► VehicleCard components rendered in grid/list
```

### AI Chat Conversation
```
User types "Show me Toyota under 20 lac"
    │
    ├─► POST /api/chat/message
    │   Body: { messages: [...history, newMsg], preferredLanguage: "en" }
    │
    ├─► aiccService.analyzeWithAICC()
    │       │
    │       ├─► 1st LLM call (gpt-4o-mini) with tools
    │       │       └─► LLM returns tool_call: search_cars({make:"Toyota", maxPrice:2000000})
    │       │
    │       ├─► Execute: carQueryService.searchCarsForAI({make:"Toyota", maxPrice:2000000})
    │       │       └─► MongoDB: Car.find({make:/Toyota/i, price:{$lte:2000000}}).limit(8).lean()
    │       │
    │       ├─► 2nd LLM call with tool results
    │       │       └─► LLM generates natural language summary
    │       │
    │       └─► Returns { chat_response, recommendations[6] }
    │
    └─► ChatBot renders message + car cards with compatibility scores
```

### Voice Input Flow
```
User clicks Mic button → MediaRecorder.start()
    │
User clicks again → MediaRecorder.stop()
    │
    ├─► Blob (audio/webm) created
    ├─► FormData with 'audio' field
    │
    ├─► POST /api/chat/voice (multipart/form-data)
    │       │
    │       ├─► Multer saves as uploads/voice-{timestamp}.webm
    │       │
    │       ├─► whisperService.transcribeAudio()
    │       │       │
    │       │       ├─► FFmpeg: webm → 16kHz mono PCM WAV
    │       │       │
    │       │       └─► POST http://localhost:5001/transcribe (Flask)
    │       │               │
    │       │               ├─► Whisper model.transcribe(wav, language="ur")
    │       │               │
    │       │               └─► Returns { text: "ٹویوٹا کی گاڑی دکھائیں" }
    │       │
    │       └─► Cleanup temp files
    │
    └─► Input field populated with transcribed text
        (User reviews and sends)
```

---

## 13. API Reference

### Authentication API (`/api/auth`)

```
POST /api/auth/register
  Body: { name, email, password }
  Response: { token, user: { id, name, email, role } }

POST /api/auth/login
  Body: { email, password }
  Response: { token, user: { id, name, email, role } }

GET /api/auth/favorites
  Headers: x-auth-token: <JWT>
  Response: [ Car objects (populated) ]

POST /api/auth/favorites/:carId
  Headers: x-auth-token: <JWT>
  Response: [ ObjectId strings (updated savedCars array) ]
```

### Cars API (`/api/cars`)

```
GET /api/cars
  Query: page, limit, search, make, bodyType, fuelType, transmission,
         color, registrationCity, location, minPrice, maxPrice,
         minYear, maxYear, minEngineCC, maxEngineCC, user, type, random, status
  Response: { cars[], currentPage, totalPages, totalCars }

GET /api/cars/:id
  Response: Car object

POST /api/cars
  Body: Full car object (see schema)
  Response: Created car object (201)

PUT /api/cars/:id
  Body: Partial car object
  Response: Updated car object

DELETE /api/cars/:id
  Response: { message: "Car deleted successfully" }
```

### Chat API (`/api/chat`)

```
POST /api/chat/message
  Body: { messages: [{role, content}], preferredLanguage: "en"|"ur" }
  Response: { message: "AI response text", recommendations: [CarRecommendation] }

POST /api/chat/voice
  Body: FormData with 'audio' file (webm)
  Response: { text: "Transcribed text" }
```

---

## 14. Key Algorithms & Logic

### 14.1 Engine CC Extraction (MongoDB Aggregation)
The `engineDisplacement` field stores strings like "1800 cc" or "2000cc". To filter by CC range, the server uses a MongoDB `$expr` with `$regexFind`:

```javascript
const extractCC = {
    $toInt: {
        $getField: {
            field: "match",
            input: { $regexFind: { input: "$engineDisplacement", regex: "\\d+" } }
        }
    }
};
// Then: { $expr: { $and: [{ $gte: [extractCC, 1000] }, { $lte: [extractCC, 2000] }] } }
```

### 14.2 Random Car Sampling
When `random=true` and no search/make/model filters:
```javascript
const randomCars = await Car.aggregate([
    { $match: query },
    { $sample: { size: limit } }
]);
```
Uses MongoDB's `$sample` aggregation stage for true random selection.

### 14.3 Multi-Pass LLM Architecture
1. **First pass**: LLM with tool definitions → decides if database query needed
2. **Tool execution**: Parallel database queries with optimized projections
3. **Second pass**: LLM synthesizes human-readable response from raw data
4. **Fallback cascade**: AI.CC → Gemini → Static error message

### 14.4 Audio Processing Pipeline
```
WebM (Chrome) → FFmpeg (-ar 16000 -ac 1 -c:a pcm_s16le) → WAV → Whisper
```
Standardizes all audio to 16kHz, mono, PCM 16-bit little-endian format — the optimal input format for Whisper.

---

## 15. Environment Variables

| Variable | Value | Purpose |
|---|---|---|
| `PORT` | `5000` | Express server port |
| `MONGO_URI` | `mongodb://localhost:27017/Automarket` | MongoDB connection string |
| `GEMINI_API_KEY` | `AIza...` | Google Gemini API key (fallback) |
| `AICC_API_KEY` | `sk-...` | AI.CC OpenAI-compatible API key |
| `AICC_BASE_URL` | `https://api.ai.cc/v1` | AI.CC endpoint |
| `JWT_SECRET` | `automarket_secret_key_2026` | JWT signing secret |

---

## 16. How to Run

### Prerequisites
- Node.js 18+
- MongoDB running on localhost:27017
- Python 3.8+ with pip (for Whisper)
- FFmpeg installed and in PATH

### Step 1: Frontend
```bash
cd ai-powered-vehical-market-place
npm install
npm run dev
# Runs on http://localhost:8080
```

### Step 2: Backend
```bash
cd server
npm install
npm run dev    # or: node index.js
# Runs on http://localhost:5000
```

### Step 3: Whisper Voice Service (Optional)
```bash
cd server
pip install flask openai-whisper torch
python services/flask_transcribe.py
# Runs on http://localhost:5001
```

### Step 4: MongoDB
Ensure MongoDB is running:
```bash
mongod --dbpath /path/to/data
# Database: Automarket
```

---

> **Total Project Stats:**
> - **~50 source files** (excluding node_modules and whisper model)
> - **Frontend**: ~2,400 lines of custom TypeScript/TSX
> - **Backend**: ~750 lines of JavaScript
> - **AI/ML**: ~150 lines (Python + JS services)
> - **Styling**: ~270 lines CSS + extensive TailwindCSS config
> - **UI Components**: 49 shadcn/ui primitives + 6 custom components
