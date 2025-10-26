import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Paperclip, X, FileText } from "lucide-react";
import { getToken, getUser } from "@/utils/auth";

const SOCKET_URL = "ws://localhost:8000/ws/chat";
const API_URL = "http://localhost:8000/api";

const ChatPage = () => {
  const [searchParams] = useSearchParams();

  const [ws, setWs] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const currentUser = getUser();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // ✅ Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = getToken();
        const res = await axios.get(`${API_URL}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUsers(
          res.data
            .filter((u) => u.id !== currentUser.id)
            .map((u) => ({ ...u, _id: u.id, isOnline: false }))
        );
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };

    if (currentUser?.id) fetchUsers();
  }, [currentUser?.id]);

  // ✅ Establish WebSocket connection
  useEffect(() => {
    if (!currentUser?.id) return;

    const socket = new WebSocket(`${SOCKET_URL}/${currentUser.id}`);

    socket.onopen = () => {
      console.log("✅ WebSocket Connected");
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📩 Received:", data);

        // Handle online users update
        if (data.type === "online_users") {
          setUsers((prevUsers) =>
            prevUsers.map((u) => ({
              ...u,
              isOnline: data.users.includes(u._id),
            }))
          );
          return;
        }

        // Handle chat messages
        if (data.type === "chat" && data.data) {
          const newMsg = data.data;
          console.log("💬 New message:", newMsg);

          // Add message to state (avoid duplicates)
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === newMsg.id);
            if (exists) {
              console.log("⚠️ Duplicate message, skipping");
              return prev;
            }
            console.log("✅ Adding new message to state");
            return [...prev, newMsg];
          });
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    socket.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
      setIsConnected(false);
    };

    socket.onclose = () => {
      console.log("🔌 WebSocket disconnected");
      setIsConnected(false);
    };

    setWs(socket);

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [currentUser?.id]);

  // ✅ Load messages when user is selected
  useEffect(() => {
    if (!selectedUser) {
      return;
    }

    const loadMessages = async () => {
      try {
        const token = getToken();
        const res = await axios.get(`${API_URL}/messages/${selectedUser._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("📜 Loaded messages:", res.data.length);
        setMessages(res.data);
      } catch (error) {
        console.error("Failed to load messages:", error);
      }
    };

    loadMessages();
  }, [selectedUser?._id]);

  // ✅ Auto-select user from query parameter
  useEffect(() => {
    const userId = searchParams.get("user");
    if (userId && users.length > 0) {
      const user = users.find((u) => u._id === userId);
      if (user) {
        console.log("🎯 Auto-selecting user:", user.name);
        setSelectedUser(user);
      }
    }
  }, [searchParams, users]);

  // ✅ Filter messages for current conversation
  const displayedMessages = messages.filter(
    (msg) =>
      (msg.sender_id === currentUser.id &&
        msg.receiver_id === selectedUser?._id) ||
      (msg.sender_id === selectedUser?._id &&
        msg.receiver_id === currentUser.id)
  );

  // ✅ Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayedMessages]);

  // ✅ Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  // ✅ Clear selected file
  const clearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ✅ Upload file
  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = getToken();
      const res = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data.file_url;
    } catch (error) {
      console.error("Failed to upload file:", error);
      throw error;
    }
  };

  // ✅ Send message
  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !selectedUser) {
      console.log("⚠️ Cannot send: empty message or no user selected");
      return;
    }

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.error("❌ WebSocket not connected");
      alert("Connection lost. Please refresh the page.");
      return;
    }

    try {
      setUploading(true);

      let fileUrl = null;
      let fileType = null;
      let fileName = null;

      // Upload file if selected
      if (selectedFile) {
        console.log("📤 Uploading file...");
        fileUrl = await uploadFile(selectedFile);
        fileType = selectedFile.type;
        fileName = selectedFile.name;
        console.log("✅ File uploaded:", fileUrl);
      }

      const msg = {
        receiver_id: selectedUser._id,
        message: newMessage.trim() || `[File: ${fileName}]`,
        file_url: fileUrl,
        file_type: fileType,
        file_name: fileName,
      };

      console.log("📤 Sending message via WebSocket:", msg);
      ws.send(JSON.stringify(msg));

      // Clear input immediately
      setNewMessage("");
      clearFile();

      console.log("✅ Message sent successfully");
    } catch (error) {
      console.error("❌ Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ✅ Render message content
  const renderMessageContent = (msg) => {
    if (msg.file_url) {
      const isImage = msg.file_type?.startsWith("image/");

      if (isImage) {
        return (
          <div>
            {msg.message && msg.message !== `[File: ${msg.file_name}]` && (
              <p className="mb-2">{msg.message}</p>
            )}
            <img
              src={msg.file_url}
              alt="Shared image"
              className="max-w-xs rounded-lg cursor-pointer"
              onClick={() => window.open(msg.file_url, "_blank")}
            />
          </div>
        );
      } else {
        return (
          <div className="flex items-center gap-2">
            <FileText size={20} />
            <div>
              {msg.message && msg.message !== `[File: ${msg.file_name}]` && (
                <p className="mb-1">{msg.message}</p>
              )}
              <a
                href={msg.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline"
              >
                📎 {msg.file_name || "Download file"}
              </a>
            </div>
          </div>
        );
      }
    }
    return <p>{msg.message}</p>;
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Connection Status Indicator */}
      {!isConnected && (
        <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-center py-2 text-sm z-50">
          ⚠️ Disconnected - Refresh the page to reconnect
        </div>
      )}

      {/* Left Sidebar - User List */}
      <div className="w-1/3 border-r p-4 overflow-y-auto">
        <h2 className="font-semibold mb-4 text-lg">Messages</h2>
        <Input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />

        {filteredUsers.length === 0 ? (
          <p className="text-muted-foreground text-sm">No users found</p>
        ) : (
          filteredUsers.map((user) => (
            <Card
              key={user._id}
              className={`mb-2 cursor-pointer transition-colors ${
                selectedUser?._id === user._id
                  ? "bg-accent"
                  : user.isOnline
                  ? "border-l-4 border-green-500 hover:bg-green-50 dark:hover:bg-green-950/30"
                  : "hover:bg-gray-50 dark:hover:bg-gray-900/40"
              }`}
              onClick={() => setSelectedUser(user)}
            >
              <CardContent className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-3 w-3 rounded-full ${
                      user.isOnline ? "bg-green-500" : "bg-gray-400"
                    }`}
                  ></span>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <p
                  className={`text-sm font-medium ${
                    user.isOnline ? "text-green-500" : "text-gray-400"
                  }`}
                >
                  {user.isOnline ? "Online" : "Offline"}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Right Chat Window */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            <div className="border-b p-3 font-semibold flex items-center gap-2">
              <span
                className={`h-3 w-3 rounded-full ${
                  selectedUser.isOnline ? "bg-green-500" : "bg-gray-400"
                }`}
              ></span>
              Chat with {selectedUser.name}
              {isConnected && (
                <span className="ml-auto text-xs text-green-500">
                  ● Connected
                </span>
              )}
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              {displayedMessages.length === 0 ? (
                <p className="text-center text-muted-foreground mt-8">
                  No messages yet. Start the conversation!
                </p>
              ) : (
                displayedMessages.map((msg, idx) => (
                  <div
                    key={msg.id || idx}
                    className={`mb-3 flex ${
                      msg.sender_id === currentUser.id
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`rounded-xl px-3 py-2 max-w-md ${
                        msg.sender_id === currentUser.id
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 dark:bg-gray-800"
                      }`}
                    >
                      {renderMessageContent(msg)}
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(
                          msg.timestamp || msg.created_at
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {selectedFile && (
              <div className="border-t p-3 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center gap-2">
                  {filePreview ? (
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="h-16 w-16 object-cover rounded"
                    />
                  ) : (
                    <div className="h-16 w-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                      <FileText size={24} />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFile}
                    disabled={uploading}
                  >
                    <X size={18} />
                  </Button>
                </div>
              </div>
            )}

            <div className="border-t p-3 flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx,.txt"
                className="hidden"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || !isConnected}
              >
                <Paperclip size={18} />
              </Button>
              <Input
                placeholder={
                  isConnected ? "Type a message..." : "Connecting..."
                }
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !uploading && isConnected) {
                    handleSendMessage();
                  }
                }}
                disabled={uploading || !isConnected}
              />
              <Button
                onClick={handleSendMessage}
                disabled={uploading || !isConnected}
              >
                {uploading ? "..." : <Send size={18} />}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center flex-1 text-muted-foreground">
            Select a user to start chatting
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
