import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { searchCarsForAI } from './carQueryService.js';
import { calculateCompatibility } from './compatibilityScorer.js';

dotenv.config();

/**
 * Fallback: Local Keyword Search (No AI required)
 */
const localKeywordFallback = async (messages, preferredLanguage) => {
    try {
        console.log("🛠️ AI failed. Using Local Keyword Fallback...");
        const lastMsg = messages[messages.length - 1].content.toLowerCase();
        
        const commonMakes = ['toyota', 'honda', 'suzuki', 'kia', 'hyundai', 'nissan', 'mitsubishi'];
        const foundMake = commonMakes.find(make => lastMsg.includes(make));

        let results = [];
        if (foundMake) {
            results = await searchCarsForAI({ make: foundMake, limit: 4 });
        } else {
            results = await searchCarsForAI({ limit: 4 });
        }

        const hasResults = results.length > 0;
        let responseText = "";

        if (preferredLanguage === 'ur') {
            responseText = hasResults 
                ? `میں نے آپ کے لیے کچھ بہترین گاڑیاں تلاش کی ہیں:`
                : `معذرت، میں فی الحال اس بارے میں معلومات نہیں ڈھونڈ سکا۔`;
        } else {
            responseText = hasResults
                ? `I found some great car matches for you:`
                : `I couldn't find exactly what you asked for.`;
        }

        return {
            chat_response: responseText,
            recommendations: results.map(car => ({
                _id: car._id,
                title: car.title,
                image: car.image,
                price: car.price,
                year: car.year,
                mileage: car.mileage,
                compatibility: { score: 75, reason: "Matches your keyword search" }
            }))
        };
    } catch (err) {
        return {
            chat_response: "System error. Please check your database connection.",
            recommendations: []
        };
    }
};

// Tool declaration for search_cars
const searchCarsTool = {
    functionDeclarations: [
        {
            name: 'search_cars',
            description: 'Search for vehicles listed in the database matching specific filters. Call this tool whenever a user asks to see cars, search for cars, or specifies filter criteria (like brand, model, price, transmission, location).',
            parameters: {
                type: 'OBJECT',
                properties: {
                    make: { type: 'STRING', description: 'Brand/manufacturer of the car (e.g. toyota, honda, suzuki, kia, hyundai)' },
                    model: { type: 'STRING', description: 'Model name (e.g. corolla, civic, alto, picanto, city)' },
                    minPrice: { type: 'NUMBER', description: 'Minimum price in PKR' },
                    maxPrice: { type: 'NUMBER', description: 'Maximum price in PKR' },
                    minYear: { type: 'NUMBER', description: 'Minimum manufacturing year' },
                    maxYear: { type: 'NUMBER', description: 'Maximum manufacturing year' },
                    transmission: { type: 'STRING', description: 'Transmission type (Automatic, Manual)' },
                    fuelType: { type: 'STRING', description: 'Fuel type (Petrol, Diesel, Hybrid, CNG, Electric)' },
                    location: { type: 'STRING', description: 'Location city in Pakistan (e.g., Lahore, Karachi, Islamabad, Rawalpindi)' }
                }
            }
        }
    ]
};

const formatHistoryForGemini = (messages) => {
    return messages.map(msg => {
        const role = msg.role === 'assistant' ? 'model' : 'user';
        return {
            role: role,
            parts: [{ text: msg.content }]
        };
    });
};

const withTimeout = (promise, ms) => {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms))
    ]);
};

