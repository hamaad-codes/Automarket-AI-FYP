# AutoMarket - System Architecture, Use Cases & Developer Specifications

This document outlines the end-to-end system architecture, database models, security frameworks, machine learning models, and use cases of **AutoMarket**.

---

## 1. System Architecture & Workflows

### Workflow 1: AI Voice Ad Creator (Voice-to-Listing Form Autofill)

This diagram illustrates how a raw voice recording is transcribed, parsed into a structured schema via Gemini, and automatically populated in the React form.

```
Seller (User)          React Frontend (CreateListing.tsx)          Express Backend (cars.js)          Gemini transcription model          Gemini JSON Extractor
    |                                 |                                        |                                  |                                   |
    |--- Clicks "Fill Form with Voice"->|                                       |                                  |                                   |
    |--- Speaks car description ----->|                                       |                                  |                                   |
    |--- Clicks "Stop Recording" ---->|                                       |                                  |                                   |
    |                                 |--- POST /api/cars/extract-from-voice ->|                                  |                                   |
    |                                 |    (audio file payload)                |                                  |                                   |
    |                                 |                                        |--- Send WebM audio buffer ------->|                                   |
    |                                 |                                        |<-- Transcribed text (Urdu/English)-|                                   |
    |                                 |                                        |                                  |                                   |
    |                                 |                                        |--- Send prompt + transcription ------------------------------------->|
    |                                 |                                        |    (Force JSON schema output)                                     |
    |                                 |                                        |<-- Structured JSON object -----------------------------------------|
    |                                 |<-- HTTP 200 OK (extracted JSON payload)-|                                  |                                   |
    |                                 |                                        |                                  |                                   |
    |                                 |-- Populate React Form state dynamically |                                  |                                   |
```

#### Detailed Steps:
1. **Seller (User)** clicks "Fill Form with Voice" on the Create Listing form (`CreateListing.tsx`).
2. **Seller (User)** speaks car description into microphone (e.g., *"Suzuki Swift 2021 manual petrol white color 45000 km in Lahore for 32 Lacs..."*).
3. **Seller (User)** clicks "Stop Recording".
4. **React Frontend** sends `POST /api/cars/extract-from-voice` with WebM audio file to Express Backend (`cars.js`).
5. **Express Backend** receives file and forwards WebM audio buffer to OpenAI Whisper model.
6. **Whisper AI** transcribes audio and returns raw text string (bilingual Urdu/English mix).
7. **Express Backend** sends prompt + transcribed text to Gemini 2.5 Flash model forcing JSON schema output.
8. **Gemini JSON Extractor** parses entity attributes and returns structured JSON object.
9. **Express Backend** returns `HTTP 200 OK` with extracted JSON payload.
10. **React Frontend** state handlers populate all form fields dynamically.

---

### Workflow 2: AI Voice & Text Conversational Vehicle Advisor (ChatBot Agent)

1. **Buyer** opens ChatBot modal and sends voice message or types query (e.g., *"Mujhe Lahore me 30 Lakh tak automatic car dikhao"*).
2. Audio converted to WAV via `fluent-ffmpeg` and transcribed by Python Flask Whisper microservice (Port 5001).
3. Express backend forwards text to Gemini / AI.CC LLM reasoning engine with registered tools (`search_cars`, `get_market_stats`).
4. LLM parses search intent and emits function call: `search_cars({ city: 'Lahore', maxPrice: 3000000, transmission: 'automatic' })`.
5. Express backend executes indexed query on MongoDB `cars` collection.
6. LLM generates natural bilingual commentary, and Frontend renders interactive Car Cards in chat conversation.

---

### Workflow 3: Multi-Criteria Inventory Search & Filtering

1. **Buyer** adjusts filters on Inventory page (Make, Model, Price Range in Lacs, Fuel Type, Transmission, City).
2. React dispatches `GET /api/cars` with query string parameters.
3. Express applies MongoDB regex search and numeric range filters.
4. Server returns JSON array of vehicles; Frontend renders responsive grid of Car Cards.

---

## 2. Database Models & Schema Specifications

### Vehicle Collection (`cars`)

| Field Name | BSON Type | Validation Rules | Description |
|---|---|---|---|
| `title` | String | Required, Trimmed | Listing headline |
| `make` | String | Required, Lowercase | Brand (toyota, honda, suzuki) |
| `model` | String | Required, Trimmed | Vehicle model |
| `year` | Number | Required, 1970 - 2026 | Manufacturing year |
| `price` | Number | Required, Min: 0 | Price in PKR |
| `mileage` | Number | Required, Min: 0 | Kilometers driven |
| `fuelType` | String | Enum [petrol, diesel, hybrid, cng, electric] | Engine fuel type |
| `transmission` | String | Enum [automatic, manual] | Transmission |
| `bodyType` | String | Enum [sedan, hatchback, suv, van] | Body classification |
| `location` | String | Required | Registration/city location |
| `images` | Array[String] | Required | Uploaded photo URLs |
| `seller` | ObjectId | Ref: 'User', Required | Listing owner ID |

---

## 3. Developer Specifications & REST API Reference

| HTTP Method & Route | Auth Required | Description | Status Code |
|---|---|---|---|
| `POST /api/cars/extract-from-voice` | No | Transcribe audio & extract JSON car attributes via Gemini | `200 OK` |
| `GET /api/cars` | No | Fetch filtered vehicle listings from MongoDB | `200 OK` |
| `POST /api/cars` | Yes (JWT) | Create new vehicle listing with photos | `201 Created` |
| `PUT /api/cars/:id` | Yes (JWT) | Update existing listing details | `200 OK` |
| `DELETE /api/cars/:id` | Yes (JWT) | Remove listing from inventory | `200 OK` |
| `POST /api/chat/message` | No | AI Chatbot tool calling & recommendation endpoint | `200 OK` |
| `POST /api/auth/login` | No | User login & JWT token issue | `200 OK` |

---

*AutoMarket AI System Documentation*
