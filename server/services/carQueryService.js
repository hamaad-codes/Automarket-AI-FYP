
import Car from '../models/Car.js';

/**
 * Service to handle complex car queries for the AI
 */
export const searchCarsForAI = async (filters) => {
    try {
        const buildQuery = (f) => {
            const q = { status: 'active' };
            
            // Search make/model across fields since imported database entries may have empty 'make'
            if (f.make && f.model) {
                q.$or = [
                    { make: new RegExp(f.make, 'i'), model: new RegExp(f.model, 'i') },
                    { model: new RegExp(f.model, 'i') },
                    { title: new RegExp(f.make, 'i') },
                    { title: new RegExp(f.model, 'i') }
                ];
            } else if (f.make) {
                q.$or = [
                    { make: new RegExp(f.make, 'i') },
                    { model: new RegExp(f.make, 'i') },
                    { title: new RegExp(f.make, 'i') }
                ];
            } else if (f.model) {
                q.$or = [
                    { model: new RegExp(f.model, 'i') },
                    { title: new RegExp(f.model, 'i') }
                ];
            }

            if (f.bodyType) q.bodyType = new RegExp(f.bodyType, 'i');
            
            if (f.transmission && f.transmission.toLowerCase() !== 'any') {
                q.transmission = new RegExp(`^${f.transmission}`, 'i');
            }
            if (f.fuelType && f.fuelType.toLowerCase() !== 'any') {
                q.fuelType = new RegExp(`^${f.fuelType}`, 'i');
            }
            if (f.location && f.location.trim() !== '') {
                q.location = new RegExp(f.location, 'i');
            }

            if (f.minPrice || f.maxPrice) {
                q.price = {};
                if (f.minPrice) q.price.$gte = Number(f.minPrice);
                if (f.maxPrice) q.price.$lte = Number(f.maxPrice);
            }

            if (f.minYear || f.maxYear) {
                q.year = {};
                if (f.minYear) q.year.$gte = Number(f.minYear);
                if (f.maxYear) q.year.$lte = Number(f.maxYear);
            }
            return q;
        };

        let query = buildQuery(filters);
        console.log("🔍 Running DB Search with query:", JSON.stringify(query));
        let cars = await Car.find(query)
            .select('title price image year mileage fuelType transmission location description make model features')
            .limit(8)
            .lean();

        // Fallback 1: Relax year, price, location, transmission, and fuel type limits
        if (cars.length === 0) {
            console.log("⚠️ No cars found. Relaxing year, price, location, transmission, and fuelType filters...");
            const relaxedFilters = {
                make: filters.make,
                model: filters.model,
                bodyType: filters.bodyType
            };
            query = buildQuery(relaxedFilters);
            console.log("🔍 Running Relaxed DB Search with query:", JSON.stringify(query));
            cars = await Car.find(query)
                .select('title price image year mileage fuelType transmission location description make model features')
                .limit(8)
                .lean();
        }

        // Fallback 2: Relax make and search purely by model name in model/title
        if (cars.length === 0 && filters.model) {
            console.log("⚠️ Still no cars found. Searching purely by model name...");
            const modelOnlyQuery = {
                status: 'active',
                $or: [
                    { model: new RegExp(filters.model, 'i') },
                    { title: new RegExp(filters.model, 'i') }
                ]
            };
            console.log("🔍 Running Model-Only DB Search with query:", JSON.stringify(modelOnlyQuery));
            cars = await Car.find(modelOnlyQuery)
                .select('title price image year mileage fuelType transmission location description make model features')
                .limit(8)
                .lean();
        }

        // Fallback 3: Return default active cars
        if (cars.length === 0) {
            console.log("⚠️ Still no cars found. Returning default active cars...");
            cars = await Car.find({ status: 'active' })
                .select('title price image year mileage fuelType transmission location description make model features')
                .limit(4)
                .lean();
        }

        return cars;
    } catch (error) {
        console.error("AI Search Error:", error);
        return [];
    }
};

export const getCarStatsForAI = async () => {
    try {
        const totalCars = await Car.countDocuments({ status: 'active' });
        const makes = await Car.distinct('make');
        const bodyTypes = await Car.distinct('bodyType');

        return {
            totalCars,
            popularMakes: makes.slice(0, 10),
            availableBodyTypes: bodyTypes
        };
    } catch (error) {
        console.error("AI Stats Error:", error);
        return {};
    }
};

export const getCarDetailsById = async (id) => {
    try {
        return await Car.findById(id).lean();
    } catch (error) {
        return null;
    }
};
