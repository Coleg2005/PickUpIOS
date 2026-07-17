import express from 'express';
import GameMessage from '../models/GameMessage.js';
import Game from '../models/Game.js';
import User from '../models/User.js';
import { sendPushNotifications } from '../utils/push.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

const isGameMember = (game, userId) =>
  game.gameMembers.some((m) => (m._id || m).toString() === userId);

// GET all messages for a game (members only)
router.get('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const game = await Game.findById(gameId);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    if (!isGameMember(game, req.userId)) {
      return res.status(403).json({ error: 'Only game members can read messages' });
    }
    // Hide messages from users the requester has blocked
    const me = await User.findById(req.userId, 'blockedUsers').lean();
    const blocked = me?.blockedUsers || [];
    // Cap at the 200 most recent so a long-running recurring game's chat
    // doesn't grow unbounded in one response; returned oldest-first as before.
    const messages = await GameMessage.find({ gameId, userId: { $nin: blocked } })
      .sort({ timestamp: -1 })
      .limit(200);
    messages.reverse();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST a new message (members only, sender taken from the token)
router.post('/', async (req, res) => {
  try {
    const { gameId, message, messageType = 'text' } = req.body;
    if (!gameId || !message || typeof message !== 'string' || message.length > 2000) {
      return res.status(400).json({ error: 'gameId and a message under 2000 characters are required' });
    }
    // Schema requires messageType; an arbitrary value would 500 on save
    if (!['text', 'system'].includes(messageType)) {
      return res.status(400).json({ error: 'messageType must be text or system' });
    }
    const gameDoc = await Game.findById(gameId).populate('gameMembers', 'pushTokens blockedUsers');
    if (!gameDoc) return res.status(404).json({ error: 'Game not found' });
    if (!isGameMember(gameDoc, req.userId)) {
      return res.status(403).json({ error: 'Only game members can send messages' });
    }

    // Members who blocked the sender get neither the live message nor a push
    const blockers = new Set(
      gameDoc.gameMembers
        .filter((m) => (m.blockedUsers || []).some((b) => b.toString() === req.userId))
        .map((m) => m._id.toString())
    );
    const sender = await User.findById(req.userId, 'username');
    const userId = req.userId;
    const username = sender?.username || 'unknown';
    const newMessage = new GameMessage({
      gameId,
      userId,
      username,
      message,
      timestamp: new Date(),
      messageType
    });
    await newMessage.save();
    
    // If using sockets, emit here (optional)
    req.io?.to(gameId).except([...blockers].map((id) => `user:${id}`)).emit('new-message', newMessage);

    if (messageType !== 'system') {
      const recipients = gameDoc.gameMembers.filter((m) => m._id.toString() !== userId && !blockers.has(m._id.toString()));
      const tokens = recipients.flatMap((m) => m.pushTokens || []);
      sendPushNotifications(tokens, username, message, { type: 'game-message', gameId });
    }

    res.status(201).json(newMessage);
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
