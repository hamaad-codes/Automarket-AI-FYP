
import mongoose from 'mongoose';

const carSchema = new mongoose.Schema({
    url: String,
    title: {
        type: String,
        required: true
    },
    description: String,
    image: String,
    transmission: String,
    color: String,
    bodyType: String,
    engineDisplacement: String,
    mileage: String,
    location: String,
    registrationCity: String,
    price: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'PKR'
    },
    status: {
        type: String,
        default: 'pending'
    },
    views: {
        type: Number,
        default: 0
    },
    inquiries: {
        type: Number,
        default: 0
    },
    type: {
        type: String,
        default: 'buy-now'
    },
    make: String,
    model: String,
    year: Number,
    fuelType: String,
    vin: String,
    exteriorColor: String,
    interiorColor: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    sellerName: String,
    sellerEmail: String,
    features: [String],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Car', carSchema, 'listingcars');
