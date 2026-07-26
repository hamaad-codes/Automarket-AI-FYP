import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { searchCarsForAI } from './carQueryService.js';
import { calculateCompatibility } from './compatibilityScorer.js';

dotenv.config();

const TIMEOUT_MS = 10000; // 10 seconds timeout

const withTimeout = (promise, ms) => {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms))
    ]);
};

const getSystemPrompt = (lastUserMessageText) => {
    let languageInstruction = "Strictly reply in the exact same language and script used by the user.";
    
    if (lastUserMessageText) {
        const text = lastUserMessageText.trim();
        const lower = text.toLowerCase();
        
        // Urdu script check
        if (/[\u0600-\u06FF]/.test(text)) {
            if (/\b(مینوں|چاہیدی|تہاڈے|تہانوں|وچ|آے|کوئی)\b/.test(text)) {
                languageInstruction = "CRITICAL: The user wrote in Shahmukhi Punjabi (اردو رسم الخط). You MUST reply 100% in Shahmukhi Punjabi (Urdu script).";
            } else {
                languageInstruction = "CRITICAL: The user wrote in Urdu script (اردو). You MUST reply 100% in Urdu script (اردو).";
            }
        } else {
            // Roman Punjabi check
            const punjabiKeywords = ['meinu', 'mainu', 'chahidi', 'chaidi', 'tuhanu', 'tuhade', 'vaddi', 'gaddi', 'vich', 'jiven', 'haazir ne', 'sanu', 'sadi'];
            const isPunjabi = punjabiKeywords.some(kw => lower.includes(kw));

            // Roman Urdu check
            const urduKeywords = ['chahiye', 'chahye', 'dikhao', 'batao', 'gari', 'gadi', 'gaadi', 'mein', 'me', 'karo', 'hai', 'hain', 'dastiyab', 'sasti', 'bhi', 'kya'];
            const isUrdu = urduKeywords.some(kw => lower.includes(kw));

            // Pure English check
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

    return `You are AutoMarket Advisor, a premium Pakistani car consultant chatbot.
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
When calling search_cars, you MUST strictly pass all numeric arguments (like minPrice, maxPrice, minYear, maxYear) as numbers, not strings (e.g., 4000000 instead of "4000000").
When formatting search response, summarize the cars found briefly in the SAME language used by the user.`;
};

// Gemini Search Cars Tool Declaration
const geminiSearchCarsTool = {
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

// Groq Search Cars Tool Declaration
const groqSearchCarsTool = [
    {
        type: 'function',
        function: {
            name: 'search_cars',
            description: 'Search for vehicles listed in the database matching specific filters. Call this tool whenever a user asks to see cars, search for cars, or specifies filter criteria (like brand, model, price, transmission, location).',
            parameters: {
                type: 'object',
                properties: {
                    make: { type: 'string', description: 'Brand/manufacturer of the car (e.g. toyota, honda, suzuki, kia, hyundai)' },
                    model: { type: 'string', description: 'Model name (e.g. corolla, civic, alto, picanto, city)' },
                    minPrice: { type: 'number', description: 'Minimum price in PKR. Strictly pass as a number, not a string.' },
                    maxPrice: { type: 'number', description: 'Maximum price in PKR. Strictly pass as a number, not a string.' },
                    minYear: { type: 'number', description: 'Minimum manufacturing year. Strictly pass as a number, not a string.' },
                    maxYear: { type: 'number', description: 'Maximum manufacturing year. Strictly pass as a number, not a string.' },
                    transmission: { type: 'string', description: 'Transmission type (Automatic, Manual)' },
                    fuelType: { type: 'string', description: 'Fuel type (Petrol, Diesel, Hybrid, CNG, Electric)' },
                    location: { type: 'string', description: 'Location city in Pakistan (e.g., Lahore, Karachi, Islamabad, Rawalpindi)' }
                }
            }
        }
    }
];

// Helper to format history for Gemini
const formatHistoryForGemini = (messages) => {
    return messages.map(msg => {
        const role = msg.role === 'assistant' ? 'model' : 'user';
        return {
            role: role,
            parts: [{ text: msg.content }]
        };
    });
};

// Fallback: Local Keyword Search (No AI required)
const localKeywordFallback = async (messages, preferredLanguage) => {
    try {
        console.log("🛠️ Local Keyword Fallback executed...");
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

/**
 * Call Gemini Chat Service with multi-model fallback cascade
 */
const generateGeminiContent = async (genAI, contents, systemPrompt, tools = []) => {
    const models = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
    let lastError = null;

    for (const modelName of models) {
        try {
            console.log(`🤖 Attempting generation with Gemini: ${modelName}...`);
            const model = genAI.getGenerativeModel({ 
                model: modelName,
                systemInstruction: systemPrompt,
                tools: tools
            });
            return await withTimeout(model.generateContent({ contents }), TIMEOUT_MS);
        } catch (err) {
            console.warn(`Gemini model ${modelName} failed. Error: ${err.message}`);
            lastError = err;
        }
    }
    throw lastError || new Error("All Gemini models failed");
};

/**
 * Call primary Gemini Chat completion
 */
const callGeminiChat = async (messages, preferredLanguage, userPreferences) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not found in .env");

    const genAI = new GoogleGenerativeAI(apiKey);

    const chatHistory = formatHistoryForGemini(messages.slice(0, -1));
    const lastMsg = messages[messages.length - 1];
    const dynamicSystemPrompt = getSystemPrompt(lastMsg ? lastMsg.content : '');

    const contents = [
        ...chatHistory,
        { role: 'user', parts: [{ text: lastMsg.content }] }
    ];

    const result = await generateGeminiContent(genAI, contents, dynamicSystemPrompt, [geminiSearchCarsTool]);
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
            const followUpResult = await generateGeminiContent(genAI, followUpContents, dynamicSystemPrompt, [geminiSearchCarsTool]);
            finalResponseText = followUpResult.response.text();
        }
    } else {
        finalResponseText = response.text();
    }

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
};

/**
 * Call Groq Chat completions (OpenAI-compatible)
 */
const callGroqChat = async (modelName, messages, preferredLanguage, userPreferences) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY not found in .env");

    console.log(`🤖 Attempting generation with Groq model: ${modelName}...`);

    const lastMsg = messages[messages.length - 1];
    const dynamicSystemPrompt = getSystemPrompt(lastMsg ? lastMsg.content : '');

    const formattedMessages = [
        { role: 'system', content: dynamicSystemPrompt },
        ...messages.map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
        }))
    ];

    const callGroqAPI = async (msgs, toolsList) => {
        const payload = {
            model: modelName,
            messages: msgs,
            temperature: 0.7,
            max_completion_tokens: 1024
        };
        if (toolsList && toolsList.length > 0) {
            payload.tools = toolsList;
            payload.tool_choice = 'auto';
        }

        const fetchPromise = fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const response = await withTimeout(fetchPromise, TIMEOUT_MS);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Groq API error (${response.status}): ${errorText}`);
        }

        return await response.json();
    };

    // First pass
    const data = await callGroqAPI(formattedMessages, groqSearchCarsTool);
    const choice = data.choices[0];
    const assistantMessage = choice.message;

    let recommendations = [];
    let finalResponseText = '';

    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        const toolCall = assistantMessage.tool_calls[0];
        if (toolCall.function.name === 'search_cars') {
            const args = JSON.parse(toolCall.function.arguments);
            console.log("🤖 Groq called tool 'search_cars' with args:", args);
            const cars = await searchCarsForAI(args);
            recommendations = cars;

            // Prepare follow up
            const followUpMessages = [
                ...formattedMessages,
                assistantMessage,
                {
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    name: 'search_cars',
                    content: JSON.stringify({
                        cars: cars.map(c => ({
                            title: c.title,
                            price: c.price,
                            year: c.year,
                            mileage: c.mileage,
                            fuelType: c.fuelType,
                            location: c.location
                        }))
                    })
                }
            ];

            const followUpData = await callGroqAPI(followUpMessages, groqSearchCarsTool);
            finalResponseText = followUpData.choices[0].message.content;
        }
    } else {
        finalResponseText = assistantMessage.content;
    }

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
};

/**
 * Main Orchestrated Chat service with fallback
 */
export const analyzeChat = async (messages, preferredLanguage = 'en', userPreferences = null) => {
    const groqFallbackModel = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

    try {
        console.log(`🚀 Calling Gemini Chat (Primary)...`);
        return await callGeminiChat(messages, preferredLanguage, userPreferences);
    } catch (geminiError) {
        console.warn(`⚠️ Gemini failed, switching to Groq Fallback (${groqFallbackModel}). Error:`, geminiError.message);
        
        try {
            console.log(`🚀 Calling Groq Chat (Fallback: ${groqFallbackModel})...`);
            return await callGroqChat(groqFallbackModel, messages, preferredLanguage, userPreferences);
        } catch (fallbackError) {
            console.error(`❌ Groq Fallback (${groqFallbackModel}) failed as well. Error:`, fallbackError.message);
            // Fallback to local keyword search so user is never left without a response
            return await localKeywordFallback(messages, preferredLanguage);
        }
    }
};

// Re-export under original name to guarantee backward compatibility
export const analyzeWithGemini = analyzeChat;
