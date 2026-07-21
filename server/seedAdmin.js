import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Check if admin exists
        let admin = await User.findOne({ email: 'admin@automarket.com' });

        if (admin) {
            console.log('Admin already exists. Updating password...');
        } else {
            admin = new User({
                name: 'Admin',
                email: 'admin@automarket.com',
                role: 'admin'
            });
        }

        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash('admin123', salt);

        await admin.save();
        console.log('Admin user created/updated successfully');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedAdmin();
