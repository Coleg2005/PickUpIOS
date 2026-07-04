import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { BACKEND_URL } from '@/env';

export const API_BASE_URL = BACKEND_URL || 'https://pickupiosbackend.me';

// Paths where a 401 means "wrong credentials", not "your session expired" —
// these must never trigger the auto-logout below.
const CREDENTIAL_PATHS = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];

const SESSION_EXPIRED_MESSAGE = 'SESSION_EXPIRED';

// JWTs expire after 7 days. When an authenticated request comes back 401,
// clear the stale credentials and send the user to login — otherwise every
// screen just fails forever with "Invalid or expired token" alerts.
// The flag collapses parallel failing requests into a single alert+redirect.
let handlingExpiredSession = false;
const handleExpiredSession = async () => {
  if (handlingExpiredSession) return;
  handlingExpiredSession = true;
  try {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('pushToken');
    await SecureStore.deleteItemAsync('username');
    await SecureStore.deleteItemAsync('_id');
    Alert.alert('Session expired', 'Please log in again.');
    router.replace('/(auth)/login' as any);
  } finally {
    // Small window so the burst of already-in-flight requests stays quiet
    setTimeout(() => { handlingExpiredSession = false; }, 3000);
  }
};

// Attaches the JWT to requests; returns empty when logged out (e.g. login/register)
const authHeaders = async (): Promise<Record<string, string>> => {
  const token = await SecureStore.getItemAsync('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const readJsonResponse = async (res: Response) => {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
};

// Core request helper: sends JSON with auth headers and throws on non-2xx responses.
const apiFetch = async (path: string, options: { method?: string; body?: object } = {}) => {
  const auth = await authHeaders();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers: { 'Content-Type': 'application/json', ...auth },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await readJsonResponse(res);
  if (
    res.status === 401 &&
    auth.Authorization &&
    !CREDENTIAL_PATHS.some((p) => path.startsWith(p))
  ) {
    handleExpiredSession();
    throw new Error(SESSION_EXPIRED_MESSAGE);
  }
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : 'An unknown error occurred';

// Runs a request and surfaces failures as an alert, returning a fallback value.
const withAlert = async <T>(title: string, fallback: T, run: () => Promise<T>): Promise<T> => {
  try {
    return await run();
  } catch (err) {
    // Session expiry already alerted + redirected once; don't stack alerts
    // for every request that was in flight when the session died.
    if (errorMessage(err) !== SESSION_EXPIRED_MESSAGE) {
      Alert.alert(title, errorMessage(err));
    }
    return fallback;
  }
};

// Auth Calls
export const register = async (username: string, email: string, password: string) => {
  try {
    const data = await apiFetch('/auth/register', { method: 'POST', body: { username, email, password } });
    await SecureStore.setItemAsync('token', data.token);
    return data;
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
};

export const login = async (username: string, password: string) => {
  try {
    const data = await apiFetch('/auth/login', { method: 'POST', body: { username, password } });
    await SecureStore.setItemAsync('token', data.token);
    return data;
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
};

export const deleteAccount = async () => {
  try {
    const data = await apiFetch('/auth/delete-account', { method: 'DELETE' });
    await SecureStore.deleteItemAsync('token');
    return data;
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
};

export const forgotPassword = async (email: string) => {
  try {
    return await apiFetch('/auth/forgot-password', { method: 'POST', body: { email } });
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
};

export const resetPassword = async (email: string, token: string, newPassword: string) => {
  try {
    return await apiFetch('/auth/reset-password', { method: 'POST', body: { email, token, newPassword } });
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
};

export const searchUsers = async (username: string) => {
  try {
    const data = await apiFetch(`/auth/search?username=${encodeURIComponent(username)}`);
    return data.users as any[];
  } catch {
    return [];
  }
};

export const getUser = (id: string) =>
  withAlert('Get User Failed', null, () => apiFetch(`/auth/user/${id}`));

// Game Calls
export type GameRecurrence = 'none' | 'daily' | 'every-other-day' | 'weekly';

export const createGame = (name: string, date: Date, location: string, fsq_id: string, sport: string, leader: string, description: string, maxPlayers?: number | null, recurrence: GameRecurrence = 'none') =>
  withAlert('Create Game Failed', null, () =>
    apiFetch('/game', { method: 'POST', body: { name, date, location, fsq_id, sport, leader, description, maxPlayers: maxPlayers || null, recurrence } }));

// Human-readable recurrence label, e.g. "Repeats weekly on Tuesday"
export const formatRecurrence = (recurrence?: GameRecurrence, date?: Date | string): string | null => {
  if (!recurrence || recurrence === 'none') return null;
  if (recurrence === 'daily') return 'Repeats every day';
  if (recurrence === 'every-other-day') return 'Repeats every other day';
  const weekday = date ? new Date(date).toLocaleDateString('en-US', { weekday: 'long' }) : null;
  return weekday ? `Repeats every ${weekday}` : 'Repeats weekly';
};

export const deleteGame = (gameid: string) =>
  withAlert('Delete Game Failed', null, () => apiFetch(`/game/${gameid}`, { method: 'DELETE' }));

export const removeGameMember = (gameid: string, gameMember: string) =>
  withAlert('Remove Game Member Failed', null, () =>
    apiFetch('/game/removeMember', { method: 'PATCH', body: { gameid, gameMember } }));

export const addGameMember = (gameid: string, gameMember: string) =>
  withAlert('Add Game Member Failed', null, () =>
    apiFetch('/game/member', { method: 'PATCH', body: { gameid, gameMember } }));

export const getActiveLocations = async (): Promise<string[]> => {
  try {
    return await apiFetch('/game/active-locations');
  } catch (err) {
    console.error('getActiveLocations failed:', err);
    return [];
  }
};

export const getGamesByLocations = async (fsq_ids: string[]): Promise<Record<string, any[]>> => {
  try {
    return await apiFetch('/game/by-locations', { method: 'POST', body: { fsq_ids } });
  } catch (err) {
    console.error('getGamesByLocations failed:', err);
    return {};
  }
};

export const getGamesLoc = (fsq_id: string) =>
  withAlert('Get Games Failed', null, () => apiFetch(`/game/location/${fsq_id}`));

export const searchPlaces = ({ query, ll, radius, limit = 50 }: { query: string; ll: string; radius: number; limit?: number }) =>
  withAlert('Search Places Failed', [], async () => {
    const params = new URLSearchParams({ query, ll, radius: String(radius), limit: String(limit) });
    const data = await apiFetch(`/game/places/search?${params.toString()}`);
    return data.results || [];
  });

export const getPlace = (placeId: string) =>
  withAlert('Get Place Failed', null, () => apiFetch(`/game/places/${placeId}`));

export const getGamesLead = (userid: string) =>
  withAlert('Get Games Lead Failed', null, () => apiFetch(`/game/user/lead/${userid}`));

export const getGamesMember = (userid: string) =>
  withAlert('Get Games Member Failed', null, () => apiFetch(`/game/user/member/${userid}`));

export const getGameId = (id: string) =>
  withAlert('Get Game Failed', null, () => apiFetch(`/game/id/${id}`));

export const inviteToGame = (gameid: string, friendid: string) =>
  withAlert('Invite Failed', null, () =>
    apiFetch('/game/invite', { method: 'POST', body: { gameid, friendid } }));

// Public web page that deep-links into the app on the sender's profile;
// meant to be shared over SMS or any share-sheet target
export const getFriendInviteUrl = (userid: string): string =>
  `${API_BASE_URL}/auth/invite-redirect?userid=${encodeURIComponent(userid)}`;

// Profile Calls
export const updateProfile = (description: string | null) =>
  withAlert('Update Profile Failed', null, () =>
    apiFetch('/profile/updateProfile', { method: 'PATCH', body: { description } }));

// Game Message Calls
export const getMessagesForGame = (gameId: string) =>
  withAlert('Get Messages Failed', [], () => apiFetch(`/message/${gameId}`));

// Friend Calls (the acting user is identified by the JWT on the backend)
export const requestFriend = (friendid: string) =>
  withAlert('Add Friend Failed', null, () =>
    apiFetch('/friend/request', { method: 'PATCH', body: { friendid } }));

export const acceptFriend = (friendid: string) =>
  withAlert('Add Friend Failed', null, () =>
    apiFetch('/friend/accept', { method: 'PATCH', body: { friendid } }));

export const removeFriend = (friendid: string) =>
  withAlert('Remove Friend Failed', null, () =>
    apiFetch('/friend/remove', { method: 'PATCH', body: { friendid } }));

export const getFriends = (userid: string) =>
  withAlert('Get Friends Failed', [], () => apiFetch(`/friend/${userid}`));

// Upload Calls
export const getPfp = (userid: string): string => {
  return `${API_BASE_URL}/upload/pfp/${userid}`;
};

export const uploadPfp = async (imageUri: string): Promise<string | null> => {
  try {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: `profile-${Date.now()}.jpg`,
    } as any);

    const res = await fetch(`${API_BASE_URL}/upload/`, {
      method: 'POST',
      headers: await authHeaders(),
      body: formData,
    });

    const data = await readJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'Failed to upload profile picture');
    return data.url; // Absolute URL of new picture
  } catch (err) {
    Alert.alert('Upload Profile Picture Failed', errorMessage(err));
    return null;
  }
};

// Notification Calls
export const getNotifications = (userid: string) =>
  withAlert('Get Notifications Failed', [], () => apiFetch(`/inbox/${userid}`));

export const deleteNotification = (notificationid: string) =>
  withAlert('Delete Notification Failed', null, () =>
    apiFetch(`/inbox/${notificationid}`, { method: 'DELETE' }));

// Report / Block Calls
export type ReportReason = 'harassment' | 'spam' | 'inappropriate-content' | 'impersonation' | 'other';

export const submitReport = (params: { reportedUser?: string; contentType: 'user' | 'game' | 'message'; contentId?: string; reason: ReportReason; details?: string }) =>
  withAlert('Report Failed', null, () => apiFetch('/report', { method: 'POST', body: params }));

export const blockUser = (userid: string) =>
  withAlert('Block Failed', null, () => apiFetch(`/report/block/${userid}`, { method: 'POST' }));

export const unblockUser = (userid: string) =>
  withAlert('Unblock Failed', null, () => apiFetch(`/report/block/${userid}`, { method: 'DELETE' }));

export const getBlockedUsers = () =>
  withAlert('Get Blocked Users Failed', [], () => apiFetch('/report/block'));

// Moderation Calls (moderator/admin only)
export const getReports = (status?: 'pending' | 'resolved' | 'dismissed') =>
  withAlert('Get Reports Failed', [], () =>
    apiFetch(`/report/admin/reports${status ? `?status=${status}` : ''}`));

export const resolveReport = (reportId: string, status: 'resolved' | 'dismissed', moderatorNote?: string) =>
  withAlert('Update Report Failed', null, () =>
    apiFetch(`/report/admin/reports/${reportId}`, { method: 'PATCH', body: { status, moderatorNote } }));

export const banUser = (userid: string, reason?: string) =>
  withAlert('Ban Failed', null, () =>
    apiFetch(`/report/admin/ban/${userid}`, { method: 'POST', body: { reason } }));

export const unbanUser = (userid: string) =>
  withAlert('Unban Failed', null, () =>
    apiFetch(`/report/admin/unban/${userid}`, { method: 'POST' }));

export const modDeleteMessage = (messageId: string) =>
  withAlert('Delete Message Failed', null, () =>
    apiFetch(`/report/admin/message/${messageId}`, { method: 'DELETE' }));

export const modDeleteGame = (gameId: string) =>
  withAlert('Delete Game Failed', null, () =>
    apiFetch(`/report/admin/game/${gameId}`, { method: 'DELETE' }));

// Push Notification Calls
export const registerPushToken = async (pushToken: string) => {
  try {
    return await apiFetch('/auth/push-token', { method: 'POST', body: { token: pushToken } });
  } catch (err) {
    console.error('registerPushToken failed:', err);
  }
};

export const unregisterPushToken = async (pushToken: string) => {
  try {
    return await apiFetch('/auth/push-token', { method: 'DELETE', body: { token: pushToken } });
  } catch (err) {
    console.error('unregisterPushToken failed:', err);
  }
};
