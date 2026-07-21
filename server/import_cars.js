import mongoose from 'mongoose';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
dotenv.config({ path: './.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURATION ---
const DATASET_PATH = 'C:/Users/hamaa/.cache/kagglehub/datasets/asimzahid/pakistans-largest-pakwheels-automobiles-listings/versions/1/usedCars.json';
// ---------------------

import Car from './models/Car.js';

async function importData() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to:', mongoose.connection.name);

        if (!fs.existsSync(DATASET_PATH)) {
            console.error(`Error: Dataset file NOT found at: ${DATASET_PATH}`);
            process.exit(1);
        }

        console.log('Reading dataset file...');
        const rawData = fs.readFileSync(DATASET_PATH, 'utf8');
        const data = JSON.parse(rawData);
        
        const carList = Array.isArray(data) ? data : (data.usedCars || []);

        if (carList.length === 0) {
            console.error('Error: No cars found in the JSON file.');
            process.exit(1);
        }

        console.log(`Found ${carList.length} cars. Starting import...`);

        // Clear existing cars (Optional)
        await Car.deleteMany({});
        console.log('Cleared existing cars.');

        const formattedCars = carList.map(car => {
            let price = car.price;
            if (typeof price === 'string') {
                price = parseInt(price.replace(/[^0-9]/g, '')) || 0;
            } else if (typeof price === 'number') {
                // Keep as is
            } else {
                price = 0;
            }

            let rawYear = car.year || car.modelDate;
            let year = 2020;
            if (typeof rawYear === 'number') {
                year = rawYear;
            } else if (typeof rawYear === 'string') {
                year = parseInt(rawYear) || 2020;
            }

            // Extract location - clean up whitespace
            let location = car.location || car.sellerLocation || '';
            if (typeof location === 'string') {
                location = location.trim();
            }

            // Extract engine displacement
            let engineDisplacement = car.engineDisplacement || '';
            if (!engineDisplacement && car.vehicleEngine && car.vehicleEngine.engineDisplacement) {
                engineDisplacement = car.vehicleEngine.engineDisplacement;
            }

            // Extract registration city
            let registrationCity = car.registrationCity || '';
            if (!registrationCity && car.extraFeatures && car.extraFeatures.RegisteredIn) {
                registrationCity = car.extraFeatures.RegisteredIn;
            }

            // Make & Model
            let make = car.make || car.manufacturer || '';
            if (!make && car.brand) {
                make = typeof car.brand === 'string' ? car.brand : (car.brand.name || '');
            }

            return {
                title: car.title || car.name || 'Untitled Car',
                description: car.description || '',
                price: price,
                year: year,
                make: make,
                model: car.model || '',
                bodyType: car.bodyType || '',
                transmission: car.transmission || car.vehicleTransmission || '',
                fuelType: car.fuelType || '',
                engineDisplacement: engineDisplacement,
                mileage: car.mileage || car.mileageFromOdometer || '',
                location: location,
                registrationCity: registrationCity,
                color: car.color || '',
                image: car.image || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800',
                features: car.features || [],
                type: 'buy-now',
                status: 'active'
            };
        });

        const chunkSize = 500;
        for (let i = 0; i < formattedCars.length; i += chunkSize) {
            const chunk = formattedCars.slice(i, i + chunkSize);
            await Car.insertMany(chunk);
            console.log(`Imported ${i + chunk.length} / ${formattedCars.length} cars...`);
        }

        console.log('Import completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Import failed:', error);
        process.exit(1);
    }
}

importData();
