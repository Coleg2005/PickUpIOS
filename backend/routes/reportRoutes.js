import express from 'express';
import mongoose from 'mongoose';
import Report, { REPORT_REASONS } from '../models/Report.js';
import User from '../models/User.js';
import Game from '../models/Game.js';
import GameMessage from '../models/GameMessage.js';
import Notification from '../models/Notification.js';
import { requireAuth, requireModerator } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// ─── Reporting ───────────────────────────────────────────────────────────────

// Create a report. The reported user is derived server-side from the content
// so a client can't attribute someone else's content to an innocent user.
router.post('/', async (req, res) => {
  try {
    const { reportedUser, contentType, contentId, reason, details } = req.body;

    if (!['user', 'game', 'message'].includes(contentType)) {
      return res.status(400).json({ error: 'contentType must be user, game, or message' });
    }
    if (!REPORT_REASONS.includes(reason)) {
      return res.status(400).json({ error: 'Invalid report reason' });
    }
    if (details && (typeof details !== 'string' || details.length > 1000)) {
      return res.status(400).json({ error: 'Details must be under 1000 characters' });
    }

    let targetUserId;
    let snapshot = '';

    if (contentType === 'user') {
      if (!isValidId(reportedUser)) {
        return res.status(400).json({ error: 'reportedUser is required' });
      }
      targetUserId = reportedUser;
    } else if (contentType === 'game') {
      if (!isValidId(contentId)) {
        return res.status(400).json({ error: 'contentId is required' });
      }
      const game = await Game.findById(contentId);
      if (!game) return res.status(404).json({ error: 'Game not found' });
      targetUserId = game.leader.toString();
      snapshot = `${game.name} — ${game.description || 'no description'}`;
    } else {
      if (!isValidId(contentId)) {
        return res.status(400).json({ error: 'contentId is required' });
      }
      const message = await GameMessage.findById(contentId);
      if (!message) return res.status(404).json({ error: 'Message not found' });
      targetUserId = message.userId.toString();
      snapshot = message.message;
    }

    if (targetUserId === req.userId) {
      return res.status(400).json({ error: 'You cannot report yourself' });
    }

    const target = await User.findById(targetUserId, '_id');
    if (!target) return res.status(404).json({ error: 'Reported user not found' });

    // One open report per reporter per target/content
    const existing = await Report.findOne({
      reporter: req.userId,
      reportedUser: targetUserId,
      contentType,
      contentId: contentId || null,
      status: 'pending',
    });
    if (existing) {
      return res.status(400).json({ error: 'You have already reported this' });
    }

    const report = new Report({
      reporter: req.userId,
      reportedUser: targetUserId,
      contentType,
      contentId: contentId || null,
      contentSnapshot: snapshot.slice(0, 2000),
      reason,
      details: details || '',
    });
    await report.save();

    res.status(201).json({ message: 'Report submitted. Our moderators will review it.' });
  } catch (err) {
    console.error('Create report error:', err);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

// ─── Blocking ────────────────────────────────────────────────────────────────

router.get('/block', async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('blockedUsers', '_id username profile');
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Filter nulls left by blocked accounts that were deleted before
    // delete-account started pulling the deleted user from block lists
    res.json((user.blockedUsers || []).filter(Boolean));
  } catch {
    res.status(500).json({ error: 'Failed to get blocked users' });
  }
});

// Blocking also severs any existing friendship and pending friend requests.
router.post('/block/:userid', async (req, res) => {
  try {
    const { userid } = req.params;
    if (!isValidId(userid)) return res.status(400).json({ error: 'Invalid user id' });
    if (userid === req.userId) return res.status(400).json({ error: 'You cannot block yourself' });

    const target = await User.findById(userid, '_id');
    if (!target) return res.status(404).json({ error: 'User not found' });

    await User.updateOne({ _id: req.userId }, {
      $addToSet: { blockedUsers: target._id },
      $pull: { friends: target._id },
    });
    await User.updateOne({ _id: target._id }, { $pull: { friends: req.userId } });
    await Notification.deleteMany({
      type: 'friend-request',
      $or: [
        { recipient: req.userId, object: target._id },
        { recipient: target._id, object: req.userId },
      ],
    });

    res.json({ message: 'User blocked' });
  } catch (err) {
    console.error('Block user error:', err);
    res.status(500).json({ error: 'Failed to block user' });
  }
});

router.delete('/block/:userid', async (req, res) => {
  try {
    const { userid } = req.params;
    if (!isValidId(userid)) return res.status(400).json({ error: 'Invalid user id' });
    await User.updateOne({ _id: req.userId }, { $pull: { blockedUsers: userid } });
    res.json({ message: 'User unblocked' });
  } catch {
    res.status(500).json({ error: 'Failed to unblock user' });
  }
});

// ─── Moderation (moderators/admins only) ─────────────────────────────────────

const admin = express.Router();
admin.use(requireModerator);

admin.get('/reports', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && ['pending', 'resolved', 'dismissed'].includes(status)) {
      filter.status = status;
    }
    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('reporter', '_id username')
      .populate('reportedUser', '_id username isBanned')
      .populate('resolvedBy', '_id username');
    res.json(reports);
  } catch {
    res.status(500).json({ error: 'Failed to get reports' });
  }
});

