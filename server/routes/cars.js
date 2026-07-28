
import express from 'express';
import Car from '../models/Car.js';
import Auction from '../models/Auction.js';
import auth from '../middleware/auth.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import axios from 'axios';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { transcribeAudioWithWhisper } from '../services/whisperService.js';

const router = express.Router();

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Multer Storage Configuration (using memoryStorage to bypass full local disk space issues)
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only images (jpeg, jpg, png, webp) are allowed'));
        }
    }
});

// Image Upload Endpoint
router.post('/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        // Convert the buffer in RAM to a Base64 Data URI
        const base64Data = req.file.buffer.toString('base64');
        const imageUrl = `data:${req.file.mimetype};base64,${base64Data}`;
        res.status(200).json({ url: imageUrl });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});



// Get all cars with pagination and filtering
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        const query = {};

        // Status filter (Default to active for public, unless specifically overridden or fetching for a specific user)
        if (req.query.status) {
            query.status = req.query.status;
        } else if (!req.query.user) {
            // Only show active cars in public listings
            query.status = 'active';
        }

        const filters = [];

        // Search filter (general keyword)
        if (req.query.search) {
            filters.push({
                $or: [
                    { title: { $regex: req.query.search, $options: 'i' } },
                    { description: { $regex: req.query.search, $options: 'i' } },
                    { make: { $regex: req.query.search, $options: 'i' } },
                    { model: { $regex: req.query.search, $options: 'i' } }
                ]
            });
        }

        // Make filter
        if (req.query.make) {
            const makes = req.query.make.split(',');
            filters.push({ make: { $in: makes.map(m => new RegExp(m, 'i')) } });
        }

        // Body Type filter
        if (req.query.bodyType) {
            const types = req.query.bodyType.split(',');
            filters.push({ bodyType: { $in: types.map(t => new RegExp(t, 'i')) } });
        }

        // Fuel Type filter
        if (req.query.fuelType) {
            const fuels = req.query.fuelType.split(',');
            filters.push({ fuelType: { $in: fuels.map(f => new RegExp(f, 'i')) } });
        }

        // Transmission filter
        if (req.query.transmission) {
            const transmissions = req.query.transmission.split(',');
            filters.push({ transmission: { $in: transmissions.map(t => new RegExp(t, 'i')) } });
        }

        // Color filter
        if (req.query.color) {
            const colors = req.query.color.split(',');
            const colorRegex = colors.map(c => new RegExp(c, 'i'));
            filters.push({
                $or: [
                    { color: { $in: colorRegex } },
                    { exteriorColor: { $in: colorRegex } }
                ]
            });
        }

        // Registration City
        if (req.query.registrationCity) {
            const cities = req.query.registrationCity.split(',');
            filters.push({ registrationCity: { $in: cities.map(c => new RegExp(c, 'i')) } });
        }

        // Location
        if (req.query.location) {
            const locations = req.query.location.split(',');
            filters.push({ location: { $in: locations.map(l => new RegExp(l, 'i')) } });
        }

        // Price Range filter
        if (req.query.minPrice || req.query.maxPrice) {
            const priceQuery = {};
            if (req.query.minPrice) priceQuery.$gte = parseInt(req.query.minPrice);
            if (req.query.maxPrice) priceQuery.$lte = parseInt(req.query.maxPrice);
            filters.push({ price: priceQuery });
        }

        // Year Range filter
        if (req.query.minYear || req.query.maxYear) {
            const yearQuery = {};
            if (req.query.minYear) yearQuery.$gte = parseInt(req.query.minYear);
            if (req.query.maxYear) yearQuery.$lte = parseInt(req.query.maxYear);
            filters.push({ year: yearQuery });
        }

        // User filter
        if (req.query.user) {
            filters.push({ user: req.query.user });
        }

        // Type filter
        if (req.query.type) {
            if (req.query.type === 'buy-now') {
                filters.push({ 
                    $or: [
                        { type: 'buy-now' },
                        { type: { $exists: false } },
                        { type: null }
                    ]
                });
            } else {
                filters.push({ type: req.query.type });
            }
        }

        // Engine CC Range - Robust extraction from string "1300 cc"
        if (req.query.minEngineCC || req.query.maxEngineCC) {
            const extractCC = {
                $toInt: {
                    $ifNull: [
                        { $getField: { field: "match", input: { $regexFind: { input: { $ifNull: ["$engineDisplacement", "0"] }, regex: "\\d+" } } } },
                        0
                    ]
                }
            };

            const ccFilters = [];
            if (req.query.minEngineCC) ccFilters.push({ $gte: [extractCC, parseInt(req.query.minEngineCC)] });
            if (req.query.maxEngineCC) ccFilters.push({ $lte: [extractCC, parseInt(req.query.maxEngineCC)] });

            if (ccFilters.length > 0) filters.push({ $expr: { $and: ccFilters } });
        }

        // Mileage Range - Robust extraction from string "50,000 km"
        if (req.query.minMileage || req.query.maxMileage) {
            const extractMileage = {
                $toInt: {
                    $ifNull: [
                        { $getField: { field: "match", input: { $regexFind: { input: { $replaceAll: { input: { $ifNull: ["$mileage", "0"] }, find: ",", replacement: "" } }, regex: "\\d+" } } } },
                        0
                    ]
                }
            };

            const mileageFilters = [];
            if (req.query.minMileage) mileageFilters.push({ $gte: [extractMileage, parseInt(req.query.minMileage)] });
            if (req.query.maxMileage) mileageFilters.push({ $lte: [extractMileage, parseInt(req.query.maxMileage)] });

            if (mileageFilters.length > 0) filters.push({ $expr: { $and: mileageFilters } });
        }

        // Combined logic logic
        if (filters.length > 0) {
            query.$and = filters;
        }

        // Sorting
        let sortQuery = { createdAt: -1 }; // Default: Newest
        if (req.query.sort) {
            switch (req.query.sort) {
                case 'newest': sortQuery = { createdAt: -1 }; break;
                case 'oldest': sortQuery = { createdAt: 1 }; break;
                case 'price-low': sortQuery = { price: 1 }; break;
                case 'price-high': sortQuery = { price: -1 }; break;
                case 'year-new': sortQuery = { year: -1 }; break;
                case 'year-old': sortQuery = { year: 1 }; break;
                case 'mileage': sortQuery = { mileage: 1 }; break;
                case 'bids': sortQuery = { bidsCount: -1 }; break; // For auctions
                case 'ending': sortQuery = { endTime: 1 }; break; // For auctions
            }
        }

        // Randomization with pagination support
        // Note: True random with skipping in Mongo is hard without complex logic.
        // We use a hybrid approach: if random=true and no search/filter, use sample, 
        // otherwise use regular sort for consistency across pages.
        if (req.query.random === 'true' && filters.length === 0) {
            const randomCars = await Car.aggregate([
                { $match: query },
                { $sample: { size: limit } }
            ]);
            return res.json({
                cars: randomCars,
                currentPage: page,
                totalPages: 1,
                totalCars: limit
            });
        }

        const cars = await Car.find(query)
            .populate('user', 'name email phone')
            .sort(sortQuery)
            .skip(skip)
            .limit(limit);

        const total = await Car.countDocuments(query);

        res.json({
            cars,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalCars: total
        });

    } catch (err) {
        console.error("Backend Filter Error:", err);
        res.status(500).json({ message: err.message });
    }
});

