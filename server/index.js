import dotenv from 'dotenv';
dotenv.config();
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import jwt from 'jsonwebtoken';
import Conversation from './models/Conversation.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static('uploads'));

// Database Connection
const mongoUri = process.env.MONGO_URI;
mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 })
    .then(() => {
        const dbName = mongoose.connection.name;
        console.log(`Successfully connected to MongoDB database: "${dbName}"`);
        mongoose.connection.syncIndexes()
            .then(() => console.log('Database indexes synchronized successfully.'))
            .catch(err => console.error('Failed to synchronize database indexes:', err.message));
    })
    .catch(err => {
        console.error('MongoDB Connection Error (primary):', err.message);
        // If primary URI is not local, try fallback to local MongoDB
        if (!mongoUri.includes('127.0.0.1')) {
            console.log('Attempting fallback to local MongoDB (mongodb://127.0.0.1:27017/automarket)...');
            mongoose.connect('mongodb://127.0.0.1:27017/automarket', { serverSelectionTimeoutMS: 5000 })
                .then(() => {
                    const dbName = mongoose.connection.name;
                    console.log(`Fallback connection successful to database: "${dbName}"`);
                    mongoose.connection.syncIndexes()
                        .then(() => console.log('Database indexes synchronized successfully (fallback).'))
                        .catch(err => console.error('Failed to synchronize fallback database indexes:', err.message));
                })
                .catch(fallbackErr => {
                    console.error('Fallback MongoDB Connection Error:', fallbackErr.message);
                });
        }
    });

// Routes
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('AutoMarket API is running');
});

// Routes
import carRoutes from './routes/cars.js';
import chatRoutes from './routes/chat.js';
import auctionRoutes from './routes/auctions.js';
import notificationRoutes from './routes/notifications.js';
import messagesRoutes from './routes/messages.js';
app.use('/api/cars', carRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messagesRoutes);

// Socket.io & HTTP Server Wrap
import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Socket.io Middleware to Authenticate Connections via JWT Token
io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
        return next(new Error("Authentication error: Token missing"));
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded.user;
        next();
    } catch (err) {
        return next(new Error("Authentication error: Invalid token"));
    }
});

io.on('connection', (socket) => {
    socket.on('join_room', async (roomId) => {
        try {
            // Validate that roomId is a valid MongoDB ObjectId before querying Conversation model
            if (mongoose.Types.ObjectId.isValid(roomId)) {
                const conversation = await Conversation.findById(roomId);
                if (conversation) {
                    const buyerId = conversation.buyer ? conversation.buyer.toString() : '';
                    const sellerId = conversation.seller ? conversation.seller.toString() : '';
                    const currentUserId = socket.user?.id || '';

                    // If it is a private conversation, restrict joining to buyer/seller only
                    if (buyerId !== currentUserId && sellerId !== currentUserId) {
                        console.warn(`[Socket Security] Unauthorized attempt by user ${currentUserId} to join room ${roomId}`);
                        return; // Reject joining silently
                    }
                }
            }
            socket.join(roomId);
        } catch (err) {
            console.error("Socket join room error:", err.message);
        }
    });
});

app.set('io', io);

// Background Auction Expiry Checker (runs every 60 seconds)
import { resolveExpiredAuctions } from './services/auctionScheduler.js';
setInterval(resolveExpiredAuctions, 60000);

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