admin.patch('/reports/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, moderatorNote } = req.body;
    if (!isValidId(reportId)) return res.status(400).json({ error: 'Invalid report id' });
    if (!['resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'status must be resolved or dismissed' });
    }
    if (moderatorNote && (typeof moderatorNote !== 'string' || moderatorNote.length > 1000)) {
      return res.status(400).json({ error: 'Note must be under 1000 characters' });
    }

    const report = await Report.findByIdAndUpdate(
      reportId,
      { status, moderatorNote: moderatorNote || '', resolvedBy: req.userId, resolvedAt: new Date() },
      { new: true }
    );
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json(report);
  } catch {
    res.status(500).json({ error: 'Failed to update report' });
  }
});

admin.post('/ban/:userid', async (req, res) => {
  try {
    const { userid } = req.params;
    const { reason } = req.body;
    if (!isValidId(userid)) return res.status(400).json({ error: 'Invalid user id' });
    if (userid === req.userId) return res.status(400).json({ error: 'You cannot ban yourself' });

    const target = await User.findById(userid, 'role');
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target.role === 'admin' || (target.role === 'moderator' && req.userRole !== 'admin')) {
      return res.status(403).json({ error: 'Cannot ban this user' });
    }

    // Clear push tokens so banned accounts stop receiving notifications
    await User.updateOne({ _id: userid }, {
      $set: { isBanned: true, banReason: typeof reason === 'string' ? reason.slice(0, 500) : '', pushTokens: [] },
    });
    res.json({ message: 'User banned' });
  } catch (err) {
    console.error('Ban user error:', err);
    res.status(500).json({ error: 'Failed to ban user' });
  }
});

admin.post('/unban/:userid', async (req, res) => {
  try {
    const { userid } = req.params;
    if (!isValidId(userid)) return res.status(400).json({ error: 'Invalid user id' });
    await User.updateOne({ _id: userid }, { $set: { isBanned: false, banReason: '' } });
    res.json({ message: 'User unbanned' });
  } catch {
    res.status(500).json({ error: 'Failed to unban user' });
  }
});

// Remove an offending chat message
admin.delete('/message/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    if (!isValidId(messageId)) return res.status(400).json({ error: 'Invalid message id' });
    const deleted = await GameMessage.findByIdAndDelete(messageId);
    if (!deleted) return res.status(404).json({ error: 'Message not found' });
    res.json({ message: 'Message deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Remove an offending game (and its chat history)
admin.delete('/game/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    if (!isValidId(gameId)) return res.status(400).json({ error: 'Invalid game id' });
    const deleted = await Game.findByIdAndDelete(gameId);
    if (!deleted) return res.status(404).json({ error: 'Game not found' });
    await GameMessage.deleteMany({ gameId });
    await Notification.deleteMany({ object: gameId });
    res.json({ message: 'Game deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete game' });
  }
});

router.use('/admin', admin);

export default router;
