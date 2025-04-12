import React, { useEffect, useState } from "react";
import "./ChatWidget.scss";
import { useChatSession } from "../hooks/useChatSession";
import { useChatMessages } from "../hooks/useChatMessages";
import { useChatStore } from "../stores/useChatStore";
import { useOfflineForm } from "../hooks/useOfflineForm";
import { useVisitorIdentification } from "../hooks/useVisitorIdentification";
import VisitorIdentificationForm from "./VisitorIdentificationForm";
import { workspaceSettingsService } from "../services/workspaceSettingsService";
import Button from "./Button";
import Input from "./Input";

interface ChatWidgetProps {
  workspaceId?: string;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ workspaceId }) => {
  // State hooks with proper initialization
  const isOpen = useChatStore((state) => state.isOpen);
  const open = useChatStore((state) => state.open);
  const hide = useChatStore((state) => state.hide);
  const [needsIdentification, setNeedsIdentification] =
    useState<boolean>(false);

  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showUnreadBadge, setShowUnreadBadge] = useState<boolean>(false);
  const [lastSeenMessageIndex, setLastSeenMessageIndex] = useState<number>(0);

  const [playSound, setPlaySound] = useState<boolean>(false);

  const {
    sessionId,
    activeWorkspace,
    isOnline,
    setIsOnline,
    loading,
    error,
    checkOnlineStatus,
    startChatSession,
    endChatSession,
  } = useChatSession(workspaceId);

  const {
    messages,
    messageText,
    setMessageText,
    sendMessage,
    messagesEndRef,
    setEndChatMessage,
  } = useChatMessages(sessionId, setIsOnline, playSound);

  const {
    offlineEmail,
    setOfflineEmail,
    offlineMessage,
    setOfflineMessage,
    offlineName,
    setOfflineName,
    offlineFormSubmitted,
    offlineFormLoading,
    submitOfflineForm,
  } = useOfflineForm(activeWorkspace);

  const { isIdentificationRequired } =
    useVisitorIdentification(activeWorkspace);

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isConfirmingEnd, setIsConfirmingEnd] = useState<boolean>(false);

  // Initialize widget and check settings
  useEffect(() => {
    useChatStore.getState().initialize();

    // Fetch workspace settings
    if (workspaceId) {
      fetchSettings();
    }
  }, [workspaceId]);

  // Fetch workspace settings
  const fetchSettings = async () => {
    if (!workspaceId) return;

    try {
      const settings = await workspaceSettingsService.getSettings(workspaceId);
      console.log("🚀 ~ fetchSettings ~ settings:", settings);
      setShowUnreadBadge(settings.show_unread_count || false);
      checkIdentificationRequired(settings.visitor_identification || "none");
      setPlaySound(settings.play_sound || false);
    } catch (error) {
      console.error("Failed to fetch workspace settings:", error);
    }
  };

  useEffect(() => {
    if (sessionId) {
      const storedLastSeen = localStorage.getItem(`lastSeen_${sessionId}`);
      if (storedLastSeen) {
        setLastSeenMessageIndex(parseInt(storedLastSeen, 10));
      }
    }
  }, [sessionId]);

  // Update unread count based on new messages
  useEffect(() => {
    if (!showUnreadBadge || isOpen) return;

    if (messages.length > 0) {
      const lastMessageIndex = messages.length - 1;
      const lastMessage = messages[lastMessageIndex];
      if (!lastMessage.isUser && lastMessageIndex > lastSeenMessageIndex) {
        setUnreadCount((prevCount) => prevCount + 1);
      }
    }
  }, [messages, isOpen, showUnreadBadge, lastSeenMessageIndex, playSound]);

  // Reset unread count and update last seen index when chat is opened
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      const currentLastIndex = messages.length - 1;
      setLastSeenMessageIndex(currentLastIndex);
      if (sessionId) {
        localStorage.setItem(
          `lastSeen_${sessionId}`,
          currentLastIndex.toString()
        );
      }
    }
  }, [isOpen, messages.length, sessionId]);

  useEffect(() => {
    const originalTitle = document.title;

    if (unreadCount > 0 && !isOpen && showUnreadBadge) {
      document.title = `(${unreadCount}) ${originalTitle}`;
    } else {
      document.title = originalTitle;
    }

    return () => {
      document.title = originalTitle;
    };
  }, [unreadCount, isOpen, showUnreadBadge]);

  const checkIdentificationRequired = (setting: string) => {
    const required = isIdentificationRequired(setting);
    setNeedsIdentification(required);
  };

  const handleIdentificationComplete = () => {
    setNeedsIdentification(false);

    if (isOnline && !sessionId) {
      startChatSession();
    }
  };

  const handleOpenWidget = async () => {
    console.log("Opening widget");
    if (activeWorkspace) {
      checkOnlineStatus();
    }

    if (isOnline && !sessionId && !needsIdentification) {
      await startChatSession();
    }

    open();
  };

  // Menu handlers
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const showEndChatConfirmation = () => {
    setIsMenuOpen(false);
    setIsConfirmingEnd(true);
  };

  // Chat actions
  const cancelEndChat = () => setIsConfirmingEnd(false);

  const confirmEndChat = async () => {
    await endChatSession();
    setEndChatMessage();
    setIsConfirmingEnd(false);
  };

  // Message handlers
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.keyCode === 13) {
      console.log("Enter pressed");
      e.preventDefault();
      if (messageText.trim()) {
        sendMessage();
      }
    }
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    sendMessage();
  };

  // Content renderer
  const renderContent = () => {
    if (loading || offlineFormLoading) {
      return (
        <div className="chat-widget__loading">Connecting to support...</div>
      );
    }

    if (error) {
      return <div className="chat-widget__error">{error}</div>;
    }

    // If offline, show offline form
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
            <Input
              id="offline-email"
              type="email"
              label="Email"
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
            <Input
              id="offline-name"
              type="text"
              label="Name (optional but helpful)"
              value={offlineName}
              onChange={(e) => setOfflineName(e.target.value)}
            />
          </div>
          <Button
            label="Send"
            onClick={submitOfflineForm}
            disabled={!offlineEmail.trim() || !offlineMessage.trim()}
            className="chat-widget__offline-form-submit"
          />
        </div>
      );
    }

    if (needsIdentification && isOnline) {
      return (
        <VisitorIdentificationForm
          workspaceId={activeWorkspace}
          onComplete={handleIdentificationComplete}
        />
      );
    }

    // Show confirmation screen for ending chat
    if (isConfirmingEnd) {
      return (
        <div className="chat-widget__confirmation">
          <p>Are you sure you want to end this chat session?</p>
          <div className="chat-widget__confirmation-actions">
            <Button
              label="Yes"
              onClick={confirmEndChat}
              variant="primary"
              size="small"
            />
            <Button
              label="No"
              onClick={cancelEndChat}
              variant="secondary"
              size="small"
            />
          </div>
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
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={!sessionId}
          />
          <Button
            label="Send"
            onClick={handleSendMessage}
            disabled={!messageText.trim() || !sessionId}
            className="chat-widget__send-button"
          />
        </div>
      </>
    );
  };

  // Main render
  return (
    <div id="chat-widget-root">
      <div className="chat-widget">
        {isOpen && (
          <div
            className={`chat-widget__panel ${
              !isOnline && !offlineFormSubmitted && !offlineFormLoading
                ? "chat-widget__panel--offline"
                : ""
            }`}
          >
            <div className="chat-widget__header">
              <h3 className="chat-widget__title">
                {!isOnline
                  ? "Leave a Message"
                  : needsIdentification
                  ? "Welcome"
                  : "Live Chat Support"}
              </h3>
              <div className="chat-widget__header-actions">
                {isOnline && !needsIdentification && (
                  <Button
                    label="⋮"
                    onClick={toggleMenu}
                    variant="text"
                    className="chat-widget__menu-button"
                  />
                )}
                <Button
                  label="×"
                  onClick={() => hide()}
                  variant="text"
                  className="chat-widget__close-button"
                />
                {isMenuOpen && isOnline && (
                  <div className="chat-widget__menu-dropdown">
                    <Button
                      label="End chat"
                      onClick={showEndChatConfirmation}
                      variant="text"
                      className="chat-widget__menu-item"
                    />
                  </div>
                )}
              </div>
            </div>

            {renderContent()}
          </div>
        )}

        {!isOpen && (
          <div className="chat-widget__toggle-container">
            <Button
              label="Chat Support"
              onClick={handleOpenWidget}
              className="chat-widget__toggle"
            />
            {showUnreadBadge && unreadCount > 0 && (
              <div className="chat-widget__unread-badge">{unreadCount}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWidget;
