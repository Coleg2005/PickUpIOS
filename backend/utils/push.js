import { Expo } from 'expo-server-sdk';
import User from '../models/User.js';

const expo = new Expo();

// Sends a push notification to one or more Expo push tokens.
// Silently skips invalid tokens and swallows send errors so a failed push never breaks the calling route.
export const sendPushNotifications = async (tokens, title, body, data = {}) => {
  const validTokens = (tokens || []).filter((t) => Expo.isExpoPushToken(t));
  if (validTokens.length === 0) return;

  const messages = validTokens.map((to) => ({ to, sound: 'default', title, body, data }));
  const chunks = expo.chunkPushNotifications(messages);

  // Tokens Expo reports as uninstalled/logged-out devices; tickets come back
  // in the same order as the messages in the chunk.
  const deadTokens = [];
  for (const chunk of chunks) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      tickets.forEach((ticket, i) => {
        if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
          deadTokens.push(chunk[i].to);
        }
      });
    } catch (error) {
      console.error('Error sending push notification chunk:', error);
    }
  }

  if (deadTokens.length > 0) {
    try {
      await User.updateMany({ pushTokens: { $in: deadTokens } }, { $pull: { pushTokens: { $in: deadTokens } } });
    } catch (error) {
      console.error('Error pruning dead push tokens:', error);
    }
  }
};
