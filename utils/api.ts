import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import { BACKEND_URL } from '@/env';

export const API_BASE_URL = BACKEND_URL || 'https://pickupiosbackend.me';

const readJsonResponse = async (res: Response) => {
  const text = await res.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
};



// Auth Calls
export const register = async (username: string, email: string, password: string) => {
  try{
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await readJsonResponse(res);
    if (!res.ok) throw new Error(data.error);

    await SecureStore.setItemAsync('token', data.token);
    return data;
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'An unknown error occurred' };
  }
}

export const login = async (username: string, password: string) => {
  try{
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await readJsonResponse(res);
    if (!res.ok) throw new Error(data.error);

    await SecureStore.setItemAsync('token', data.token);
    return data;
  } catch(err) {
    return { ok: false, error: err instanceof Error ? err.message : 'An unknown error occurred' };
  }
}

export const logout = async () => {
  try{
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('_id');
    Alert.alert('Logged out');
  } catch (err) {
    Alert.alert('Logout Failed', err instanceof Error ? err.message : 'An unknown error occurred');
  }
}

export const searchUsers = async (username: string) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/search?username=${encodeURIComponent(username)}`);
    const data = await readJsonResponse(res);
    if (!res.ok) throw new Error(data.error);
    return data.users as any[];
  } catch {
    return [];
  }
};

export const deleteAccount = async () => {
  try {
    const token = await SecureStore.getItemAsync('token');
    const res = await fetch(`${API_BASE_URL}/auth/delete-account`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await readJsonResponse(res);
    if (!res.ok) throw new Error(data.error);
    await SecureStore.deleteItemAsync('token');
    return data;
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'An unknown error occurred' };
  }
};

export const forgotPassword = async (email: string) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await readJsonResponse(res);
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'An unknown error occurred' };
  }
}

export const resetPassword = async (email: string, token: string, newPassword: string) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token, newPassword }),
    });

    const data = await readJsonResponse(res);
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'An unknown error occurred' };
  }
}

export const getUser = async (id: string) => {
  try{
    const res = await fetch(`${API_BASE_URL}/auth/user/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await readJsonResponse(res);
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch(err) {
    Alert.alert('Get User from id Failed', err instanceof Error ? err.message : 'An unknown error occurred');
  }
}

// Game Calls
export const createGame = async (name: string, date: Date, location: string, fsq_id: string, sport: string, leader: string, description: string, maxPlayers?: number | null) => {
  try{
    const res = await fetch(`${API_BASE_URL}/game`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, date, location, fsq_id, sport, leader, description, maxPlayers: maxPlayers || null }),
    });

    const data = await readJsonResponse(res);
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch(err) {
    Alert.alert('Create Game Failed', err instanceof Error ? err.message : 'An unknown error occurred');
  }
}

export const deleteGame = async (gameid: string) => {
  try{    
    const res = await fetch(`${API_BASE_URL}/game/${gameid}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await readJsonResponse(res);
    
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch(err) {
    Alert.alert('Delete Game Failed', err instanceof Error ? err.message : 'An unknown error occurred');
  }
}

export const removeGameMember = async (gameid: string, gameMember: string) => {
  try{
    const res = await fetch(`${API_BASE_URL}/game/removeMember`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameid, gameMember }),
    });

    const data = await readJsonResponse(res);
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch(err) {
    Alert.alert('Remove Game Member Failed', err instanceof Error ? err.message : 'An unknown error occurred');
  }
}

export const addGameMember = async (gameid: string, gameMember: string) => {
  try{
    const res = await fetch(`${API_BASE_URL}/game/member`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameid, gameMember }),
    });

    const data = await readJsonResponse(res);
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch(err) {
    Alert.alert('Add Game Member Failed', err instanceof Error ? err.message : 'An unknown error occurred');
  }
}

export const getActiveLocations = async (): Promise<string[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/game/active-locations`);
    const data = await readJsonResponse(res);
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch (err) {
    console.error('getActiveLocations failed:', err);
    return [];
  }
};

export const getGamesByLocations = async (fsq_ids: string[]): Promise<Record<string, any[]>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/game/by-locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fsq_ids }),
    });
    const data = await readJsonResponse(res);
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch (err) {
    console.error('getGamesByLocations failed:', err);
    return {};
  }
};

