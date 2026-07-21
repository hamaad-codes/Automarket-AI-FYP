import mongoose from 'mongoose';

const VerificationCodeSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    code: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600 // Automatically delete after 10 minutes (600 seconds)
    }
});

export default mongoose.model('VerificationCode', VerificationCodeSchema);
