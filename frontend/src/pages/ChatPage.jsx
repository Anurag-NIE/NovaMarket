import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Send,
  Paperclip,
  X,
  FileText,
  AlertCircle,
  Search,
  Image as ImageIcon,
  Download,
  CheckCheck,
  Clock,
  MessageCircle,
  Users,
} from "lucide-react";
import { getToken, getUser } from "@/utils/auth";
import { toast } from "sonner";

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
  const [reconnecting, setReconnecting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const currentUser = getUser();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Fetch all users
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
        toast.error("Failed to load users");
      }
    };

    if (currentUser?.id) fetchUsers();
  }, [currentUser?.id]);

  // Establish WebSocket connection with auto-reconnect
  useEffect(() => {
    if (!currentUser?.id) return;

    const connectWebSocket = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) return;

      console.log("🔌 Connecting to WebSocket...");
      const socket = new WebSocket(`${SOCKET_URL}/${currentUser.id}`);

      socket.onopen = () => {
        console.log("✅ WebSocket Connected");
        setIsConnected(true);
        setReconnecting(false);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "online_users") {
            setUsers((prevUsers) =>
              prevUsers.map((u) => ({
                ...u,
                isOnline: data.users.includes(u._id),
              }))
            );
            return;
          }

          if (data.type === "chat" && data.data) {
            const newMsg = data.data;
            setMessages((prev) => {
              const exists = prev.some((m) => m.id === newMsg.id);
              if (exists) return prev;
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
        wsRef.current = null;

        if (!reconnectTimeoutRef.current) {
          setReconnecting(true);
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log("🔄 Attempting to reconnect...");
            reconnectTimeoutRef.current = null;
            connectWebSocket();
          }, 3000);
        }
      };

      wsRef.current = socket;
      setWs(socket);
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [currentUser?.id]);

  // Load messages when user is selected
  useEffect(() => {
    if (!selectedUser) return;

    const loadMessages = async () => {
      try {
        const token = getToken();
        const res = await axios.get(`${API_URL}/messages/${selectedUser._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(res.data);
      } catch (error) {
        console.error("Failed to load messages:", error);
        toast.error("Failed to load messages");
      }
    };

    loadMessages();
  }, [selectedUser?._id]);

  // Auto-select user from query parameter
  useEffect(() => {
    const userId = searchParams.get("user");
    if (userId && users.length > 0) {
      const user = users.find((u) => u._id === userId);
      if (user) {
        setSelectedUser(user);
      }
    }
  }, [searchParams, users]);

  // Filter messages for current conversation
  const displayedMessages = messages.filter(
    (msg) =>
      (msg.sender_id === currentUser.id &&
        msg.receiver_id === selectedUser?._id) ||
      (msg.sender_id === selectedUser?._id &&
        msg.receiver_id === currentUser.id)
  );

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayedMessages]);

  // Handle typing indicator
  const handleTyping = () => {
    setIsTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
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

  // Clear selected file
  const clearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Upload file
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

  // Send message
  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !selectedUser) {
      return;
    }

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      toast.error("Connection lost. Reconnecting...");
      return;
    }

    try {
      setUploading(true);

      let fileUrl = null;
      let fileType = null;
      let fileName = null;

      if (selectedFile) {
        fileUrl = await uploadFile(selectedFile);
        fileType = selectedFile.type;
        fileName = selectedFile.name;
      }

      const msg = {
        receiver_id: selectedUser._id,
        message: newMessage.trim() || `[File: ${fileName}]`,
        file_url: fileUrl,
        file_type: fileType,
        file_name: fileName,
      };

      ws.send(JSON.stringify(msg));

      setNewMessage("");
      clearFile();
    } catch (error) {
      console.error("❌ Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get user initials for avatar
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Render message content
  const renderMessageContent = (msg) => {
    if (msg.file_url) {
      const isImage = msg.file_type?.startsWith("image/");

      if (isImage) {
        return (
          <div className="space-y-2">
            {msg.message && msg.message !== `[File: ${msg.file_name}]` && (
              <p className="mb-2">{msg.message}</p>
            )}
            <div className="relative group">
              <img
                src={msg.file_url}
                alt="Shared image"
                className="max-w-[280px] rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => window.open(msg.file_url, "_blank")}
              />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(msg.file_url, "_blank");
                  }}
                >
                  <Download size={14} />
                </Button>
              </div>
            </div>
          </div>
        );
      } else {
        return (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
            <div className="p-2 rounded-lg bg-white/20">
              <FileText size={20} />
            </div>
            <div className="flex-1 min-w-0">
              {msg.message && msg.message !== `[File: ${msg.file_name}]` && (
                <p className="mb-2">{msg.message}</p>
              )}
              <p className="text-sm font-medium truncate">
                {msg.file_name || "Document"}
              </p>
              <a
                href={msg.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline hover:no-underline inline-flex items-center gap-1 mt-1"
              >
                <Download size={12} />
                Download file
              </a>
            </div>
          </div>
        );
      }
    }
    return <p className="break-words">{msg.message}</p>;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000)
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Connection Status Banner */}
      {!isConnected && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-red-500 to-red-600 text-white text-center py-2.5 text-sm z-50 flex items-center justify-center gap-2 shadow-lg">
          <AlertCircle size={16} />
          <span className="font-medium">
            {reconnecting ? "Reconnecting..." : "Disconnected - Please refresh"}
          </span>
        </div>
      )}

      {/* Left Sidebar - Users List */}
      <div className="w-[380px] border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
              <MessageCircle className="text-white" size={24} />
            </div>
            <div>
              <h2 className="font-bold text-lg">Messages</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Users size={12} />
                {users.filter((u) => u.isOnline).length} online
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <Input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users
                size={48}
                className="mx-auto text-muted-foreground mb-3 opacity-50"
              />
              <p className="text-sm text-muted-foreground">No users found</p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <Card
                key={user._id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${
                  selectedUser?._id === user._id
                    ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-300 dark:border-blue-700"
                    : "bg-white dark:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                }`}
                onClick={() => setSelectedUser(user)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12 border-2 border-white dark:border-slate-700 shadow-sm">
                        <AvatarFallback
                          className={`text-sm font-semibold ${
                            user.isOnline
                              ? "bg-gradient-to-br from-green-400 to-emerald-500 text-white"
                              : "bg-gradient-to-br from-slate-300 to-slate-400 text-slate-700"
                          }`}
                        >
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-800 ${
                          user.isOnline ? "bg-green-500" : "bg-slate-400"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">{user.name}</p>
                        {user.role && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {user.role}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={user.isOnline ? "default" : "secondary"}
                        className={`text-[10px] ${
                          user.isOnline
                            ? "bg-green-500 hover:bg-green-600"
                            : "bg-slate-300 dark:bg-slate-700"
                        }`}
                      >
                        {user.isOnline ? "Online" : "Offline"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Right Chat Window */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="border-b border-slate-200 dark:border-slate-800 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-900 dark:to-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-11 w-11 border-2 border-white dark:border-slate-700 shadow-sm">
                      <AvatarFallback
                        className={`font-semibold ${
                          selectedUser.isOnline
                            ? "bg-gradient-to-br from-green-400 to-emerald-500 text-white"
                            : "bg-gradient-to-br from-slate-300 to-slate-400 text-slate-700"
                        }`}
                      >
                        {getInitials(selectedUser.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-slate-800 ${
                        selectedUser.isOnline
                          ? "bg-green-500 animate-pulse"
                          : "bg-slate-400"
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{selectedUser.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {selectedUser.isOnline ? (
                        <>
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          Active now
                        </>
                      ) : (
                        <>
                          <Clock size={12} />
                          Offline
                        </>
                      )}
                    </p>
                  </div>
                </div>
                {isConnected && (
                  <Badge
                    variant="outline"
                    className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
                  >
                    <span className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                    Connected
                  </Badge>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-950/50 dark:to-slate-900">
              {displayedMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-950 dark:to-purple-950 mb-4">
                    <MessageCircle
                      size={48}
                      className="text-blue-600 dark:text-blue-400"
                    />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    No messages yet
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Start the conversation with {selectedUser.name}. Say hello!
                    👋
                  </p>
                </div>
              ) : (
                displayedMessages.map((msg, idx) => {
                  const isSent = msg.sender_id === currentUser.id;
                  const showAvatar =
                    idx === 0 ||
                    displayedMessages[idx - 1].sender_id !== msg.sender_id;

                  return (
                    <div
                      key={msg.id || idx}
                      className={`flex gap-3 ${
                        isSent ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!isSent && showAvatar && (
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarFallback className="text-xs bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                            {getInitials(selectedUser.name)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      {!isSent && !showAvatar && <div className="w-8" />}

                      <div
                        className={`flex flex-col ${
                          isSent ? "items-end" : "items-start"
                        } max-w-[70%]`}
                      >
                        <div
                          className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                            isSent
                              ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-tr-sm"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-sm"
                          }`}
                        >
                          {renderMessageContent(msg)}
                        </div>
                        <div className="flex items-center gap-2 mt-1 px-2">
                          <p className="text-[10px] text-muted-foreground">
                            {formatTime(msg.timestamp || msg.created_at)}
                          </p>
                          {isSent && (
                            <CheckCheck size={12} className="text-blue-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* File Preview */}
            {selectedFile && (
              <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                  {filePreview ? (
                    <div className="relative">
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="h-16 w-16 object-cover rounded-lg"
                      />
                      <div className="absolute -top-1 -right-1 p-1 rounded-full bg-blue-500">
                        <ImageIcon size={12} className="text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="h-16 w-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-950 dark:to-purple-950 rounded-lg flex items-center justify-center">
                      <FileText
                        size={24}
                        className="text-blue-600 dark:text-blue-400"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFile}
                    disabled={uploading}
                    className="hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600"
                  >
                    <X size={18} />
                  </Button>
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900">
              <div className="flex items-end gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || !isConnected}
                  className="shrink-0 h-11 w-11 rounded-xl border-2 hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-300 dark:hover:border-blue-700"
                >
                  <Paperclip size={20} />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    placeholder={
                      isConnected ? "Type your message..." : "Connecting..."
                    }
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        !e.shiftKey &&
                        !uploading &&
                        isConnected
                      ) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={uploading || !isConnected}
                    className="h-11 pr-12 rounded-xl border-2 focus:border-blue-300 dark:focus:border-blue-700 bg-slate-50 dark:bg-slate-800"
                  />
                  {isTyping && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="flex gap-1">
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={
                    uploading ||
                    !isConnected ||
                    (!newMessage.trim() && !selectedFile)
                  }
                  className="h-11 px-6 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-md hover:shadow-lg transition-all"
                >
                  {uploading ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={18} className="mr-2" />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-950 dark:to-purple-950 mb-6">
              <MessageCircle
                size={64}
                className="text-blue-600 dark:text-blue-400"
              />
            </div>
            <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              NovoMarket Chat
            </h2>
            <p className="text-muted-foreground max-w-md">
              Select a conversation from the left sidebar to start chatting with
              buyers and sellers
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
