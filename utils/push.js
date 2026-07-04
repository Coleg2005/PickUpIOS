import { Expo } from 'expo-server-sdk';

const expo = new Expo();

// Sends a push notification to one or more Expo push tokens.
// Silently skips invalid tokens and swallows send errors so a failed push never breaks the calling route.
export const sendPushNotifications = async (tokens, title, body, data = {}) => {
  const validTokens = (tokens || []).filter((t) => Expo.isExpoPushToken(t));
  if (validTokens.length === 0) return;

  const messages = validTokens.map((to) => ({ to, sound: 'default', title, body, data }));
  const chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (error) {
      console.error('Error sending push notification chunk:', error);
    }
  }
};
