import { IS_PROD } from './config/env.js'; // MUST be first: loads + validates env before anything else
import * as Sentry from '@sentry/node';

// Error tracking — a no-op unless SENTRY_DSN is set, so local dev and
// environments without a Sentry account are unaffected.
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
  });
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import http from 'http';
import { Server } from 'socket.io';
import registerSocketHandlers from './socket.js';

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
// CORS only matters for browser clients; the native app sends no Origin header
// and is unaffected. Dev allows all origins (Expo web / local tools); prod
// sends no CORS headers at all, so browsers can't call the API cross-origin.
const io = new Server(server, {
  ...(IS_PROD ? {} : { cors: { origin: '*' } }),
});
registerSocketHandlers(io);

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(helmet());
if (!IS_PROD) app.use(cors()); // see CORS note above

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

// Global error handler (must be registered after all routes). Express 5
// forwards rejected async route handlers here automatically. Client errors
// (bad JSON body, oversized upload, etc.) return their real status/message;
// everything else returns a generic 500 so stack traces never leak.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: `Upload failed: ${err.message}` });
  }
  const status = err.status || err.statusCode;
  if (status >= 400 && status < 500) {
    return res.status(status).json({ error: err.message || 'Bad request' });
  }
  console.error('Unhandled route error:', err);
  Sentry.captureException(err); // no-op when Sentry isn't configured
  return res.status(500).json({ error: 'Internal server error' });
});

// One unawaited promise shouldn't take the whole server down: log and keep going.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

// After an uncaught synchronous exception the process state is unknown —
// log and exit; the platform restarts the container.
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

// App Platform sends SIGTERM on deploys/scaling: stop taking new connections,
// let in-flight requests finish, then close the DB connection.
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
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
