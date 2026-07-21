
const fs = require('fs');
const path = 'C:\\Users\\dell\\.cache\\kagglehub\\datasets\\asimzahid\\pakistans-largest-pakwheels-automobiles-listings\\versions\\1\\usedCars.json';

try {
    const rawData = fs.readFileSync(path, 'utf8');
    const data = JSON.parse(rawData);

    const cars = data.usedCars;
    if (Array.isArray(cars)) {
        console.log('Found cars array. Length:', cars.length);
        console.log('Sample car keys:', Object.keys(cars[0]));
        console.log('Sample car:', JSON.stringify(cars[0], null, 2));
    } else {
        console.log('usedCars is not an array:', typeof cars);
    }

} catch (err) {
    console.error('Error reading file:', err);
}
