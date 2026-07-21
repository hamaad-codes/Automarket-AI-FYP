import mongoose from 'mongoose';

const auctionSchema = new mongoose.Schema({
    carId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Car'
    },
    title: String,
    price: Number,
    minBid: Number,
    currentBid: {
        type: Number,
        default: 0
    },
    endTime: Date,
    sellerName: String,
    sellerEmail: String,
    image: String,
    images: [String],
    make: String,
    model: String,
    year: Number,
    mileage: String,
    location: String,
    status: {
        type: String,
        default: 'active'
    },
    bids: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        amount: Number,
        time: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Auction', auctionSchema, 'auctions');
