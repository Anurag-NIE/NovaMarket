// src/utils/websocket.js

// This keeps your WebSocket logic modular and clean.


export const createChatSocket = (userId, onMessageCallback) => {
  const socket = new WebSocket(`ws://localhost:8000/ws/chat/${userId}`);

  socket.onopen = () => {
    console.log("✅ Connected to chat server");
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessageCallback(data);
  };

  socket.onclose = () => {
    console.log("❌ Disconnected from chat server");
  };

  socket.onerror = (error) => {
    console.error("WebSocket Error:", error);
  };

  return socket;
};
