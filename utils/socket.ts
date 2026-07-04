// services/SocketService.ts
import io, { Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from './api';

class SocketService {
  private socket: typeof Socket | null = null;
  private gameId: string | null = null;

  connect(gameId: string) {
    if (this.socket?.connected && this.gameId === gameId) {
      return this.socket;
    }

    this.disconnect();
    
    this.socket = io(`${API_BASE_URL}`, {
      // The server authenticates the handshake with the JWT and derives the user from it
      auth: (cb: (data: object) => void) => {
        SecureStore.getItemAsync('token').then((token) => cb({ token }));
      }
    });

    this.gameId = gameId;
    this.socket.emit('join-game', gameId);

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      if (this.gameId) {
        this.socket.emit('leave-game', this.gameId);
      }
      this.socket.disconnect();
      this.socket = null;
      this.gameId = null;
    }
  }

  // Sender identity and timestamp are set server-side from the authenticated socket
  sendMessage(gameId: string, message: string) {
    if (this.socket) {
      this.socket.emit('send-message', { gameId, message });
    }
  }

  onMessage(callback: (message: any) => void) {
    if (this.socket) {
      this.socket.on('new-message', callback);
    }
  }

  onUserJoined(callback: (user: any) => void) {
    if (this.socket) {
      this.socket.on('user-joined', callback);
    }
  }

  onUserLeft(callback: (user: any) => void) {
    if (this.socket) {
      this.socket.on('user-left', callback);
    }
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

export default new SocketService();