// Get single car (Increments real views counter in MongoDB)
router.get('/:id', async (req, res) => {
    try {
        const car = await Car.findByIdAndUpdate(
            req.params.id, 
            { $inc: { views: 1 } }, 
            { new: true }
        ).populate('user', 'name email phone');
        if (!car) return res.status(404).json({ message: 'Car not found' });
        res.json(car);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create new car
router.post('/', auth, async (req, res) => {
    try {
        const carData = { ...req.body, user: req.user.id };
        const car = new Car(carData);
        const newCar = await car.save();
        res.status(201).json(newCar);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get logged in user's own listings
router.get('/user/my-listings', auth, async (req, res) => {
    try {
        const cars = await Car.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(cars);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update car
router.put('/:id', auth, async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) return res.status(404).json({ message: 'Car not found' });

        const dbUser = await User.findById(req.user.id);
        const isAdmin = dbUser && dbUser.role === 'admin';

        if (car.user && car.user.toString() !== req.user.id && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to update this listing' });
        }

        const updateData = { ...req.body };
        
        // If the car was in revision_requested state and seller is updating it, set status back to pending
        if (car.status === 'revision_requested' && !isAdmin) {
            updateData.status = 'pending';
            updateData.adminNotes = '';
            updateData.revisionReason = '';
        }

        const updatedCar = await Car.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json(updatedCar);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete car
router.delete('/:id', auth, async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) return res.status(404).json({ message: 'Car not found' });

        const dbUser = await User.findById(req.user.id);
        const isAdmin = dbUser && dbUser.role === 'admin';

        if (car.user && car.user.toString() !== req.user.id && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to delete this listing' });
        }

        await Car.findByIdAndDelete(req.params.id);
        
        // Also delete associated auction if it exists
        if (car.type === 'auction') {
            await Auction.deleteOne({ carId: car._id });
        }

        res.json({ message: 'Car deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get cars by status (Admin only)
router.get('/admin/list', async (req, res) => {
    try {
        const { status } = req.query;
        const query = status ? { status } : {};
        const cars = await Car.find(query).populate('user', 'name email').sort({ createdAt: -1 });
        res.json(cars);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get pending cars (Admin only)
router.get('/admin/pending', async (req, res) => {
    try {
        const cars = await Car.find({ status: 'pending' }).populate('user', 'name email').sort({ createdAt: -1 });
        res.json(cars);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update car status (Approve/Reject/Revision)
router.patch('/:id/status', auth, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['active', 'pending', 'rejected', 'sold', 'revision_requested'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const car = await Car.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!car) return res.status(404).json({ message: 'Car not found' });

        // Create notification for user if status changes
        if (car.user) {
            let notifMsg = `Your listing "${car.title}" status has been updated to ${status}.`;
            if (status === 'active') {
                notifMsg = `🎉 Congratulations! Your vehicle listing "${car.title}" has been approved and is now live.`;
            } else if (status === 'rejected') {
                notifMsg = `❌ Your vehicle listing "${car.title}" was not approved by Admin.`;
            }
            const notification = new Notification({
                user: car.user,
                message: notifMsg
            });
            await notification.save();
        }

        // If approved and type is auction, create an entry in the auctions collection
        if (status === 'active' && car.type === 'auction') {
            // Check if auction already exists to avoid duplicates
            const existingAuction = await Auction.findOne({ carId: car._id });
            if (!existingAuction) {
                const auction = new Auction({
                    carId: car._id,
                    title: car.title,
                    price: car.price,
                    minBid: car.price,
                    currentBid: car.price,
                    sellerName: car.sellerName,
                    sellerEmail: car.sellerEmail,
                    image: car.image,
                    images: car.images,
                    make: car.make,
                    model: car.model,
                    year: car.year,
                    mileage: car.mileage,
                    location: car.location,
                    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default 7 days
                });
                await auction.save();
            }
        } else if (status !== 'active' && car.type === 'auction') {
            // If status is changed from active to something else, remove from auctions list
            await Auction.deleteOne({ carId: car._id });
        }

        res.json(car);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Admin Request Revision with Feedback & Direct Message to Seller
router.patch('/:id/request-revision', auth, async (req, res) => {
    try {
        const { adminNotes, revisionReason, aiEstimatedPrice } = req.body;

        const car = await Car.findById(req.params.id);
        if (!car) return res.status(404).json({ message: 'Car not found' });

        car.status = 'revision_requested';
        car.adminNotes = adminNotes || 'Please review and update your car listing price or details.';
        car.revisionReason = revisionReason || 'overpriced';
        if (aiEstimatedPrice) {
            car.aiEstimatedPrice = aiEstimatedPrice;
        }

        await car.save();

        // 1. Create In-App Notification for seller if user exists
        if (car.user) {
            const notification = new Notification({
                user: car.user,
                message: `⚠️ Revision Required: Admin sent feedback for "${car.title}". Note: ${car.adminNotes}`
            });
            await notification.save();

            // 2. Create or update Conversation between Admin and Seller
            try {
                let conversation = await Conversation.findOne({
                    car: car._id,
                    participants: { $all: [req.user.id, car.user] }
                });

                if (!conversation) {
                    conversation = new Conversation({
                        participants: [req.user.id, car.user],
                        car: car._id,
                        lastMessage: adminNotes
                    });
                    await conversation.save();
                } else {
                    conversation.lastMessage = adminNotes;
                    conversation.updatedAt = Date.now();
                    await conversation.save();
                }

                const message = new Message({
                    conversation: conversation._id,
                    sender: req.user.id,
                    text: `[Admin Moderation Feedback for "${car.title}"]:\n${adminNotes}`
                });
                await message.save();
            } catch (convErr) {
                console.error("Conversation creation error (non-fatal):", convErr);
            }
        }

        res.json(car);
    } catch (err) {
        console.error("Error in request-revision:", err);
        res.status(500).json({ message: err.message });
    }
});

// AI Price prediction proxy endpoint with Smart Pakistani Market Heuristic Fallback
router.post('/predict-price', async (req, res) => {
    try {
        const { make, model, year, bodyType, mileage, fuelType, transmission, color, location, assembly, engineDisplacement } = req.body;
        
        let predictedPrice = 0;

        try {
            const predictUrl = process.env.PREDICT_SERVER_URL || 'http://127.0.0.1:5002/predict';
            const response = await axios.post(predictUrl, {
                make,
                model,
                year,
                bodyType,
                mileage,
                fuelType,
                transmission,
                color,
                location,
                assembly,
                engineDisplacement
            }, { timeout: 2500 });

            if (response.data && (response.data.predicted_price || response.data.predictedPrice)) {
                predictedPrice = response.data.predicted_price || response.data.predictedPrice;
            }
        } catch (mlErr) {
            // Smart Fallback Estimator for Pakistani Car Market
            const carMake = (make || '').toLowerCase();
            const carModel = (model || '').toLowerCase();
            const carYear = parseInt(year) || 2020;
            const numericMileage = parseInt((mileage || '50000').toString().replace(/\D/g, '')) || 50000;

            let basePrice = 3500000; // Default sedan base

            if (carModel.includes('civic') || carModel.includes('accord')) basePrice = 5200000;
            else if (carModel.includes('corolla') || carModel.includes('fortuner')) basePrice = 4400000;
            else if (carModel.includes('city') || carModel.includes('yaris')) basePrice = 3400000;
            else if (carModel.includes('alto') || carModel.includes('mehran')) basePrice = 2300000;
            else if (carModel.includes('cultus') || carModel.includes('wagon')) basePrice = 2600000;
            else if (carModel.includes('sportage') || carModel.includes('tucson') || carModel.includes('mg')) basePrice = 6200000;
            else if (carMake.includes('audi') || carMake.includes('bmw') || carMake.includes('mercedes')) basePrice = 12500000;

            // Age factor (+ 400,000 per year above 2020)
            const yearDiff = carYear - 2020;
            basePrice += yearDiff * 400000;

            // Mileage factor (- 20,000 per 10,000 km)
            const mileageDeduction = Math.min(numericMileage / 10000, 20) * 20000;
            basePrice -= mileageDeduction;

            predictedPrice = Math.max(basePrice, 1200000);
        }

        const minPrice = Math.round(predictedPrice * 0.92);
        const maxPrice = Math.round(predictedPrice * 1.08);

        res.json({
            predictedPrice: Math.round(predictedPrice),
            minPrice,
            maxPrice
        });
    } catch (err) {
        console.error("Express Prediction Error:", err.message);
        res.status(500).json({ message: "Prediction failed", error: err.message });
    }
});

// Multer storage for voice-to-listing uploads
const voiceStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'voice-listing-' + uniqueSuffix + '.webm');
    }
});
const uploadVoice = multer({ storage: voiceStorage });

// AI Voice-to-Listing details extraction endpoint
router.post('/extract-from-voice', uploadVoice.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No audio file uploaded" });
        }

        const audioPath = req.file.path;
        console.log(`[Voice-to-Listing] Processing voice: ${audioPath}`);

        // 1. Transcribe the audio
        const transcribedText = await transcribeAudioWithWhisper(audioPath);

        // Delete temporary audio file
        if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);

        if (!transcribedText || !transcribedText.trim()) {
            return res.status(400).json({ message: "Could not transcribe audio. Please speak clearly." });
        }

        console.log(`[Voice-to-Listing] Transcribed text: "${transcribedText}"`);

        // 2. Call Gemini to extract structured car details in JSON format
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY not found in env");
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
You are an expert vehicle detail extraction AI for AutoMarket, a Pakistani car marketplace.
Analyze the following transcribed text from a user describing their vehicle for sale.
Extract the car attributes exactly and structure them into the specified JSON schema.

Input text: "${transcribedText}"

JSON Schema:
{
  "make": string (lowercase brand name like: toyota, honda, suzuki, kia, hyundai, nissan, etc.),
  "model": string (model name like: civic, corolla, alto, swift, sportage, etc.),
  "year": string (4-digit year like: "2021", "2018", "2015". Defaults to "2024" if not mentioned),
  "bodyType": string (lowercase body type like: sedan, hatchback, suv, crossover, van, coupe, convertible, pickup),
  "mileage": string (numeric mileage in km as string, e.g. "45000", "120000"),
  "fuelType": string (lowercase fuel type: petrol, diesel, hybrid, cng, electric),
  "transmission": string (lowercase transmission: automatic, manual),
  "exteriorColor": string (lowercase color: white, black, silver, grey, red, blue, etc.),
  "price": string (numeric price in PKR as string, e.g. "3200000", "4500000"),
  "title": string (A catchy title for the listing in English, e.g., "Suzuki Swift 2021 Manual for Sale"),
  "description": string (A detailed description summarizing the car details, condition, registration city, and selling points mentioned in the text. Write this description in English, and keep it professional and friendly),
  "location": string (The registration city or user location mentioned, e.g. Lahore, Karachi, Islamabad, Rawalpindi. Default to "Lahore" if not mentioned)
}

Strict instructions:
- If a property is not mentioned or cannot be inferred, return an empty string ("") for strings.
- Do not translate the actual model name or color.
- Return ONLY the raw JSON object matching this schema. No markdown formatting.
`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();
        console.log(`[Voice-to-Listing] Extracted JSON: ${responseText}`);

        const extractedData = JSON.parse(responseText);

        res.json({
            text: transcribedText,
            data: extractedData
        });

    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }
        }
        console.error("[Voice-to-Listing] Error:", error);
        res.status(500).json({ message: "Failed to extract car details from voice", error: error.message });
    }
});
// Boost Car Listing (Monetization & Ad Boosting Payment)
router.post('/:id/boost', auth, async (req, res) => {
    try {
        const { paymentMethod, packageTier, amount, transactionId } = req.body;

        const car = await Car.findById(req.params.id);
        if (!car) return res.status(404).json({ message: 'Car not found' });

        car.isFeatured = true;
        car.featuredTier = packageTier || 'featured';
        car.featuredUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days boost

        await car.save();

        // Create In-App Notification for seller
        const notification = new Notification({
            user: req.user.id,
            message: `🎉 Payment Successful (${paymentMethod.toUpperCase()})! Your listing "${car.title}" is now BOOSTED as a ${car.featuredTier.toUpperCase()} Ad. Txn ID: ${transactionId}`
        });
        await notification.save();

        res.json({
            success: true,
            message: `Listing boosted successfully as ${car.featuredTier}`,
            car
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Apply for Car Financing Lead
router.post('/:id/apply-financing', async (req, res) => {
    try {
        const { bankName, downPayment, tenure, monthlyInstallment, userName, userPhone, userEmail } = req.body;
        
        const car = await Car.findById(req.params.id);
        if (!car) return res.status(404).json({ message: 'Car not found' });

        // Notify seller if user exists
        if (car.user) {
            const notification = new Notification({
                user: car.user,
                message: `🏦 New Bank Financing Lead: ${userName} (${userPhone}) applied for ${bankName} Auto Finance for your car "${car.title}".`
            });
            await notification.save();
        }

        res.json({
            success: true,
            message: `Bank financing application submitted to ${bankName} successfully!`,
            referenceId: `FIN-${Date.now().toString().slice(-6)}`
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Increment Phone Click / Call Seller Lead Counter
router.post('/:id/phone-click', async (req, res) => {
    try {
        const car = await Car.findByIdAndUpdate(
            req.params.id,
            { $inc: { phoneClicks: 1 } },
            { new: true }
        );
        if (!car) return res.status(404).json({ message: 'Car not found' });
        res.json({ success: true, phoneClicks: car.phoneClicks });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
