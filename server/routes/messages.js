import express from 'express';
import auth from '../middleware/auth.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

const router = express.Router();

// Get all conversations for the logged in user
router.get('/conversations', auth, async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user.id
        })
        .populate('participants', 'name email phone profilePicture bio')
        .populate({
            path: 'car',
            select: 'title price image images user'
        })
        .sort({ updatedAt: -1 });

        res.json(conversations);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Create or retrieve a conversation
router.post('/conversations', auth, async (req, res) => {
    const { sellerId, carId } = req.body;

    if (!sellerId || !carId) {
        return res.status(400).json({ msg: 'Please provide sellerId and carId' });
    }

    if (sellerId === req.user.id) {
        return res.status(400).json({ msg: 'You cannot start a conversation with yourself' });
    }

    try {
        // Find if a conversation already exists for this car and these participants
        let conversation = await Conversation.findOne({
            car: carId,
            participants: { $all: [req.user.id, sellerId] }
        })
        .populate('participants', 'name email phone profilePicture bio')
        .populate('car', 'title price image images user');

        if (conversation) {
            return res.json(conversation);
        }

        // Create new conversation
        conversation = new Conversation({
            participants: [req.user.id, sellerId],
            car: carId,
            lastMessage: 'Inquiry started'
        });

        await conversation.save();

        conversation = await Conversation.findById(conversation._id)
            .populate('participants', 'name email phone profilePicture bio')
            .populate('car', 'title price image images user');

        res.json(conversation);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get all messages for a specific conversation
router.get('/conversations/:id/messages', auth, async (req, res) => {
    try {
        // Verify user is a participant in this conversation
        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) {
            return res.status(404).json({ msg: 'Conversation not found' });
        }

        if (!conversation.participants.includes(req.user.id)) {
            return res.status(401).json({ msg: 'Not authorized to access this conversation' });
        }

        const messages = await Message.find({ conversation: req.params.id })
            .sort({ createdAt: 1 })
            .populate('sender', 'name email profilePicture');

        // Mark messages as read if the recipient is the logged in user
        await Message.updateMany(
            { conversation: req.params.id, sender: { $ne: req.user.id }, read: false },
            { $set: { read: true } }
        );

        res.json(messages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Send a message in a conversation
router.post('/conversations/:id/messages', auth, async (req, res) => {
    const { text } = req.body;

    if (!text || text.trim() === '') {
        return res.status(400).json({ msg: 'Message text cannot be empty' });
    }

    try {
        const conversation = await Conversation.findById(req.params.id).populate('participants', 'name');
        if (!conversation) {
            return res.status(404).json({ msg: 'Conversation not found' });
        }

        if (!conversation.participants.some(p => p._id.toString() === req.user.id)) {
            return res.status(401).json({ msg: 'Not authorized to post to this conversation' });
        }

        const message = new Message({
            conversation: req.params.id,
            sender: req.user.id,
            text: text
        });

        await message.save();

        // Update conversation metadata
        conversation.lastMessage = text;
        conversation.updatedAt = Date.now();
        await conversation.save();

        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'name email profilePicture');

        // Find recipient to notify them
        const recipient = conversation.participants.find(p => p._id.toString() !== req.user.id);
        const senderUser = conversation.participants.find(p => p._id.toString() === req.user.id);

        if (recipient) {
            // Create notification in database
            const notification = new Notification({
                user: recipient._id,
                message: `New message from ${senderUser.name || 'User'}: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`
            });
            await notification.save();
        }

        // Socket.io Real-time emission
        const io = req.app.get('io');
        if (io) {
            console.log(`Socket.io emitting new message to room: ${req.params.id}`);
            io.to(req.params.id).emit('new_message', populatedMessage);
        }

        res.json(populatedMessage);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

export default router;
