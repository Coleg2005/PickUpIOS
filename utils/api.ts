import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

export const API_BASE_URL = '10.0.0.58';


// Auth Calls
export const register = async (username: string, password: string) => {
  try{
    const res = await fetch(`http://${API_BASE_URL}:3000/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    await SecureStore.setItemAsync('token', data.token);
    return data;
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'An unknown error occurred' };
  }
}

export const login = async (username: string, password: string) => {
  try{
    const res = await fetch(`http://${API_BASE_URL}:3000/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
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

export const getUser = async (id: string) => {
  try{
    const res = await fetch(`http://${API_BASE_URL}:3000/auth/user/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch(err) {
    Alert.alert('Get User from id Failed', err instanceof Error ? err.message : 'An unknown error occurred');
  }
}

// Game Calls
export const createGame = async (name: string, date: Date, location: string, fsq_id: string, sport: string, leader: string, description: string) => {
  try{
    const res = await fetch(`http://${API_BASE_URL}:3000/game`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, date, location, fsq_id, sport, leader, description }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch(err) {
    Alert.alert('Create Game Failed', err instanceof Error ? err.message : 'An unknown error occurred');
  }
}

export const deleteGame = async (gameid: string) => {
  try{    
    const res = await fetch(`http://${API_BASE_URL}:3000/game/${gameid}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch(err) {
    Alert.alert('Delete Game Failed', err instanceof Error ? err.message : 'An unknown error occurred');
  }
}

export const removeGameMember = async (gameid: string, gameMember: string) => {
  try{
    const res = await fetch(`http://${API_BASE_URL}:3000/game/removeMember`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameid, gameMember }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch(err) {
    Alert.alert('Delete Game Failed', err instanceof Error ? err.message : 'An unknown error occurred');
  }
}

export const addGameMember = async (gameid: string, gameMember: string) => {
  try{
    const res = await fetch(`http://${API_BASE_URL}:3000/game/member`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameid, gameMember }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch(err) {
    Alert.alert('Add Game Member Failed', err instanceof Error ? err.message : 'An unknown error occurred');
  }
}

export const getGamesLoc = async (fsq_id: string) => {
  try{
    const res = await fetch(`http://${API_BASE_URL}:3000/game/location/${fsq_id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });


    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch(err) {
    console.error('getGamesLoc failed:', err);
    Alert.alert('Get Games Failed', err instanceof Error ? err.message : 'An unknown error occurred');
  }
}

export const getGamesLead = async (id: string) => {
  try{
    const res = await fetch(`http://${API_BASE_URL}:3000/game/user/lead/${id}`, {
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
    const res = await fetch(`http://${API_BASE_URL}:3000/game/user/member/${userid}`, {
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
    const res = await fetch(`http://${API_BASE_URL}:3000/game/id/${id}`, {
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
    const res = await fetch(`http://${API_BASE_URL}:3000/profile/updateProfile`, {
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
    const res = await fetch(`http://${API_BASE_URL}:3000/message/${gameId}`, {
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
export const addFriend = async (userid: string, friendid: string) => {
  try {
    const res = await fetch(`http://${API_BASE_URL}:3000/friend/add`, {
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
    const res = await fetch(`http://${API_BASE_URL}:3000/friend/remove`, {
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
    const res = await fetch(`http://${API_BASE_URL}:3000/friend/${userid}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch (err) {
    Alert.alert('Get Messages Failed', err instanceof Error ? err.message : 'An unknown error occurred');
    return [];
  }
};

// Upload Calls
export const getPfp = (userid: string): string => {
  return `http://${API_BASE_URL}:3000/upload/pfp/${userid}`;
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

    const res = await fetch(`http://${API_BASE_URL}:3000/upload/`, {
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

