import React from "react";
import "./ChatWidget.scss";

interface ChatHeaderProps {
  toggleMenu: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ toggleMenu }) => {
  return (
    <div className="chat-header">
      <h3>Chat Support</h3>
      <div className="header-actions">
        <button className="menu-button" onClick={toggleMenu}>
          ⋮
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
