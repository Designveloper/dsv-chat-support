import React from "react";
import "./ServiceSelectionModal.scss";
import mattermostLogo from "../assets/mattermost-logo.png";
import slackLogo from "../assets/slack-logo.png";

interface ServiceSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSlack: () => void;
  onSelectMattermost: () => void;
}

const ServiceSelectionModal: React.FC<ServiceSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectSlack,
  onSelectMattermost,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="service-modal" onClick={(e) => e.stopPropagation()}>
        <div className="service-modal__header">
          <h2>Select Service to Connect</h2>
          <button className="service-modal__close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="service-modal__content">
          <p>Choose the service you want to connect to your chat support:</p>

          <div className="service-modal__options">
            <button className="service-modal__option" onClick={onSelectSlack}>
              <img
                alt="Add to Slack"
                height="24"
                width="24"
                src={slackLogo}
                className="service-modal__slack-icon"
              />
              <span>Connect to Slack</span>
            </button>

            <button
              className="service-modal__option"
              onClick={onSelectMattermost}
            >
              <div className="service-modal__mattermost">
                <img
                  alt="Connect to Mattermost"
                  height="24"
                  width="24"
                  src={mattermostLogo}
                  className="service-modal__mattermost-icon"
                />
                <span>Connect to Mattermost</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceSelectionModal;
