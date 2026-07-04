import './config/env.js'; // MUST be first: loads + validates env before anything else
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import http from 'http';
import { Server } from 'socket.io';
import registerSocketHandlers from './socket.js';
import path from 'path';

import authRoutes from './routes/authRoutes.js';
import friendRoutes from './routes/friendRoutes.js';
import gameRoutes from './routes/gameRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import inboxRoutes from './routes/inboxRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import { startRecurrenceJob } from './utils/recurrence.js';

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
// Behind nginx/reverse proxy — needed so rate limiting sees real client IPs
app.set('trust proxy', 1);
const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: '*'},
});
registerSocketHandlers(io);

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '100kb' }));

// Strict limit on credential endpoints to slow brute-force attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later' },
});

// General API limit
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(apiLimiter);
app.use('/auth/login', authLimiter);
app.use('/auth/register', authLimiter);
app.use('/auth/forgot-password', authLimiter);
app.use('/auth/reset-password', authLimiter);

app.use('/uploads', express.static(path.join('/var/www/uploads')));
app.use("/inbox", inboxRoutes);
app.use("/upload", uploadRoutes);
app.use('/auth', authRoutes);
app.use('/friend', friendRoutes);
app.use('/game', gameRoutes);
app.use('/profile', profileRoutes);
app.use('/message', messageRoutes);
app.use('/report', reportRoutes);
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
  console.error("❌ MONGO_URI is missing");
  process.exit(1);
}

mongoose.connect(mongoURI)
  .then(() => {
    console.log('Connected to MongoDB');
    startRecurrenceJob();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const PORT = process.env.PORT || 3000;
const hostname = '0.0.0.0';

server.listen(PORT, () => {
  console.log(`Server running at http://${hostname}:${PORT}`);
}); 
