// utils/auth.ts
import * as SecureStore from 'expo-secure-store';
import { unregisterPushToken } from './api';

export const logout = async () => {
  // Unregister the push token first — the call authenticates with the JWT we're about to delete
  const pushToken = await SecureStore.getItemAsync('pushToken');
  if (pushToken) {
    await unregisterPushToken(pushToken);
    await SecureStore.deleteItemAsync('pushToken');
  }
  await SecureStore.deleteItemAsync('token');
  await SecureStore.deleteItemAsync('username');
  await SecureStore.deleteItemAsync('_id');
};

export default logout;
