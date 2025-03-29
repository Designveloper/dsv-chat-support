import React from "react";
import "./ChatWidget.scss";

interface OfflineFormProps {
  offlineEmail: string;
  setOfflineEmail: (value: string) => void;
  offlineMessage: string;
  setOfflineMessage: (value: string) => void;
  offlineName: string;
  setOfflineName: (value: string) => void;
  submitOfflineForm: () => void;
  offlineFormSubmitted: boolean;
}

const OfflineForm: React.FC<OfflineFormProps> = ({
  offlineEmail,
  setOfflineEmail,
  offlineMessage,
  setOfflineMessage,
  offlineName,
  setOfflineName,
  submitOfflineForm,
  offlineFormSubmitted,
}) => {
  if (offlineFormSubmitted) {
    return (
      <div className="offline-form submitted">
        <h3>Thank You!</h3>
        <p>We've received your message and will get back to you soon.</p>
      </div>
    );
  }

  return (
    <div className="offline-form">
      <h3>Leave a message</h3>
      <p>
        We're currently offline. Please leave your details and we'll get back to
        you.
      </p>

      <div className="form-group">
        <label>Name (optional)</label>
        <input
          type="text"
          value={offlineName}
          onChange={(e) => setOfflineName(e.target.value)}
          placeholder="Your name"
        />
      </div>

      <div className="form-group">
        <label>Email *</label>
        <input
          type="email"
          value={offlineEmail}
          onChange={(e) => setOfflineEmail(e.target.value)}
          placeholder="Your email"
          required
        />
      </div>

      <div className="form-group">
        <label>Message *</label>
        <textarea
          value={offlineMessage}
          onChange={(e) => setOfflineMessage(e.target.value)}
          placeholder="How can we help you?"
          required
        />
      </div>

      <button
        onClick={submitOfflineForm}
        disabled={!offlineEmail.trim() || !offlineMessage.trim()}
      >
        Submit
      </button>
    </div>
  );
};

export default OfflineForm;