const generateGeminiContent = async (genAI, contents, systemPrompt, tools = []) => {
    // Try Gemini 2.5 Flash first (verified active quota)
    try {
        console.log("🤖 Attempting generation with gemini-2.5-flash...");
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: systemPrompt,
            tools: tools
        });
        return await withTimeout(model.generateContent({ contents }), 5000);
    } catch (err25) {
        console.warn("Gemini 2.5 Flash failed. Trying gemini-flash-latest fallback. Error:", err25.message);
        try {
            const model = genAI.getGenerativeModel({ 
                model: "gemini-flash-latest",
                systemInstruction: systemPrompt,
                tools: tools
            });
            return await withTimeout(model.generateContent({ contents }), 5000);
        } catch (errFallback) {
            console.warn("Gemini fallback failed. Trying gemini-3.1-flash-lite. Error:", errFallback.message);
            const model = genAI.getGenerativeModel({ 
                model: "gemini-3.1-flash-lite",
                systemInstruction: systemPrompt,
                tools: tools
            });
            return await withTimeout(model.generateContent({ contents }), 5000);
        }
    }
};

/**
 * Main Chat Service using Google Gemini with Function Calling (Tools)
 */
export const analyzeWithGemini = async (messages, preferredLanguage = 'en', userPreferences = null) => {
    try {
        console.log("🚀 Analyzing with Google Gemini Chat Service...");
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY not found in .env");
        
        const genAI = new GoogleGenerativeAI(apiKey);

        const lastMsg = messages[messages.length - 1];
        
        let languageInstruction = "Strictly reply in the exact same language and script used by the user.";
        if (lastMsg && lastMsg.content) {
            const text = lastMsg.content.trim();
            const lower = text.toLowerCase();
            
            if (/[\u0600-\u06FF]/.test(text)) {
                if (/\b(مینوں|چاہیدی|تہاڈے|تہانوں|وچ|آے|کوئی)\b/.test(text)) {
                    languageInstruction = "CRITICAL: The user wrote in Shahmukhi Punjabi (اردو رسم الخط). You MUST reply 100% in Shahmukhi Punjabi (Urdu script).";
                } else {
                    languageInstruction = "CRITICAL: The user wrote in Urdu script (اردو). You MUST reply 100% in Urdu script (اردو).";
                }
            } else {
                const punjabiKeywords = ['meinu', 'mainu', 'chahidi', 'chaidi', 'tuhanu', 'tuhade', 'vaddi', 'gaddi', 'vich', 'jiven', 'haazir ne', 'sanu', 'sadi'];
                const isPunjabi = punjabiKeywords.some(kw => lower.includes(kw));

                const urduKeywords = ['chahiye', 'chahye', 'dikhao', 'batao', 'gari', 'gadi', 'gaadi', 'mein', 'me', 'karo', 'hai', 'hain', 'dastiyab', 'sasti', 'bhi', 'kya'];
                const isUrdu = urduKeywords.some(kw => lower.includes(kw));

                const englishWords = ['i', 'need', 'want', 'show', 'car', 'cars', 'looking', 'find', 'best', 'available', 'under', 'price', 'in', 'for'];
                const words = lower.split(/\s+/);
                const isEnglish = words.some(w => englishWords.includes(w)) && !isPunjabi && !isUrdu;

                if (isEnglish) {
                    languageInstruction = "CRITICAL: The user wrote in pure ENGLISH (e.g., 'i need honda civic in Rawalpindi'). You MUST reply 100% IN PURE ENGLISH. Absolutely DO NOT use Roman Urdu or Punjabi words like 'haazir ne', 'vich', 'gadiyan', 'hai', 'mein'.";
                } else if (isPunjabi) {
                    languageInstruction = "CRITICAL: The user wrote in Roman Pakistani Punjabi (e.g., 'meinu automatic gari chahidi ae'). You MUST reply 100% in Roman Pakistani Punjabi (e.g., 'Rawalpindi vich eh Honda Civic gadiyan haazir ne').";
                } else if (isUrdu) {
                    languageInstruction = "CRITICAL: The user wrote in Roman Urdu (e.g., 'mujhe gari chahiye'). You MUST reply 100% in Roman Urdu (e.g., 'Rawalpindi mein yeh Honda Civic gadiyan dastiyab hain').";
                }
            }
        }

        const systemPrompt = `You are AutoMarket Advisor, a premium Pakistani car consultant chatbot.
Your goal is to assist users in buying or finding cars on the AutoMarket platform.

${languageInstruction}

STRICT LANGUAGE RULES:
1. If the user speaks/types in ENGLISH: Reply 100% in English only.
2. If the user speaks/types in ROMAN URDU: Reply 100% in Roman Urdu.
3. If the user speaks/types in ROMAN PUNJABI: Reply 100% in Roman Pakistani Punjabi.
4. If the user speaks/types in URDU SCRIPT: Reply 100% in Urdu script.
5. NEVER use Gurmukhi script (Indian Punjabi, e.g., ਸਤ ਸ੍ਰੀ ਅਕਾਲ). Use ONLY Roman script or Urdu/Shahmukhi script.

Be conversational, helpful, and polite.
If the user greets you (e.g. 'hello', 'hi', 'salam', 'ki hal ae', 'kese ho'), greet them back warmly in their language and ask how you can help them find a car. Do not suggest cars on a simple greeting.
You have access to the 'search_cars' tool. Always call this tool when the user specifies criteria to search for cars (e.g., "show me Toyotas", "civic under 30 lakhs", "meinu automatic gari chaidi ae").
When formatting search response, summarize the cars found briefly in the SAME language used by the user.`;

        // Format conversation history
        const chatHistory = formatHistoryForGemini(messages.slice(0, -1));

        const contents = [
            ...chatHistory,
            { role: 'user', parts: [{ text: lastMsg.content }] }
        ];

        // Call Gemini using direct generateContent
        const result = await generateGeminiContent(genAI, contents, systemPrompt, [searchCarsTool]);

        const response = result.response;
        const functionCalls = response.functionCalls();
        
        let recommendations = [];
        let finalResponseText = "";

        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            if (call.name === 'search_cars') {
                console.log("🤖 Gemini called tool 'search_cars' with args:", call.args);
                const cars = await searchCarsForAI(call.args);
                recommendations = cars;

                // Send tool result back to Gemini to generate natural reply
                // To avoid missing "thought_signature" 400 Bad Request error,
                // we MUST pass the exact model content object returned from the API, 
                // followed by the function response.
                const modelContent = response.candidates[0].content;
                const toolResponsePart = {
                    role: 'user',
                    parts: [{
                        functionResponse: {
                            name: 'search_cars',
                            response: { 
                                cars: cars.map(c => ({ 
                                    title: c.title, 
                                    price: c.price, 
                                    year: c.year, 
                                    mileage: c.mileage, 
                                    fuelType: c.fuelType, 
                                    location: c.location 
                                })) 
                            }
                        }
                    }]
                };

                const followUpContents = [
                    ...contents,
                    modelContent,
                    toolResponsePart
                ];
                const followUpResult = await generateGeminiContent(genAI, followUpContents, systemPrompt, [searchCarsTool]);
                finalResponseText = followUpResult.response.text();
            }
        } else {
            finalResponseText = response.text();
        }

        // Apply Compatibility Scorer
        const defaultPrefs = { maxPrice: 10000000, familySize: 4, usage: 'city' };
        const prefs = userPreferences || defaultPrefs;

        const formattedRecs = recommendations.map(car => {
            const compat = calculateCompatibility(prefs, car);
            return {
                _id: car._id,
                title: car.title,
                image: car.image,
                price: car.price,
                year: car.year,
                mileage: car.mileage,
                fuelType: car.fuelType,
                transmission: car.transmission,
                location: car.location,
                compatibility: {
                    score: compat.score,
                    reason: compat.pros.length > 0 ? compat.pros[0] : "Matches your search criteria."
                }
            };
        });

        return {
            chat_response: finalResponseText,
            recommendations: formattedRecs
        };

    } catch (error) {
        console.error("Gemini Chat Service Error:", error.message);
        return await localKeywordFallback(messages, preferredLanguage);
    }
};
