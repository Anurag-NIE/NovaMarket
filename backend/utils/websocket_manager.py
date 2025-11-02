# backend/utils/websocket_manager.py
"""
WebSocket connection manager for real-time chat and notifications
"""
from fastapi import WebSocket
from typing import Dict, List
import json
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manages WebSocket connections for real-time communication"""
    
    def __init__(self):
        # Maps user_id to list of WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept and store a new WebSocket connection"""
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        
        self.active_connections[user_id].append(websocket)
        logger.info(f"✅ User connected: {user_id} (Total: {len(self.active_connections[user_id])} connections)")
        
        # Broadcast updated online users
        await self.broadcast_online_users()
    
    async def disconnect(self, websocket: WebSocket, user_id: str):
        """Remove a WebSocket connection"""
        if user_id in self.active_connections:
            try:
                self.active_connections[user_id].remove(websocket)
            except ValueError:
                pass
            
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        
        logger.info(f"❌ User disconnected: {user_id}")
        
        # Broadcast updated online users
        await self.broadcast_online_users()
    
    async def send_personal_message(self, receiver_id: str, message: dict):
        """Send message to a specific user if online"""
        if receiver_id in self.active_connections:
            disconnected = []
            
            for connection in self.active_connections[receiver_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception as e:
                    logger.warning(f"Failed to send to {receiver_id}: {e}")
                    disconnected.append(connection)
            
            # Clean up disconnected connections
            for conn in disconnected:
                await self.disconnect(conn, receiver_id)
    
    async def broadcast(self, message: dict):
        """Send message to all connected users"""
        disconnected = []
        
        for user_id, connections in list(self.active_connections.items()):
            for connection in connections:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception as e:
                    logger.warning(f"Broadcast failed for {user_id}: {e}")
                    disconnected.append((user_id, connection))
        
        # Clean up disconnected connections
        for user_id, conn in disconnected:
            await self.disconnect(conn, user_id)
    
    async def broadcast_online_users(self):
        """Broadcast list of currently online users to everyone"""
        online_users = list(self.active_connections.keys())
        message = {
            "type": "online_users",
            "users": online_users
        }
        logger.debug(f"🟢 Online users: {online_users}")
        await self.broadcast(message)
    
    def get_online_users(self) -> List[str]:
        """Get list of currently online user IDs"""
        return list(self.active_connections.keys())
    
    def is_user_online(self, user_id: str) -> bool:
        """Check if a user is online"""
        return user_id in self.active_connections

# Global connection manager instance
connection_manager = ConnectionManager()