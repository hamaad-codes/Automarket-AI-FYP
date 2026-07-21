export const calculateCompatibility = (userPrefs, car) => {
    let score = 0;
    const weights = {
        budget: 30,
        usage: 20,
        family: 20,
        fuel: 15,
        location: 10,
        transmission: 5
    };

    const pros = [];
    const cons = [];

    // 1. Budget Score (30%)
    if (userPrefs.maxPrice) {
        const priceRatio = car.price / userPrefs.maxPrice;
        if (priceRatio <= 0.9) {
            score += weights.budget;
            pros.push('Fits your budget perfectly');
        } else if (priceRatio <= 1.1) {
            score += weights.budget * 0.7;
            pros.push('Slightly above/at your budget');
        } else {
            cons.push('Significantly above your budget');
        }
    }

    // 2. Usage/Body Type (20%)
    if (userPrefs.usage) {
        if (userPrefs.usage === 'city' && ['Hatchback', 'Sedan'].includes(car.bodyType)) {
            score += weights.usage;
            pros.push('Excellent for city driving');
        } else if (userPrefs.usage === 'highway' && ['SUV', 'Sedan'].includes(car.bodyType)) {
            score += weights.usage;
            pros.push('Great for long highway trips');
        } else {
            cons.push('May not be ideal for your primary usage');
        }
    }

    // 3. Family Size (20%)
    if (userPrefs.familySize) {
        if (userPrefs.familySize > 4 && ['SUV', 'Van'].includes(car.bodyType)) {
            score += weights.family;
            pros.push('Spacious enough for your family');
        } else if (userPrefs.familySize <= 4) {
            score += weights.family;
        } else {
            cons.push('Might be tight for a larger family');
        }
    }

    // 4. Fuel Type (15%)
    if (userPrefs.fuelType && car.fuelType) {
        if (userPrefs.fuelType.toLowerCase() === car.fuelType.toLowerCase()) {
            score += weights.fuel;
            pros.push(`Matching fuel type: ${car.fuelType}`);
        }
    } else {
        score += weights.fuel * 0.5; // Neutral
    }

    // 5. Location (10%)
    if (userPrefs.location && car.location) {
        if (car.location.toLowerCase().includes(userPrefs.location.toLowerCase())) {
            score += weights.location;
            pros.push('Located in your city');
        }
    }

    // 6. Transmission (5%)
    if (userPrefs.transmission && car.transmission) {
        if (userPrefs.transmission.toLowerCase() === car.transmission.toLowerCase()) {
            score += weights.transmission;
            pros.push(`${car.transmission} transmission as preferred`);
        }
    }

    return {
        score: Math.min(100, Math.max(0, Math.round(score))),
        pros,
        cons
    };
};
