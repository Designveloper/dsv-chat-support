import React, { useEffect, useState } from "react";
import "./ChatWidget.scss";
import { useChatSession } from "../hooks/useChatSession";
import { useChatMessages } from "../hooks/useChatMessages";
import { useChatStore } from "../stores/useChatStore";
import { useOfflineForm } from "../hooks/useOfflineForm";
import { useVisitorIdentification } from "../hooks/useVisitorIdentification";
import VisitorIdentificationForm from "./VisitorIdentificationForm";
import { workspaceSettingsService } from "../services/workspaceSettingsService";
import { useOperatingHours } from "../hooks/useOperatingHours";
import Button from "./Button";
import Input from "./Input";
import messageSentImg from "../assets/message-sent.png";
import agentAvatar from "../assets/agent-avatar.png";
import closeIcon from "../assets/close-icon.png";

interface ChatWidgetProps {
  workspaceId?: string;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ workspaceId }) => {
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

  const [operatingHoursData, setOperatingHoursData] = useState<string | null>(
    null
  );
  const { isWithinOperatingHours, nextOpenTime } =
    useOperatingHours(operatingHoursData);

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
      setOperatingHoursData(settings.operating_hours || null);
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

  useEffect(() => {
    if (isOpen && messagesEndRef && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, messagesEndRef]);

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
    setIsMenuOpen(false);
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
    if (!isOnline || !isWithinOperatingHours) {
      if (offlineFormSubmitted) {
        return (
          <div className="chat-widget__offline">
            <img
              src={closeIcon}
              onClick={() => hide()}
              className="chat-widget__close-button chat-widget__close-button--offline"
              alt="Close"
            />
            <div className="chat-widget__offline-thanks">
              <img src={messageSentImg} alt="Offline Message Sent" />
              <p>Thanks for your message. We will be in touch soon!</p>
            </div>
          </div>
        );
      }

      return (
        <div className="chat-widget__offline">
          <div
            onClick={() => hide()}
            className="chat-widget__close-button chat-widget__close-button--offline"
          />
          <div className="chat-widget__offline-form">
            {!isWithinOperatingHours && nextOpenTime && (
              <p className="chat-widget__offline-form-message">
                We'll be back {nextOpenTime}
              </p>
            )}
            <p className="chat-widget__offline-form-message">
              Sorry we are away, but we would love to hear from you and chat
              soon!
            </p>

            <div className="chat-widget__offline-form-field">
              <Input
                id="offline-email"
                type="email"
                placeholder="Email"
                value={offlineEmail}
                onChange={(e) => setOfflineEmail(e.target.value)}
                required
                className="chat-widget__offline-form-input"
              />
            </div>

            <div className="chat-widget__offline-form-field">
              <textarea
                id="offline-message"
                value={offlineMessage}
                placeholder="Your message here"
                onChange={(e) => setOfflineMessage(e.target.value)}
                required
              />
            </div>

            <div className="chat-widget__offline-form-field">
              <Input
                id="offline-name"
                type="text"
                placeholder="Name (optional but helpful)"
                value={offlineName}
                onChange={(e) => setOfflineName(e.target.value)}
                className="chat-widget__offline-form-input"
              />
            </div>
            <Button
              label="Send"
              onClick={submitOfflineForm}
              disabled={!offlineEmail.trim() || !offlineMessage.trim()}
              className="chat-widget__offline-form-submit"
            />
          </div>
        </div>
      );
    }

    if (needsIdentification && isOnline) {
      return (
        <div className="chat-widget__visitor-identification">
          <img
            src={closeIcon}
            onClick={() => hide()}
            className="chat-widget__close-button chat-widget__close-button--offline"
            alt="Close"
          />
          <VisitorIdentificationForm
            workspaceId={activeWorkspace}
            onComplete={handleIdentificationComplete}
          />
        </div>
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
              className="chat-widget__confirmation-yes"
            />
            <Button
              label="No"
              onClick={cancelEndChat}
              variant="secondary"
              size="small"
              className="chat-widget__confirmation-no"
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
            <div key={index} className="chat-widget__message-container">
              {!msg.isUser && (
                <div className="chat-widget__avatar">
                  <img src={agentAvatar} alt="Support Agent" />
                </div>
              )}
              <div
                key={index}
                className={`chat-widget__message ${
                  msg.isUser
                    ? "chat-widget__message--user"
                    : "chat-widget__message--support"
                }`}
                style={{
                  display: "flex",
                  flexDirection: msg.isUser ? "row-reverse" : "row",
                  alignItems: "flex-end",
                }}
              >
                <div>{msg.text}</div>
              </div>
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
          <button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || !sessionId}
            className="chat-widget__send-button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              version="1.1"
              width="20"
              height="20"
              viewBox="0 0 256 256"
              xmlSpace="preserve"
            >
              <g
                style={{
                  stroke: "none",
                  strokeWidth: 0,
                  strokeDasharray: "none",
                  strokeLinecap: "butt",
                  strokeLinejoin: "miter",
                  strokeMiterlimit: 10,
                  fill: "none",
                  fillRule: "nonzero",
                  opacity: 1,
                }}
                transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)"
              >
                <path
                  d="M 89.999 3.075 C 90 3.02 90 2.967 89.999 2.912 c -0.004 -0.134 -0.017 -0.266 -0.038 -0.398 c -0.007 -0.041 -0.009 -0.081 -0.018 -0.122 c -0.034 -0.165 -0.082 -0.327 -0.144 -0.484 c -0.018 -0.046 -0.041 -0.089 -0.061 -0.134 c -0.053 -0.119 -0.113 -0.234 -0.182 -0.346 C 89.528 1.382 89.5 1.336 89.469 1.29 c -0.102 -0.147 -0.212 -0.288 -0.341 -0.417 c -0.13 -0.13 -0.273 -0.241 -0.421 -0.344 c -0.042 -0.029 -0.085 -0.056 -0.129 -0.082 c -0.118 -0.073 -0.239 -0.136 -0.364 -0.191 c -0.039 -0.017 -0.076 -0.037 -0.116 -0.053 c -0.161 -0.063 -0.327 -0.113 -0.497 -0.147 c -0.031 -0.006 -0.063 -0.008 -0.094 -0.014 c -0.142 -0.024 -0.285 -0.038 -0.429 -0.041 C 87.03 0 86.983 0 86.936 0.001 c -0.141 0.003 -0.282 0.017 -0.423 0.041 c -0.035 0.006 -0.069 0.008 -0.104 0.015 c -0.154 0.031 -0.306 0.073 -0.456 0.129 L 1.946 31.709 c -1.124 0.422 -1.888 1.473 -1.943 2.673 c -0.054 1.199 0.612 2.316 1.693 2.838 l 34.455 16.628 l 16.627 34.455 C 53.281 89.344 54.334 90 55.481 90 c 0.046 0 0.091 -0.001 0.137 -0.003 c 1.199 -0.055 2.251 -0.819 2.673 -1.943 L 89.815 4.048 c 0.056 -0.149 0.097 -0.3 0.128 -0.453 c 0.008 -0.041 0.011 -0.081 0.017 -0.122 C 89.982 3.341 89.995 3.208 89.999 3.075 z M 75.086 10.672 L 37.785 47.973 L 10.619 34.864 L 75.086 10.672 z M 55.136 79.381 L 42.027 52.216 l 37.302 -37.302 L 55.136 79.381 z"
                  style={{
                    stroke: "none",
                    strokeWidth: 1,
                    strokeDasharray: "none",
                    strokeLinecap: "butt",
                    strokeLinejoin: "miter",
                    strokeMiterlimit: 10,
                    fill: "rgb(0,0,0)",
                    fillRule: "nonzero",
                    opacity: 1,
                  }}
                  transform=" matrix(1 0 0 1 0 0) "
                  strokeLinecap="round"
                />
              </g>
            </svg>
          </button>
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
            className={`
          ${
            (isOnline && isWithinOperatingHours) ||
            (offlineFormSubmitted && !offlineFormLoading) ||
            offlineFormLoading
              ? "chat-widget__panel"
              : "chat-widget__panel--offline"
          }
          ${!isOpen ? "chat-widget__panel--closed" : ""}
        `}
          >
            <div
              className={`chat-widget__header ${
                !isOnline || !isWithinOperatingHours || needsIdentification
                  ? "chat-widget__header--offline"
                  : ""
              }`}
            >
              <div className="chat-widget__header-with-avatar">
                <div className="chat-widget__avatar">
                  <img src={agentAvatar} alt="Support Agent" />
                  {isOnline && !needsIdentification && (
                    <div className="chat-widget__status"></div>
                  )}
                </div>
                <h3 className="chat-widget__title">
                  {!isOnline
                    ? "Leave a Message"
                    : needsIdentification
                    ? "Welcome"
                    : "Support"}
                </h3>
              </div>
              <div className="chat-widget__header-actions" onClick={toggleMenu}>
                {isOnline && !needsIdentification && (
                  <svg>
                    <path
                      fill="#677583"
                      d="M9,4 C7.8954305,4 7,3.1045695 7,2 C7,0.8954305 7.8954305,0 9,0 C10.1045695,0 11,0.8954305 11,2 C11,3.1045695 10.1045695,4 9,4 Z M9,-3 C7.8954305,-3 7,-3.8954305 7,-5 C7,-6.1045695 7.8954305,-7 9,-7 C10.1045695,-7 11,-6.1045695 11,-5 C11,-3.8954305 10.1045695,-3 9,-3 Z M9,11 C7.8954305,11 7,10.1045695 7,9 C7,7.8954305 7.8954305,7 9,7 C10.1045695,7 11,7.8954305 11,9 C11,10.1045695 10.1045695,11 9,11 Z"
                      id="Icon"
                      transform="translate(9.000000, 2.000000) rotate(-270.000000) translate(-9.000000, -2.000000) "
                    ></path>
                  </svg>
                )}
                <img
                  src={closeIcon}
                  onClick={() => hide()}
                  className="chat-widget__close-button"
                  alt="Close"
                />
                {isOnline && (
                  <div
                    className={`chat-widget__menu-dropdown ${
                      isMenuOpen ? "is-open" : ""
                    }`}
                    onClick={showEndChatConfirmation}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      xmlnsXlink="http://www.w3.org/1999/xlink"
                      version="1.1"
                      style={{
                        width: 34,
                        height: 34,
                      }}
                      viewBox="0 0 256 256"
                      xmlSpace="preserve"
                    >
                      <g
                        style={{
                          stroke: "none",
                          strokeWidth: 0,
                          strokeDasharray: "none",
                          strokeLinecap: "butt",
                          strokeLinejoin: "miter",
                          strokeMiterlimit: 10,
                          fill: "none",
                          fillRule: "nonzero",
                          opacity: 1,
                        }}
                        transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)"
                      >
                        <path
                          d="M 45 47.468 c -1.104 0 -2 -0.896 -2 -2 v -30.04 c 0 -1.104 0.896 -2 2 -2 s 2 0.896 2 2 v 30.04 C 47 46.572 46.104 47.468 45 47.468 z"
                          style={{
                            stroke: "none",
                            strokeWidth: 1,
                            strokeDasharray: "none",
                            strokeLinecap: "butt",
                            strokeLinejoin: "miter",
                            strokeMiterlimit: 10,
                            fill: "rgb(0,0,0)",
                            fillRule: "nonzero",
                            opacity: 1,
                          }}
                          transform=" matrix(1 0 0 1 0 0) "
                          strokeLinecap="round"
                        />
                        <path
                          d="M 45 73.153 c -15.32 0 -27.784 -12.464 -27.784 -27.785 c 0 -10.221 5.606 -19.592 14.631 -24.455 c 0.973 -0.524 2.186 -0.16 2.709 0.812 c 0.524 0.972 0.16 2.186 -0.812 2.709 C 26.017 28.6 21.216 36.621 21.216 45.369 c 0 13.115 10.669 23.785 23.784 23.785 c 13.114 0 23.784 -10.67 23.784 -23.785 c 0 -8.748 -4.801 -16.77 -12.528 -20.933 c -0.973 -0.524 -1.336 -1.737 -0.813 -2.709 c 0.524 -0.972 1.736 -1.336 2.709 -0.812 c 9.025 4.863 14.632 14.233 14.632 24.455 C 72.784 60.689 60.32 73.153 45 73.153 z"
                          style={{
                            stroke: "none",
                            strokeWidth: 1,
                            strokeDasharray: "none",
                            strokeLinecap: "butt",
                            strokeLinejoin: "miter",
                            strokeMiterlimit: 10,
                            fill: "rgb(0,0,0)",
                            fillRule: "nonzero",
                            opacity: 1,
                          }}
                          transform=" matrix(1 0 0 1 0 0) "
                          strokeLinecap="round"
                        />
                        <path
                          d="M 45 90 C 20.187 90 0 69.813 0 45 C 0 20.187 20.187 0 45 0 c 24.813 0 45 20.187 45 45 C 90 69.813 69.813 90 45 90 z M 45 4 C 22.393 4 4 22.393 4 45 s 18.393 41 41 41 s 41 -18.393 41 -41 S 67.607 4 45 4 z"
                          style={{
                            stroke: "none",
                            strokeWidth: 1,
                            strokeDasharray: "none",
                            strokeLinecap: "butt",
                            strokeLinejoin: "miter",
                            strokeMiterlimit: 10,
                            fill: "rgb(0,0,0)",
                            fillRule: "nonzero",
                            opacity: 1,
                          }}
                          transform=" matrix(1 0 0 1 0 0) "
                          strokeLinecap="round"
                        />
                      </g>
                    </svg>
                    <Button
                      label="End chat"
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

        <div
          className={`chat-widget__toggle-container 
          ${isOpen ? "chat-widget__toggle-container--hidden" : ""}`}
        >
          <Button
            label={
              isOnline && isWithinOperatingHours
                ? "How can we help you?"
                : "Contact us"
            }
            onClick={handleOpenWidget}
            className={`chat-widget__toggle ${
              !isOnline || !isWithinOperatingHours
                ? "chat-widget__toggle--offline"
                : ""
            }`}
          />
          {isOnline && isWithinOperatingHours && (
            <div className="chat-widget__status chat-widget__status--not-open"></div>
          )}
          {showUnreadBadge && unreadCount > 0 && (
            <div className="chat-widget__unread-badge">{unreadCount}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;
