import React, { useState, useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import "./ChatWidget.scss";
import { chatService } from "../services/chatService";
import WidgetController from "../services/widgetController";

interface ChatWidgetProps {
  workspaceId?: string;
  workspaces?: { id: string; bot_token_slack?: string }[];
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ workspaceId, workspaces }) => {
  const controllerRef = useRef(new WidgetController());
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
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isConfirmingEnd, setIsConfirmingEnd] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineFormSubmitted, setOfflineFormSubmitted] =
    useState<boolean>(false);
  const [offlineEmail, setOfflineEmail] = useState<string>("");
  const [offlineMessage, setOfflineMessage] = useState<string>("");
  const [offlineName, setOfflineName] = useState<string>("");

  useEffect(() => {
    // Connect controller to React's state
    const controller = controllerRef.current;
    controller.setUpdateCallback(setIsOpen);

    // Make the controller ready
    setTimeout(() => {
      controller.ready();
      console.log("Chat widget controller ready");
    }, 100);

    return () => {
      // Clean up by setting callback to null
      controller.setUpdateCallback(() => {});
    };
  }, []);

  // Toggle function should use controller methods
  const toggleWidget = () => {
    const controller = controllerRef.current;
    if (!isOpen) {
      if (activeWorkspace) {
        checkOnlineStatus();
      }

      if (isOnline && !sessionId) {
        // Start a new chat session when opening
        startChatSession();
      }

      controller.open();
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      controller.hide();
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const existingSessionId = chatService.getSavedSession();
    if (existingSessionId) {
      setSessionId(existingSessionId);

      const savedMessages = chatService.getSavedMessages(existingSessionId);
      if (savedMessages) {
        setMessages(savedMessages);
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
    const socket = chatService.setupWebSocketConnection(sessionId, (text) => {
      setMessages((prev) => [
        ...prev,
        {
          text,
          isUser: false,
        },
      ]);
    });

    socketRef.current = socket;
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Set workspace based on props
  useEffect(() => {
    // Direct workspaceId has priority (visitor mode)
    if (workspaceId) {
      setActiveWorkspace(workspaceId);
    }
    // Otherwise use workspaces array (admin mode)
    else if (workspaces && workspaces.length > 0 && !activeWorkspace) {
      const slackWorkspace = workspaces.find((w) => w.bot_token_slack);
      if (slackWorkspace) {
        setActiveWorkspace(slackWorkspace.id);
      } else if (workspaces[0]) {
        setActiveWorkspace(workspaces[0].id);
      }
    }
  }, [workspaceId, workspaces, activeWorkspace]);

  const checkOnlineStatus = async () => {
    if (!activeWorkspace) return;

    try {
      const online = await chatService.checkOnlineStatus(activeWorkspace);
      setIsOnline(online);

      // Check if the user has already submitted an offline form
      const hasSubmitted = chatService.hasSubmittedOfflineForm();
      setOfflineFormSubmitted(hasSubmitted);
    } catch (error) {
      console.error("Error checking online status:", error);
      setIsOnline(false); // Default to offline on error
    }
  };

  useEffect(() => {
    if (activeWorkspace) {
      checkOnlineStatus();
    }
  }, [activeWorkspace]);

  const startChatSession = async () => {
    if (!activeWorkspace) {
      setError("No workspace selected");
      return;
    }

    try {
      setLoading(true);
      const { session_id } = await chatService.startChatSession(
        activeWorkspace
      );
      setSessionId(session_id);

      setupWebSocketConnection(session_id);

      // Welcome message
      const initialMessages = [
        {
          text: "Welcome! How can we help you today?",
          isUser: false,
        },
      ];
      setMessages(initialMessages);
      chatService.saveMessages(session_id, initialMessages);

      setLoading(false);
    } catch (error) {
      console.error("Error starting chat session:", error);
      setError("Failed to start chat session");
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !sessionId) {
      return;
    }

    const newMessage = { text: message, isUser: true };
    setMessages((prev) => [...prev, newMessage]);

    const messageToSend = message;
    setMessage("");

    try {
      const visitorInfo = controllerRef.current.getVisitorInfo();
      let userInfo: { email: string; userId?: string } = {
        email: "",
      };

      if (visitorInfo.data) {
        userInfo = {
          ...userInfo,
          ...visitorInfo.data,
        };
      }

      const currentPage = window.location.href;

      await chatService.sendMessage({
        sessionId,
        message: messageToSend,
        userInfo,
        currentPage,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message");
      setMessages((prev) => [
        ...prev,
        {
          text: "Failed to send message",
          isUser: false,
        },
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const showEndChatConfirmation = () => {
    setIsMenuOpen(false);
    setIsConfirmingEnd(true);
  };

  const cancelEndChat = () => {
    setIsConfirmingEnd(false);
  };

  const confirmEndChat = async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      await chatService.endChatSession(sessionId);

      localStorage.removeItem(`chat_messages_${sessionId}`);
      localStorage.removeItem("chat_session_id");

      setMessages([]);
      setSessionId(null);
      setIsConfirmingEnd(false);

      setMessages([
        {
          text: "Chat session ended. Thank you for chatting with us!",
          isUser: false,
        },
      ]);

      setLoading(false);
    } catch (error) {
      console.error("Error ending chat session:", error);
      setError("Failed to end chat session");
      setLoading(false);
    }
  };

  const submitOfflineForm = async () => {
    if (!activeWorkspace || !offlineEmail.trim() || !offlineMessage.trim()) {
      return;
    }

    try {
      setLoading(true);

      await chatService.submitOfflineMessage(
        activeWorkspace,
        offlineEmail.trim(),
        offlineMessage.trim(),
        offlineName.trim() || undefined
      );

      setOfflineFormSubmitted(true);

      setLoading(false);
    } catch (error) {
      console.error("Error submitting offline form:", error);
      setError("Failed to submit your message");
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="chat-widget__loading">Connecting to support...</div>
      );
    }

    if (error) {
      return <div className="chat-widget__error">{error}</div>;
    }

    if (!isOnline) {
      if (offlineFormSubmitted) {
        return (
          <div className="chat-widget__offline-thanks">
            <h3>Thanks for your message!</h3>
            <p>We will be in touch soon.</p>
          </div>
        );
      }

      return (
        <div className="chat-widget__offline-form">
          <h3>Sorry, we are away</h3>
          <p>But we would love to hear from you and chat soon!</p>

          <div className="chat-widget__offline-form-field">
            <label htmlFor="offline-email">Email</label>
            <input
              id="offline-email"
              type="email"
              value={offlineEmail}
              onChange={(e) => setOfflineEmail(e.target.value)}
              required
            />
          </div>

          <div className="chat-widget__offline-form-field">
            <label htmlFor="offline-message">Your message here</label>
            <textarea
              id="offline-message"
              value={offlineMessage}
              onChange={(e) => setOfflineMessage(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="chat-widget__offline-form-field">
            <label htmlFor="offline-name">Name (optional but helpful)</label>
            <input
              id="offline-name"
              type="text"
              value={offlineName}
              onChange={(e) => setOfflineName(e.target.value)}
            />
          </div>

          <button
            className="chat-widget__offline-form-submit"
            onClick={submitOfflineForm}
            disabled={!offlineEmail.trim() || !offlineMessage.trim()}
          >
            Send
          </button>
        </div>
      );
    }

    // Normal chat content for online state
    return (
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
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-widget__input">
          <textarea
            className="chat-widget__textarea"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
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
    );
  };

  return (
    <div className="chat-widget">
      {isOpen && (
        <div className="chat-widget__panel">
          <div className="chat-widget__header">
            <h3 className="chat-widget__title">
              {isOnline ? "Live Chat Support" : "Leave a Message"}
            </h3>
            <div className="chat-widget__header-actions">
              {isOnline && (
                <button
                  className="chat-widget__menu-button"
                  onClick={toggleMenu}
                  aria-label="Menu"
                >
                  ⋮
                </button>
              )}
              <button
                className="chat-widget__close-button"
                onClick={toggleWidget}
              >
                ×
              </button>
              {isMenuOpen && isOnline && (
                <div className="chat-widget__menu-dropdown">
                  <button
                    className="chat-widget__menu-item"
                    onClick={showEndChatConfirmation}
                  >
                    End chat
                  </button>
                </div>
              )}
            </div>
          </div>

          {isConfirmingEnd && (
            <div className="chat-widget__confirmation">
              <p>Are you sure you want to end this chat session?</p>
              <div className="chat-widget__confirmation-actions">
                <button
                  className="chat-widget__confirmation-button chat-widget__confirmation-button--confirm"
                  onClick={confirmEndChat}
                >
                  Yes
                </button>
                <button
                  className="chat-widget__confirmation-button chat-widget__confirmation-button--cancel"
                  onClick={cancelEndChat}
                >
                  No
                </button>
              </div>
            </div>
          )}

          {renderContent()}
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
