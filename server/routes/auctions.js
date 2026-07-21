import express from 'express';
import Auction from '../models/Auction.js';
import Car from '../models/Car.js';
import auth from '../middleware/auth.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Get auctions with optional status filtering
router.get('/', auth, async (req, res) => {
    try {
        const status = req.query.status || 'active';
        const auctions = await Auction.find({ status }).sort({ createdAt: -1 });
        res.json(auctions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single auction by carId or auctionId
router.get('/:id', async (req, res) => {
    try {
        const auction = await Auction.findOne({ 
            $or: [{ _id: req.params.id }, { carId: req.params.id }] 
        }).populate('bids.user', 'name email');
        
        if (!auction) return res.status(404).json({ message: 'Auction not found' });
        res.json(auction);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Place a bid
router.post('/:id/bid', auth, async (req, res) => {
    try {
        const { amount } = req.body;
        const auction = await Auction.findOne({ 
            $or: [{ _id: req.params.id }, { carId: req.params.id }] 
        });

        if (!auction) return res.status(404).json({ message: 'Auction not found' });

        if (auction.status === 'sold' || auction.status === 'ended') {
            return res.status(400).json({ message: 'This auction has already ended' });
        }

        if (auction.endTime && new Date() > new Date(auction.endTime)) {
            return res.status(400).json({ message: 'This auction has expired' });
        }

        // User can bid anything above the starting price (minBid)
        if (amount < auction.minBid) {
            return res.status(400).json({ message: `Bid must be at least PKR ${auction.minBid.toLocaleString()}` });
        }

        auction.bids.push({
            user: req.user.id,
            amount: amount,
            time: new Date()
        });
        
        // Update currentBid to show the highest so far, but keep all records
        if (amount > auction.currentBid) {
            auction.currentBid = amount;
        }

        await auction.save();

        // Emit Socket.io Event for Real-time bidding update
        const io = req.app.get('io');
        if (io) {
            io.to(auction.carId.toString()).emit('bid_placed', {
                auctionId: auction._id,
                carId: auction.carId,
                currentBid: auction.currentBid,
                bids: auction.bids
            });
        }

        res.json(auction);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Accept a specific bid (Seller only)
router.post('/:auctionId/accept-bid/:bidId', auth, async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.auctionId);
        if (!auction) return res.status(404).json({ message: 'Auction not found' });

        const bid = auction.bids.id(req.params.bidId);
        if (!bid) return res.status(404).json({ message: 'Bid not found' });

        auction.status = 'sold';
        auction.currentBid = bid.amount; // The accepted price
        await auction.save();

        await Car.findByIdAndUpdate(auction.carId, { status: 'sold', user: bid.user });

        // Save a notification for the bidder
        const notification = new Notification({
            user: bid.user,
            message: `Congratulations! Your bid of PKR ${bid.amount.toLocaleString()} on "${auction.title}" has been accepted! The vehicle has been transferred to your inventory.`
        });
        await notification.save();

        res.json({ message: 'Bid accepted and car marked as SOLD', acceptedBid: bid });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

export default router;