export const getGamesLoc = async (fsq_id: string) => {
  try{
    const res = await fetch(`${API_BASE_URL}/game/location/${fsq_id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });


    const data = await readJsonResponse(res);
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch(err) {
    console.error('getGamesLoc failed:', err);
    Alert.alert('Get Games Failed', err instanceof Error ? err.message : 'An unknown error occurred');
  }
}

export const searchPlaces = async ({ query, ll, radius, limit = 50 }: { query: string; ll: string; radius: number; limit?: number }) => {
  try {
    const params = new URLSearchParams({
      query,
      ll,
      radius: String(radius),
      limit: String(limit),
    });

    const res = await fetch(`${API_BASE_URL}/game/places/search?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await readJsonResponse(res);
    if (!res.ok) throw new Error(data.error);
    return data.results || [];
  } catch (err) {
    Alert.alert('Search Places Failed', err instanceof Error ? err.message : 'An unknown error occurred');
    return [];
  }
}

export const getPlace = async (placeId: string) => {
  try {
    const res = await fetch(`${API_BASE_URL}/game/places/${placeId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await readJsonResponse(res);
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch (err) {
    Alert.alert('Get Place Failed', err instanceof Error ? err.message : 'An unknown error occurred');
    return null;
  }
}

export const getGamesLead = async (id: string) => {
  try{
    const res = await fetch(`${API_BASE_URL}/game/user/lead/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch(err) {
    Alert.alert('Get Games Lead Failed', err instanceof Error ? err.message : 'An unknown error occurred');
  }
}

export const getGamesMember = async (userid: string) => {
  try{
    const res = await fetch(`${API_BASE_URL}/game/user/member/${userid}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch(err) {
    Alert.alert('Get Games Member Failed', err instanceof Error ? err.message : 'An unknown error occurred');
  }
}

export const getGameId = async (id: string) => {
  try{
    const res = await fetch(`${API_BASE_URL}/game/id/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch(err) {
    Alert.alert('Get Games id Failed', err instanceof Error ? err.message : 'An unknown error occurred');
  }
}

// Profile Calls
export const updateProfile = async (description: string | null, userid: string) => {
  try{
    const res = await fetch(`${API_BASE_URL}/profile/updateProfile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, userid }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch(err) {
    Alert.alert('Update Profile Failed', err instanceof Error ? err.message : 'An unknown error occurred');
  }
}

// Game Message Calls
export const getMessagesForGame = async (gameId: string) => {
  try {
    const res = await fetch(`${API_BASE_URL}/message/${gameId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch (err) {
    Alert.alert('Get Messages Failed', err instanceof Error ? err.message : 'An unknown error occurred');
    return [];
  }
};

// Friend Calls
export const requestFriend = async (userid: string, friendid: string) => {
  try {
    const res = await fetch(`${API_BASE_URL}/friend/request`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userid, friendid }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch (err) {
    Alert.alert('Add Friend Failed', err instanceof Error ? err.message : 'An unknown error occurred');
  }
}

export const acceptFriend = async (userid: string, friendid: string) => {
  try {
    const res = await fetch(`${API_BASE_URL}/friend/accept`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userid, friendid }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch (err) {
    Alert.alert('Add Friend Failed', err instanceof Error ? err.message : 'An unknown error occurred');
  }
}

export const removeFriend = async (userid: string, friendid: string) => {
  try {
    const res = await fetch(`${API_BASE_URL}/friend/remove`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userid, friendid }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch (err) {
    Alert.alert('Remove Friend Failed', err instanceof Error ? err.message : 'An unknown error occurred');
  }
}

export const getFriends = async (userid: string) => {
  try {
    const res = await fetch(`${API_BASE_URL}/friend/${userid}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch (err) {
    Alert.alert('Get Friends Failed', err instanceof Error ? err.message : 'An unknown error occurred');
    return [];
  }
};

// Upload Calls
export const getPfp = (userid: string): string => {
  return `${API_BASE_URL}/upload/pfp/${userid}`;
};

export const uploadPfp = async (userid: string, imageUri: string): Promise<string | null> => {
  try {
    const formData = new FormData();

    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: `profile-${Date.now()}.jpg`
    } as any);

    // Append the user ID
    formData.append('userid', userid);

    const res = await fetch(`${API_BASE_URL}/upload/`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to upload profile picture');

    return data.url; // Absolute URL of new picture
  } catch (err) {
    Alert.alert('Upload Profile Picture Failed', err instanceof Error ? err.message : 'An unknown error occurred');
    return null;
  }
};

// notification calls
export const getNotifications = async (userid: string) => {
  try {
    const res = await fetch(`${API_BASE_URL}/inbox/${userid}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch (err) {
    Alert.alert('Get Notifications Failed', err instanceof Error ? err.message : 'An unknown error occurred');
    return [];
  }
};

export const deleteNotification = async (notificationid: string) => {
  try{    
    const res = await fetch(`${API_BASE_URL}/inbox/${notificationid}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch(err) {
    Alert.alert('Delete Notification Failed', err instanceof Error ? err.message : 'An unknown error occurred');
  }
}

