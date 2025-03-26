import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { Socket } from "socket.io-client";
import axios from "axios";
import "./ChatWidget.scss";

interface ChatWidgetProps {
  workspaces: { id: string; bot_token_slack?: string }[];
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ workspaces }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>(
    []
  );
  const [activeWorkspace, setActiveWorkspace] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check for existing session on mount
  useEffect(() => {
    const existingSessionId = localStorage.getItem("chat_session_id");
    if (existingSessionId) {
      setSessionId(existingSessionId);

      const savedMessages = localStorage.getItem(
        `chat_messages_${existingSessionId}`
      );
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages);
          setMessages(parsedMessages);
        } catch (error) {
          console.error("Error parsing saved messages:", error);
        }
      }

      setupWebSocketConnection(existingSessionId);
    }
  }, []);

  useEffect(() => {
    if (sessionId && messages.length > 0) {
      localStorage.setItem(
        `chat_messages_${sessionId}`,
        JSON.stringify(messages)
      );
    }
  }, [messages, sessionId]);

  // Set up WebSocket connection
  const setupWebSocketConnection = (sessionId: string) => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // Connect to WebSocket server
    const socket = io("http://localhost:3000", {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
    });
    socketRef.current = socket;

    // Handle connection events
    socket.on("connect", () => {
      console.log("Connected to chat server");

      // Register for this session
      socket.emit("register_session", { sessionId });
    });

    // Listen for staff messages
    socket.on("staff_message", (data: { text: string }) => {
      setMessages((prev) => [
        ...prev,
        {
          text: data.text,
          isUser: false,
        },
      ]);
    });

    // Handle errors and disconnection
    socket.on("error", (error: unknown) => {
      console.error("Socket error:", error);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from chat server");
    });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Set default workspace if available
  useEffect(() => {
    if (workspaces.length > 0 && !activeWorkspace) {
      // Find a workspace with Slack configured
      const slackWorkspace = workspaces.find((w) => w.bot_token_slack);
      if (slackWorkspace) {
        setActiveWorkspace(slackWorkspace.id);
      } else if (workspaces[0]) {
        setActiveWorkspace(workspaces[0].id);
      }
    }
  }, [workspaces]);

  const toggleWidget = () => {
    if (!isOpen && !sessionId) {
      // Start a new chat session when opening
      startChatSession();
    }
    setIsOpen(!isOpen);
  };

  const startChatSession = async () => {
    if (!activeWorkspace) {
      setError("No workspace selected");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const response = await axios.post(
        "http://localhost:3000/chat/start",
        { workspace_id: activeWorkspace },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { session_id } = response.data;
      setSessionId(session_id);
      localStorage.setItem("chat_session_id", session_id);

      setupWebSocketConnection(session_id);

      // Add welcome message
      const initialMessages = [
        {
          text: "Welcome to the chat! How can we help you today?",
          isUser: false,
        },
      ];
      setMessages(initialMessages);
      localStorage.setItem(
        `chat_messages_${session_id}`,
        JSON.stringify(initialMessages)
      );

      setLoading(false);
    } catch (err) {
      console.error("Error starting chat session:", err);
      setError("Failed to start chat session");
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !sessionId) return;

    // Add user message to chat (local UI)
    const newMessage = { text: message, isUser: true };
    setMessages([...messages, newMessage]);

    const messageToSend = message;
    setMessage(""); // Clear input field

    try {
      if (socketRef.current?.connected) {
        console.log("Sending message via socket:", messageToSend);
        // Send via socket if connected
        socketRef.current.emit("send_message", {
          sessionId,
          message: messageToSend,
        });
      } else {
        // Fall back to REST API if socket not available
        const token = localStorage.getItem("accessToken");
        await axios.post(
          "http://localhost:3000/chat/message",
          {
            session_id: sessionId,
            message: messageToSend,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);

      // Show error in chat
      setMessages((prev) => [
        ...prev,
        {
          text: "Failed to send message. Please try again.",
          isUser: false,
        },
      ]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-widget">
      {isOpen && (
        <div className="chat-widget__panel">
          <div className="chat-widget__header">
            <h3 className="chat-widget__title">Live Chat Support</h3>
            <button
              className="chat-widget__close-button"
              onClick={toggleWidget}
            >
              ×
            </button>
          </div>

          {loading ? (
            <div className="chat-widget__loading">Connecting to support...</div>
          ) : error ? (
            <div className="chat-widget__error">{error}</div>
          ) : (
            <>
              <div className="chat-widget__messages">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`chat-widget__message ${
                      msg.isUser
                        ? "chat-widget__message--user"
                        : "chat-widget__message--support"
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
              </div>

              <div className="chat-widget__input">
                <textarea
                  className="chat-widget__textarea"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={!sessionId}
                />
                <button
                  className="chat-widget__send-button"
                  onClick={sendMessage}
                  disabled={!message.trim() || !sessionId}
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {!isOpen && (
        <button className="chat-widget__toggle" onClick={toggleWidget}>
          Chat Support
        </button>
      )}
    </div>
  );
};

export default ChatWidget;
