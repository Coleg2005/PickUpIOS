import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Game from '../models/Game.js';
import GameMessage from '../models/GameMessage.js';
import Notification from '../models/Notification.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { requireAuth, SECRET } from '../middleware/auth.js';
import { deleteImageByUrl } from '../config/cloudinary.js';
const router = express.Router();

const TOKEN_EXPIRY = '7d';
const MIN_PASSWORD_LENGTH = 8;
// Letters, digits, dot, underscore, hyphen; 3-20 chars. Only enforced on NEW
// registrations — some legacy accounts (e.g. 1-char names) predate this rule
// and must still be able to log in.
const USERNAME_RE = /^[a-zA-Z0-9._-]{3,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Escape regex metacharacters so user input can't inject patterns (ReDoS)
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Usernames are matched case-insensitively (exact string, any casing) so
// "Cole" can log in as "cole" and nobody can register a look-alike name.
const usernameFilter = (username) => ({
  username: { $regex: `^${escapeRegex(username)}$`, $options: 'i' },
});

// Email service setup (configure with your email provider)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const RESET_TOKEN_EXPIRY = 15 * 60 * 1000; // 15 minutes

// Reset tokens are stored hashed (like passwords) so a database leak doesn't
// hand out live password-reset links. The plaintext token only ever exists in
// the email we send.
const hashResetToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

// ─── DEV / PROD CONFIG ────────────────────────────────────────────────────────
const IS_DEV = process.env.NODE_ENV !== 'production';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
// DEV:  exp://YOUR_LOCAL_IP:8081/--  (Expo Go)
// PROD: pickup2:/
const DEEP_LINK_BASE = IS_DEV
  ? process.env.EXPO_GO_URL || 'exp://localhost:8081/--'
  : 'pickup2:/';
// ─────────────────────────────────────────────────────────────────────────────

router.post('/register', async (req, res) => {
  try {
    let { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ ok: false, error: 'username, email, and password are required' });
    }

    username = String(username).trim();
    email = String(email).trim().toLowerCase();

    if (!USERNAME_RE.test(username)) {
      return res.status(400).json({ ok: false, error: 'Username must be 3-20 characters using only letters, numbers, dots, underscores, or hyphens' });
    }

    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ ok: false, error: 'Please enter a valid email address' });
    }

    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ ok: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    }

    if (await User.findOne(usernameFilter(username))) {
      return res.status(400).json({ ok: false, error: 'Username already taken' });
    }

    if (await User.findOne({ email })) {
      return res.status(400).json({ ok: false, error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ _id: user._id }, SECRET, { expiresIn: TOKEN_EXPIRY });
    return res.json({ ok: true, message: 'Registered successfully', token });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ ok: false, error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ ok: false, error: 'username and password are required' });
    }

    const user = await User.findOne(usernameFilter(String(username).trim()));

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    }

    if (user.isBanned) {
      return res.status(403).json({ ok: false, error: 'Your account has been suspended' });
    }

    const token = jwt.sign({ _id: user._id }, SECRET, { expiresIn: TOKEN_EXPIRY });
    return res.json({ ok: true, token });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ ok: false, error: 'Login failed' });
  }
});

router.get('/user/:id', requireAuth, async (req, res) => {

  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'userid are required' });
  }

  // Never expose password hash, reset tokens, push tokens, or email to other users.
  // role and blockedUsers are only returned when a user fetches themself.
  const isSelf = req.userId === id;
  const projection = isSelf
    ? '_id username profile friends createdAt role blockedUsers'
    : '_id username profile friends createdAt';
  const user = await User.findOne({ _id: id }, projection);

  if (!user) {
    return res.status(404).json({ error: 'Could not find User' });
  }
  res.json({ user });
});

router.get('/protected', requireAuth, (req, res) => {
  res.json({ message: 'Protected content', user: { _id: req.userId } });
});

// Search users by username
router.get('/search', requireAuth, async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ ok: false, error: 'username query is required' });

  try {
    // Escape regex metacharacters so user input can't inject patterns (ReDoS)
    const escaped = String(username).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const users = await User.find(
      { username: { $regex: escaped, $options: 'i' } },
      '_id username profile'
    ).limit(10);
    return res.json({ ok: true, users });
  } catch (error) {
    return res.status(500).json({ ok: false, error: 'Search failed' });
  }
});

