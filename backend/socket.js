import jwt from 'jsonwebtoken';
import GameMessage from './models/GameMessage.js';
import Game from './models/Game.js';
import User from './models/User.js';
import { SECRET } from './middleware/auth.js';
import { sendPushNotifications } from './utils/push.js';

export default function registerSocketHandlers(io) {
  // Reject unauthenticated (or banned) socket connections
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, SECRET);
      const user = await User.findById(decoded._id, 'isBanned').lean();
      if (!user) return next(new Error('Account no longer exists'));
      if (user.isBanned) return next(new Error('Account suspended'));
      socket.userId = decoded._id;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    // Personal room so game broadcasts can exclude this user's sockets when
    // they've blocked the sender (see the .except() below and messageRoutes)
    socket.join(`user:${socket.userId}`);

    socket.on('join-game', async (gameId) => {
      try {
        const game = await Game.findById(gameId);
        const isMember = game && game.gameMembers.some((m) => (m._id || m).toString() === socket.userId);
        if (isMember) socket.join(gameId);
      } catch {}
    });

    socket.on('send-message', async (data) => {
      try {
        if (!data?.gameId || !data?.message || typeof data.message !== 'string' || data.message.length > 2000) return;

        // Sender identity comes from the verified token, never from the client payload
        const game = await Game.findById(data.gameId).populate('gameMembers', 'pushTokens blockedUsers');
        const isMember = game && game.gameMembers.some((m) => m._id.toString() === socket.userId);
        if (!isMember) return;

        // Members who blocked the sender get neither the live message nor a push
        const blockers = new Set(
          game.gameMembers
            .filter((m) => (m.blockedUsers || []).some((b) => b.toString() === socket.userId))
            .map((m) => m._id.toString())
        );

        const sender = await User.findById(socket.userId, 'username');
        const messageDoc = {
          gameId: data.gameId,
          userId: socket.userId,
          username: sender?.username || 'unknown',
          message: data.message,
          timestamp: new Date(),
          messageType: 'text',
        };

        // Save before emitting so clients receive the _id (needed for reporting)
        const message = new GameMessage(messageDoc);
        await message.save();
        io.to(data.gameId).except([...blockers].map((id) => `user:${id}`)).emit('new-message', message);

        const recipients = game.gameMembers.filter((m) => m._id.toString() !== socket.userId && !blockers.has(m._id.toString()));
        const tokens = recipients.flatMap((m) => m.pushTokens || []);
        sendPushNotifications(tokens, messageDoc.username, messageDoc.message, { type: 'game-message', gameId: data.gameId });
      } catch (err) {
        console.error('send-message error:', err);
      }
    });

    socket.on('disconnect', () => {
    });
  });
}
