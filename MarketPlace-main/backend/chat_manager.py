from fastapi import WebSocket
from typing import Dict, List
import json

class ConnectionManager:
    def __init__(self):
        # Maps user_id to their WebSocket connection(s)
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept and store a new WebSocket connection."""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        print(f"✅ User connected: {user_id} | Total connections: {len(self.active_connections[user_id])}")

        # 🔹 Broadcast updated online users
        await self.broadcast_online_users()

    async def disconnect(self, websocket: WebSocket, user_id: str):
        """Remove a user's connection and update everyone."""
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        print(f"❌ User disconnected: {user_id}")

        # 🔹 Broadcast updated online users
        await self.broadcast_online_users()

    async def send_personal_message(self, receiver_id: str, message: dict):
        """Send message to a specific user if online."""
        if receiver_id in self.active_connections:
            for connection in self.active_connections[receiver_id]:
                await connection.send_text(json.dumps(message))

    async def broadcast(self, message: dict):
        """Send a message to all connected users."""
        for user_connections in self.active_connections.values():
            for connection in user_connections:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception as e:
                    print(f"⚠️ Broadcast error: {e}")

    async def broadcast_online_users(self):
        """🔹 Send list of currently online users to everyone."""
        online_users = list(self.active_connections.keys())
        message = {"type": "online_users", "users": online_users}
        print(f"🟢 Currently online users: {online_users}")
        await self.broadcast(message)

# Create a global instance of the manager
connection_manager = ConnectionManager()