// Forgot Password - Generate reset token and send email
router.post('/forgot-password', async (req, res) => {
  let { email } = req.body;

  if (!email) {
    return res.status(400).json({ ok: false, error: 'Email is required' });
  }
  email = String(email).trim().toLowerCase();

  try {
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if email exists (security best practice)
      return res.json({ ok: true, message: 'If email exists, reset link has been sent.' });
    }

    // Generate reset token; only the hash is persisted
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = hashResetToken(resetToken);
    user.resetTokenExpiry = new Date(Date.now() + RESET_TOKEN_EXPIRY);
    await user.save();

    // Send email with an HTTP link to a backend redirect page
    const resetLink = `${BACKEND_URL}/auth/reset-redirect?token=${resetToken}&email=${encodeURIComponent(email)}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Click the button below to reset your password:</p>
        <a href="${resetLink}" style="background-color: #007AFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px;">
          Reset Password
        </a>
        <p>This link expires in 15 minutes.</p>
        <p>If you didn't request this, ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.json({ ok: true, message: 'If email exists, reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ ok: false, error: 'Failed to process reset request' });
  }
});

// Reset redirect page - serves an HTML page that opens the deep link
router.get('/reset-redirect', (req, res) => {
  const { token, email } = req.query;

  if (!token || !email) {
    return res.status(400).send('<h2>Invalid reset link.</h2>');
  }

  const deepLink = `${DEEP_LINK_BASE}/(auth)/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

  res.send(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Reset Password</title>
    <style>
      body { font-family: -apple-system, sans-serif; background: #f5f5f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
      .card { background: white; border-radius: 16px; padding: 40px 32px; text-align: center; max-width: 360px; width: 90%; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
      h2 { margin: 0 0 12px; font-size: 24px; color: #111; }
      p { color: #666; font-size: 15px; margin: 0 0 28px; }
      a.btn { display: inline-block; background: #007AFF; color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 17px; font-weight: 600; }
      a.btn:hover { background: #005ecb; }
    </style>
  </head>
  <body>
    <div class="card">
      <h2>Reset Your Password</h2>
      <p>Tap the button below to open the PickUp app and set a new password.</p>
      <a class="btn" href="${deepLink}">Open PickUp App</a>
    </div>
    <script>
      // Auto-open the deep link on page load
      window.location.href = "${deepLink}";
    </script>
  </body>
</html>`);
});

// Friend invite link - public page (shared via SMS etc.) that deep-links to
// the sender's profile in the app so the recipient can add them as a friend
router.get('/invite-redirect', async (req, res) => {
  const { userid } = req.query;

  if (!userid || !mongoose.Types.ObjectId.isValid(String(userid))) {
    return res.status(400).send('<h2>Invalid invite link.</h2>');
  }

  const user = await User.findById(userid, 'username').lean();
  if (!user) {
    return res.status(404).send('<h2>This invite link is no longer valid.</h2>');
  }

  // Escape so a username can't inject HTML into the page
  const safeUsername = String(user.username).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const deepLink = `${DEEP_LINK_BASE}/(tabs)/pages/user/${encodeURIComponent(String(userid))}`;

  res.send(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Join ${safeUsername} on PickUp</title>
    <style>
      body { font-family: -apple-system, sans-serif; background: #f5f5f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
      .card { background: white; border-radius: 16px; padding: 40px 32px; text-align: center; max-width: 360px; width: 90%; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
      h2 { margin: 0 0 12px; font-size: 24px; color: #111; }
      p { color: #666; font-size: 15px; margin: 0 0 28px; }
      a.btn { display: inline-block; background: #007AFF; color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 17px; font-weight: 600; }
      a.btn:hover { background: #005ecb; }
    </style>
  </head>
  <body>
    <div class="card">
      <h2>${safeUsername} invited you to PickUp</h2>
      <p>Tap the button below to open the app and add ${safeUsername} as a friend. Don't have the app yet? Download PickUp first, then come back to this link.</p>
      <a class="btn" href="${deepLink}">Open PickUp App</a>
    </div>
    <script>
      // Auto-open the deep link on page load
      window.location.href = "${deepLink}";
    </script>
  </body>
</html>`);
});

// Reset Password - Validate token and update password
router.post('/reset-password', async (req, res) => {
  let { email, token, newPassword } = req.body;

  if (!email || !token || !newPassword) {
    return res.status(400).json({ ok: false, error: 'Email, token, and new password are required' });
  }
  email = String(email).trim().toLowerCase();

  if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ ok: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ ok: false, error: 'User not found' });
    }

    // Check token validity (stored value is the sha256 of the emailed token)
    if (!user.resetToken || user.resetToken !== hashResetToken(String(token))) {
      return res.status(400).json({ ok: false, error: 'Invalid reset token' });
    }

    if (!user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
      return res.status(400).json({ ok: false, error: 'Reset token expired' });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    return res.json({ ok: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ ok: false, error: 'Failed to reset password' });
  }
});

// Register a device's Expo push token (always for the authenticated user)
router.post('/push-token', requireAuth, async (req, res) => {
  const { token } = req.body;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ ok: false, error: 'token is required' });
  }

  try {
    await User.updateOne({ _id: req.userId }, { $addToSet: { pushTokens: token } });
    return res.json({ ok: true });
  } catch (error) {
    console.error('Register push token error:', error);
    return res.status(500).json({ ok: false, error: 'Failed to register push token' });
  }
});

// Unregister a device's Expo push token (e.g. on logout)
router.delete('/push-token', requireAuth, async (req, res) => {
  const { token } = req.body;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ ok: false, error: 'token is required' });
  }

  try {
    await User.updateOne({ _id: req.userId }, { $pull: { pushTokens: token } });
    return res.json({ ok: true });
  } catch (error) {
    console.error('Unregister push token error:', error);
    return res.status(500).json({ ok: false, error: 'Failed to unregister push token' });
  }
});

// Delete Account
router.delete('/delete-account', requireAuth, async (req, res) => {
  const userId = req.userId;

  try {
    // Remove user from all friends lists and block lists
    await User.updateMany({ friends: userId }, { $pull: { friends: userId } });
    await User.updateMany({ blockedUsers: userId }, { $pull: { blockedUsers: userId } });

    // Delete all games they lead (and their messages)
    const ledGames = await Game.find({ leader: userId }, '_id');
    const ledGameIds = ledGames.map(g => g._id);
    await Game.deleteMany({ leader: userId });
    await GameMessage.deleteMany({ gameId: { $in: ledGameIds } });

    // Remove user from games they were a member of
    await Game.updateMany({ gameMembers: userId }, { $pull: { gameMembers: userId } });

    // Anonymise their messages in other games
    await GameMessage.updateMany({ userId }, { $set: { username: '[deleted]' } });

    // Delete notifications they received or triggered
    await Notification.deleteMany({ recipient: userId });
    await Notification.deleteMany({ object: userId });

    // Delete the user, then their profile picture in Cloudinary (fail-soft)
    const deletedUser = await User.findByIdAndDelete(userId);
    await deleteImageByUrl(deletedUser?.profile?.picture);

    return res.json({ ok: true });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({ ok: false, error: 'Failed to delete account' });
  }
});

export default router;