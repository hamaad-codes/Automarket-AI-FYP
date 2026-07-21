import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import VerificationCode from '../models/VerificationCode.js';
import { sendVerificationEmail } from '../services/emailService.js';

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

const router = express.Router();

// Simple In-Memory Rate Limiter to protect against OTP/Email Spamming
const rateLimitCache = new Map();
const customRateLimiter = (windowMs, maxRequests, message) => {
    return (req, res, next) => {
        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const now = Date.now();
        
        if (!rateLimitCache.has(ip)) {
            rateLimitCache.set(ip, []);
        }
        
        // Filter out timestamps older than the windowMs
        const requests = rateLimitCache.get(ip).filter(timestamp => now - timestamp < windowMs);
        requests.push(now);
        rateLimitCache.set(ip, requests);
        
        if (requests.length > maxRequests) {
            return res.status(429).json({ msg: message || "Too many requests. Please try again later." });
        }
        next();
    };
};

// Register - Send Verification Code
router.post('/register-send-code', customRateLimiter(5 * 60 * 1000, 3, 'Too many verification code requests from this IP. Please try again after 5 minutes.'), async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ msg: 'Please enter all fields' });
    }

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Generate a 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Save/update verification code in database
        await VerificationCode.findOneAndUpdate(
            { email },
            { code, createdAt: Date.now() },
            { upsert: true, new: true }
        );

        // Send email
        const emailSent = await sendVerificationEmail(email, code);

        // In development mode (if SMTP not set), we can supply the devCode
        const showDevCode = !process.env.SMTP_USER || !process.env.SMTP_PASS || !emailSent;

        res.json({
            msg: 'Verification code sent to email',
            devCode: showDevCode ? code : null // For development convenience
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error during verification send' });
    }
});

// Register Verify & Create Account
router.post('/register', async (req, res) => {
    const { name, email, password, code } = req.body;

    if (!name || !email || !password || !code) {
        return res.status(400).json({ msg: 'Please enter all fields including verification code' });
    }

    try {
        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Check verification code
        const verification = await VerificationCode.findOne({ email, code });
        if (!verification) {
            return res.status(400).json({ msg: 'Invalid or expired verification code' });
        }

        user = new User({
            name,
            email,
            password
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        // Remove verification code from database
        await VerificationCode.deleteOne({ email });

        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5d' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        phone: user.phone || '',
                        bio: user.bio || '',
                        profilePicture: user.profilePicture || ''
                    }
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    let { email, password } = req.body;

    // Support 'admin' username as alias for admin email
    if (email === 'admin') email = 'admin@automarket.com';

    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5d' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        phone: user.phone || '',
                        bio: user.bio || '',
                        profilePicture: user.profilePicture || ''
                    }
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// Get User Favorites
router.get('/favorites', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('savedCars');
        res.json(user.savedCars.filter(car => car));
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Add/Remove Favorite
router.post('/favorites/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const carId = req.params.id;

        // Check if already in favorites
        if (user.savedCars.includes(carId)) {
            // Remove
            user.savedCars = user.savedCars.filter(id => id.toString() !== carId);
        } else {
            // Add
            user.savedCars.push(carId);
        }

        await user.save();
        res.json(user.savedCars);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get all users (Admin only)
router.get('/users', auth, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/* ---------------- PROFILE & PASSWORD SETTINGS ---------------- */

// Get current user profile
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            bio: user.bio || '',
            profilePicture: user.profilePicture || '',
            role: user.role
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Upload avatar profile picture
router.post('/upload-avatar', [auth, upload.single('avatar')], async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }
        const url = `http://localhost:5001/uploads/${req.file.filename}`;
        res.json({ url });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Update profile details
router.put('/profile', auth, async (req, res) => {
    const { name, phone, bio, profilePicture } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (name) user.name = name;
        if (phone !== undefined) user.phone = phone;
        if (bio !== undefined) user.bio = bio;
        if (profilePicture !== undefined) user.profilePicture = profilePicture;

        await user.save();

        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            bio: user.bio || '',
            profilePicture: user.profilePicture || '',
            role: user.role
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Change Password (authenticated)
router.post('/change-password', auth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Incorrect current password' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ msg: 'Password changed successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Forgot Password - Request Code
router.post('/forgot-password', customRateLimiter(5 * 60 * 1000, 3, 'Too many password reset requests from this IP. Please try again after 5 minutes.'), async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'No account with that email address exists' });
        }

        // Generate 6-digit numeric OTP code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetPasswordCode = code;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 mins expiry
        await user.save();

        console.log(`[DEV MODE] Forgot Password Reset Code for ${email} is: ${code}`);

        res.json({ 
            msg: 'Verification code sent to your email (Mocked)', 
            devCode: code 
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Verify Reset Code
router.post('/verify-reset-code', async (req, res) => {
    const { email, code } = req.body;
    try {
        const user = await User.findOne({ 
            email, 
            resetPasswordCode: code,
            resetPasswordExpires: { $gt: Date.now() }
        });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid or expired verification code' });
        }

        res.json({ msg: 'Code verified successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Reset Password with Code
router.post('/reset-password', async (req, res) => {
    const { email, code, newPassword } = req.body;
    try {
        const user = await User.findOne({ 
            email, 
            resetPasswordCode: code,
            resetPasswordExpires: { $gt: Date.now() }
        });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid or expired verification code' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetPasswordCode = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.json({ msg: 'Password reset successful' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Google Sign-In Login / Register
router.post('/google-login', async (req, res) => {
    const { credential } = req.body;
    if (!credential) {
        return res.status(400).json({ msg: 'No credential token supplied' });
    }

    try {
        // Verify with Google's API
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        if (!verifyRes.ok) {
            return res.status(400).json({ msg: 'Google token verification failed' });
        }

        const googlePayload = await verifyRes.json();
        const { email, name, picture, sub, aud } = googlePayload;

        // Verify audience matches our Client ID
        const ourClientId = process.env.GOOGLE_CLIENT_ID;
        if (aud !== ourClientId) {
            return res.status(400).json({ msg: 'Token audience does not match client ID' });
        }

        // Find or create user
        let user = await User.findOne({ email });
        if (!user) {
            // Create user
            // Generate a random secure password for standard login fallback
            const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(randomPassword, salt);

            user = new User({
                name: name || 'Google User',
                email: email,
                password: hashedPassword,
                profilePicture: picture || '',
                role: 'user'
            });

            await user.save();
            console.log(`Created new Google user: ${email}`);
        } else {
            // Update profile picture if user doesn't have one
            if (!user.profilePicture && picture) {
                user.profilePicture = picture;
                await user.save();
            }
        }

        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5d' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        phone: user.phone || '',
                        bio: user.bio || '',
                        profilePicture: user.profilePicture || ''
                    }
                });
            }
        );

    } catch (err) {
        console.error('Google Auth Error:', err.message);
        res.status(500).json({ msg: 'Server error during Google auth' });
    }
});

export default router;
