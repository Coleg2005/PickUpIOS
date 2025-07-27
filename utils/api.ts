import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

export const API_BASE_URL = '10.0.0.58';

const BASE_URL = 'http://localhost:3001';


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
export const updateProfile = async (description: string, picture: string | number, userid: string) => {
  try{
    const res = await fetch(`http://${API_BASE_URL}:3000/profile/updateProfile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, picture, userid }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch(err) {
    Alert.alert('Update Profile Failed', err instanceof Error ? err.message : 'An unknown error occurred');
  }
}

// Game Message Calls
export const sendGameMessage = async (gameId: string, userId: string, message: string, messageType: 'text' | 'system' = 'text') => {
  try {
    const res = await fetch(`http://${API_BASE_URL}:3000/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, userId, message, messageType }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch (err) {
    Alert.alert('Send Message Failed', err instanceof Error ? err.message : 'An unknown error occurred');
  }
};

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

