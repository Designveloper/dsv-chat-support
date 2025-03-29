import React from "react";
import "./ChatWidget.scss";

interface MessageInputProps {
  message: string;
  setMessage: (message: string) => void;
  sendMessage: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  message,
  setMessage,
  sendMessage,
  handleKeyDown,
}) => {
  return (
    <div className="chat-input">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        onKeyDown={handleKeyDown}
      />
      <button onClick={sendMessage} disabled={!message.trim()}>
        Send
      </button>
    </div>
  );
};

export default MessageInput;
