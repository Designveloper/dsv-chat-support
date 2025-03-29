import React from "react";
import "./ChatWidget.scss";

interface EndChatConfirmationProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const EndChatConfirmation: React.FC<EndChatConfirmationProps> = ({
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="end-chat-confirmation">
      <h3>End Chat Session?</h3>
      <p>Are you sure you want to end this chat session?</p>
      <div className="confirmation-buttons">
        <button className="cancel-button" onClick={onCancel}>
          Cancel
        </button>
        <button className="confirm-button" onClick={onConfirm}>
          End Chat
        </button>
      </div>
    </div>
  );
};

export default EndChatConfirmation;
