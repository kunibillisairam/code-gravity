import axios from 'axios';
import { apiClient } from './api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws') + '/chat/ws';

let socket = null;
let reconnectTimer = null;
let reconnectDelay = 1000;
const MAX_RECONNECT_DELAY = 16000;
const listeners = new Set();

export const chatService = {
  // --- REST ENDPOINTS ---
  getRooms: async () => {
    const response = await apiClient.get('/chat/rooms');
    return response.data;
  },

  getRoomMessages: async (roomId) => {
    const response = await apiClient.get(`/chat/rooms/${roomId}/messages`);
    return response.data;
  },

  getConversations: async () => {
    const response = await apiClient.get('/chat/conversations');
    return response.data;
  },

  getConversationMessages: async (convId) => {
    const response = await apiClient.get(`/chat/conversations/${convId}/messages`);
    return response.data;
  },

  createConversation: async (recipientUsername) => {
    const response = await apiClient.post('/chat/conversations', { recipient_username: recipientUsername });
    return response.data;
  },

  sendDirectMessage: async (conversationId, content) => {
    const response = await apiClient.post(
      `/chat/conversations/${conversationId}/messages`,
      { content, type: 'text', msg_type: 'text' }
    );
    return response.data;
  },

  getUsers: async () => {
    const response = await apiClient.get('/chat/users');
    return response.data;
  },

  markAsRead: async (convId) => {
    const response = await apiClient.post(`/chat/conversations/${convId}/read`, {});
    return response.data;
  },

  getNotifications: async () => {
    const response = await apiClient.get('/chat/notifications');
    return response.data;
  },

  markNotificationRead: async (notificationId) => {
    const response = await apiClient.post(`/chat/notifications/${notificationId}/read`, {});
    return response.data;
  },

  markAllNotificationsRead: async () => {
    const response = await apiClient.post('/chat/notifications/read-all', {});
    return response.data;
  },

  clearNotifications: async () => {
    const response = await apiClient.post('/chat/notifications/clear', {});
    return response.data;
  },

  // --- WEBSOCKET GATEWAY ---
  connect: (token, onEvent, onDisconnectCallback) => {
    if (onEvent) {
      listeners.add(onEvent);
    }

    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }

    try {
      const wsUrl = `${WS_BASE_URL}?token=${token}`;
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('Peer chat WebSocket connected.');
        reconnectDelay = 1000; // Reset delay
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          listeners.forEach((cb) => {
            try {
              cb(data);
            } catch (e) {
              console.error('Error inside WebSocket listener:', e);
            }
          });
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      socket.onclose = (event) => {
        console.warn(`WebSocket closed. Code: ${event.code}. Attempting reconnect...`);
        if (onDisconnectCallback) {
          onDisconnectCallback();
        }
        
        // Auto-reconnect logic with exponential backoff
        reconnectTimer = setTimeout(() => {
          reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
          chatService.connect(token, null, onDisconnectCallback);
        }, reconnectDelay);
      };

      socket.onerror = (error) => {
        console.error('WebSocket encountered error:', error);
        try {
          socket.close();
        } catch (e) {}
      };
    } catch (err) {
      console.error('WebSocket connection failed to initialize:', err);
      // Fallback reconnect with exponential backoff
      reconnectTimer = setTimeout(() => {
        reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
        chatService.connect(token, null, onDisconnectCallback);
      }, reconnectDelay * 2);
    }
  },

  disconnect: (onEvent) => {
    if (onEvent) {
      listeners.delete(onEvent);
    }
    
    // Disconnect socket ONLY when there are no active observers left
    if (listeners.size === 0) {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (socket) {
        socket.onclose = null; // Prevent reconnect loop
        socket.close();
        socket = null;
      }
      console.log('Peer chat WebSocket disconnected.');
    }
  },

  sendMessage: (messagePayload) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'message',
        ...messagePayload
      }));
      return true;
    }
    console.error('Cannot send message. WebSocket is not open.');
    return false;
  },

  sendTyping: (typingPayload) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'typing',
        ...typingPayload
      }));
      return true;
    }
    return false;
  }
};
