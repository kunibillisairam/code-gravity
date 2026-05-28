import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws') + '/chat/ws';

const getHeaders = () => {
  const token = localStorage.getItem('codegravity_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

let socket = null;
let reconnectTimer = null;
let reconnectDelay = 1000;
const MAX_RECONNECT_DELAY = 16000;

export const chatService = {
  // --- REST ENDPOINTS ---
  getRooms: async () => {
    const response = await axios.get(`${API_BASE_URL}/chat/rooms`, { headers: getHeaders() });
    return response.data;
  },

  getRoomMessages: async (roomId) => {
    const response = await axios.get(`${API_BASE_URL}/chat/rooms/${roomId}/messages`, { headers: getHeaders() });
    return response.data;
  },

  getConversations: async () => {
    const response = await axios.get(`${API_BASE_URL}/chat/conversations`, { headers: getHeaders() });
    return response.data;
  },

  getConversationMessages: async (convId) => {
    const response = await axios.get(`${API_BASE_URL}/chat/conversations/${convId}/messages`, { headers: getHeaders() });
    return response.data;
  },

  createConversation: async (recipientUsername) => {
    const response = await axios.post(`${API_BASE_URL}/chat/conversations`, { recipient_username: recipientUsername }, { headers: getHeaders() });
    return response.data;
  },

  getUsers: async () => {
    const response = await axios.get(`${API_BASE_URL}/chat/users`, { headers: getHeaders() });
    return response.data;
  },

  markAsRead: async (convId) => {
    const response = await axios.post(`${API_BASE_URL}/chat/conversations/${convId}/read`, {}, { headers: getHeaders() });
    return response.data;
  },

  // --- WEBSOCKET GATEWAY ---
  connect: (token, onEvent, onDisconnectCallback) => {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }

    const wsUrl = `${WS_BASE_URL}?token=${token}`;
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('Peer chat WebSocket connected.');
      reconnectDelay = 1000; // Reset delay
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onEvent(data);
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
        chatService.connect(token, onEvent, onDisconnectCallback);
      }, reconnectDelay);
    };

    socket.onerror = (error) => {
      console.error('WebSocket encountered error:', error);
      socket.close();
    };
  },

  disconnect: () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (socket) {
      socket.onclose = null; // Remove listener to avoid reconnect loop
      socket.close();
      socket = null;
    }
    console.log('Peer chat WebSocket disconnected.');
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
