import express from 'express';
import User from '../models/User.js';
import Car from '../models/Car.js';
import Notification from '../models/Notification.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Subscribe / Upgrade B2B Dealer Package
router.post('/subscribe', auth, async (req, res) => {
    try {
        const { tier, showroomName, showroomSlug, paymentMethod, transactionId } = req.body;

        if (!['starter', 'pro', 'enterprise'].includes(tier)) {
            return res.status(400).json({ message: 'Invalid subscription tier' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Tier Limits & Features
        let maxLimit = 10;
        let isVerified = false;

        if (tier === 'starter') {
            maxLimit = 10;
            isVerified = false;
        } else if (tier === 'pro') {
            maxLimit = 30;
            isVerified = true;
        } else if (tier === 'enterprise') {
            maxLimit = 9999; // Unlimited
            isVerified = true;
        }

        // Format Showroom Slug
        let slug = showroomSlug || showroomName || user.name;
        slug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        if (!slug) slug = `showroom-${user._id.toString().slice(-6)}`;

        // Check if slug is unique among other users
        const existingSlugUser = await User.findOne({ dealerShowroomSlug: slug, _id: { $ne: user._id } });
        if (existingSlugUser) {
            slug = `${slug}-${Math.floor(100 + Math.random() * 900)}`;
        }

        user.dealerTier = tier;
        user.dealerShowroomName = showroomName || `${user.name} Motors`;
        user.dealerShowroomSlug = slug;
        user.isVerifiedDealer = isVerified;
        user.maxListingsLimit = maxLimit;
        user.dealerSubscriptionExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

        await user.save();

        // Send In-App Notification
        const notification = new Notification({
            user: user._id,
            message: `🎉 Congratulations! Your B2B Dealer Subscription (${tier.toUpperCase()}) has been activated via ${paymentMethod || 'Bank Wire'}. Showroom URL: /dealer/${user.dealerShowroomSlug}`
        });
        await notification.save();

        res.json({
            success: true,
            message: `Successfully subscribed to ${tier.toUpperCase()} Dealer Package!`,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                dealerTier: user.dealerTier,
                dealerShowroomName: user.dealerShowroomName,
                dealerShowroomSlug: user.dealerShowroomSlug,
                isVerifiedDealer: user.isVerifiedDealer,
                maxListingsLimit: user.maxListingsLimit,
                dealerSubscriptionExpires: user.dealerSubscriptionExpires
            }
        });
    } catch (err) {
        console.error("Dealer Subscription Error:", err);
        res.status(500).json({ message: err.message });
    }
});

// Public Showroom Page Endpoint: GET /api/dealers/:slug
router.get('/:slug', async (req, res) => {
    try {
        const slug = req.params.slug.toLowerCase();
        
        // Find dealer by slug or ID
        let dealer = await User.findOne({ dealerShowroomSlug: slug }).select('-password');
        if (!dealer && slug.match(/^[0-9a-fA-F]{24}$/)) {
            dealer = await User.findById(slug).select('-password');
        }

        if (!dealer) {
            return res.status(404).json({ message: 'Showroom not found' });
        }

        // Fetch all active cars listed by this dealer
        const cars = await Car.find({ user: dealer._id, status: 'active' }).sort({ isFeatured: -1, createdAt: -1 });

        res.json({
            dealer: {
                _id: dealer._id,
                name: dealer.name,
                email: dealer.email,
                phone: dealer.phone,
                bio: dealer.bio,
                profilePicture: dealer.profilePicture,
                dealerTier: dealer.dealerTier,
                dealerShowroomName: dealer.dealerShowroomName || `${dealer.name} Showroom`,
                dealerShowroomSlug: dealer.dealerShowroomSlug,
                isVerifiedDealer: dealer.isVerifiedDealer,
                maxListingsLimit: dealer.maxListingsLimit,
                memberSince: dealer.createdAt
            },
            totalCars: cars.length,
            cars
        });
    } catch (err) {
        console.error("Get Showroom Error:", err);
        res.status(500).json({ message: err.message });
    }
});

// Public Directory Endpoint: GET /api/dealers (List all verified showrooms)
router.get('/', async (req, res) => {
    try {
        const dealers = await User.find({
            dealerTier: { $in: ['starter', 'pro', 'enterprise'] }
        }).select('-password').sort({ isVerifiedDealer: -1, createdAt: -1 });

        res.json(dealers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
