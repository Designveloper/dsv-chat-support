import React, { useState } from "react";
import "./ChatWidget.scss";
import { useChatSession } from "../hooks/useChatSession";
import { useChatMessages } from "../hooks/useChatMessages";
import { useWidgetController } from "../hooks/useWidgetController";
import { useOfflineForm } from "../hooks/useOfflineForm";
import Button from "./Button";
import Input from "./Input";

interface ChatWidgetProps {
  workspaceId?: string;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ workspaceId }) => {
  // State hooks with proper initialization
  const { isOpen, toggleWidget, controllerRef } = useWidgetController();
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
  } = useChatMessages(sessionId, setIsOnline);
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

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isConfirmingEnd, setIsConfirmingEnd] = useState<boolean>(false);

  // Handle opening the widget
  const handleOpenWidget = async () => {
    console.log("Opening widget");

    if (activeWorkspace) {
      checkOnlineStatus();
    }

    // Only start chat session if we're online and don't have a session yet
    if (isOnline && !sessionId) {
      await startChatSession();
    }

    toggleWidget();
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
    if (e.key === "Enter") {
      console.log("Enter pressed");
      e.preventDefault();
      if (messageText.trim()) {
        const visitorInfo = controllerRef.current.getVisitorInfo();
        sendMessage({
          email: (visitorInfo?.data?.email as string) || "",
        });
      }
    }
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    const visitorInfo = controllerRef.current.getVisitorInfo();
    console.log("visitorInfo", visitorInfo);
    sendMessage({
      email: (visitorInfo?.data?.email as string) || "",
    });
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
              {isOnline ? "Live Chat Support" : "Leave a Message"}
            </h3>
            <div className="chat-widget__header-actions">
              {isOnline && (
                <Button
                  label="⋮"
                  onClick={toggleMenu}
                  variant="text"
                  className="chat-widget__menu-button"
                />
              )}
              <Button
                label="×"
                onClick={toggleWidget}
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
        <Button
          label="Chat Support"
          onClick={handleOpenWidget}
          className="chat-widget__toggle"
        />
      )}
    </div>
  );
};

export default ChatWidget;
