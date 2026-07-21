
import mongoose from 'mongoose';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
dotenv.config({ path: '../server/.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURATION ---
// Update this path to where your JSON file is located
const DATASET_PATH = 'C:/Users/hamaa/.cache/kagglehub/datasets/asimzahid/pakistans-largest-pakwheels-automobiles-listings/versions/1/usedCars.json';
// ---------------------

import Car from '../server/models/Car.js';

async function importData() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/automarket');
        console.log('Connected to:', mongoose.connection.name);

        if (!fs.existsSync(DATASET_PATH)) {
            console.error(`Error: Dataset file NOT found at: ${DATASET_PATH}`);
            console.log('Please check the path in scripts/import_cars.js and update it to the correct location.');
            process.exit(1);
        }

        console.log('Reading dataset file...');
        const rawData = fs.readFileSync(DATASET_PATH, 'utf8');
        const data = JSON.parse(rawData);
        
        // Handle both { usedCars: [...] } and direct array
        const carList = Array.isArray(data) ? data : (data.usedCars || []);

        if (carList.length === 0) {
            console.error('Error: No cars found in the JSON file.');
            process.exit(1);
        }

        console.log(`Found ${carList.length} cars. Starting import...`);

        // Clear existing cars? (Optional - uncomment if you want to replace all data)
        // await Car.deleteMany({});
        // console.log('Cleared existing cars.');

        const formattedCars = carList.map(car => {
            // Ensure price is a number
            let price = car.price;
            if (typeof price === 'string') {
                price = parseInt(price.replace(/[^0-9]/g, '')) || 0;
            }

            // Ensure year is a number
            let year = car.year;
            if (typeof year === 'string') {
                year = parseInt(year) || 2020;
            }

            return {
                title: car.title || 'Untitled Car',
                description: car.description || '',
                price: price,
                year: year,
                make: car.make || '',
                model: car.model || '',
                bodyType: car.bodyType || '',
                transmission: car.transmission || '',
                fuelType: car.fuelType || '',
                engineDisplacement: car.engineDisplacement || '',
                mileage: car.mileage || '',
                location: car.location || '',
                registrationCity: car.registrationCity || '',
                color: car.color || '',
                image: car.image || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800',
                type: 'buy-now', // Default for dataset
                status: 'active'
            };
        });

        // Insert in chunks of 500 to avoid memory issues
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
