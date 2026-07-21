import Auction from '../models/Auction.js';
import Car from '../models/Car.js';
import Notification from '../models/Notification.js';

/**
 * Periodically checks for expired auctions and resolves them
 */
export const resolveExpiredAuctions = async () => {
    try {
        const now = new Date();
        // Find all active auctions whose endTime has passed
        const expiredAuctions = await Auction.find({
            status: 'active',
            endTime: { $lte: now }
        });

        if (expiredAuctions.length === 0) return;

        console.log(`[Scheduler] Found ${expiredAuctions.length} expired auctions to resolve.`);

        for (const auction of expiredAuctions) {
            console.log(`[Scheduler] Resolving auction: "${auction.title}" (ID: ${auction._id})`);

            if (auction.bids && auction.bids.length > 0) {
                // Sort bids descending to get the highest one
                const sortedBids = [...auction.bids].sort((a, b) => b.amount - a.amount);
                const highestBid = sortedBids[0];

                // 1. Mark auction as sold
                auction.status = 'sold';
                auction.currentBid = highestBid.amount;
                await auction.save();

                // 2. Mark car as sold and transfer user ownership to the winning bidder
                await Car.findByIdAndUpdate(auction.carId, { status: 'sold', user: highestBid.user });

                // 3. Notify the winning bidder
                const winnerNotification = new Notification({
                    user: highestBid.user,
                    message: `Congratulations! You won the auction for "${auction.title}" with a bid of PKR ${highestBid.amount.toLocaleString()}! The vehicle has been transferred to your inventory.`
                });
                await winnerNotification.save();

                // 4. Notify the seller
                const car = await Car.findById(auction.carId);
                if (car && car.user) {
                    const sellerNotification = new Notification({
                        user: car.user,
                        message: `Your auction for "${auction.title}" has ended. The highest bid of PKR ${highestBid.amount.toLocaleString()} was accepted automatically.`
                    });
                    await sellerNotification.save();
                }

                console.log(`[Scheduler] Resolved auction ${auction._id}: Sold to user ${highestBid.user} for PKR ${highestBid.amount}`);
            } else {
                // No bids placed. End the auction and reset the car status back to active (buy-now)
                auction.status = 'ended';
                await auction.save();

                await Car.findByIdAndUpdate(auction.carId, { status: 'active' });

                // Notify the seller
                const car = await Car.findById(auction.carId);
                if (car && car.user) {
                    const sellerNotification = new Notification({
                        user: car.user,
                        message: `Your auction for "${auction.title}" has ended with no bids placed. The listing has been returned to standard Buy-Now inventory.`
                    });
                    await sellerNotification.save();
                }

                console.log(`[Scheduler] Resolved auction ${auction._id}: Ended with no bids.`);
            }
        }
    } catch (err) {
        console.error('[Scheduler] Error in resolveExpiredAuctions:', err);
    }
};
