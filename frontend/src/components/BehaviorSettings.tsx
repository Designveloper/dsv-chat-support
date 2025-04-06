import React, { useState, useEffect } from "react";
import { workspaceService, Workspace } from "../services/workspaceService";
import { useParams } from "react-router-dom";
import "./BehaviorSettings.scss";

interface BehaviorSettingsProps {
  workspace?: Workspace;
}

const BehaviorSettings: React.FC<BehaviorSettingsProps> = ({ workspace }) => {
  const [loading, setLoading] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(
    null
  );
  const { id: workspaceId } = useParams<{ id: string }>();

  // Form state
  const [autoUpdateStatus, setAutoUpdateStatus] = useState(true);
  const [presenceDetection, setPresenceDetection] = useState("auto");
  const [visitorIdentification, setVisitorIdentification] = useState("prompt");
  const [autoResponseEnabled, setAutoResponseEnabled] = useState(true);
  const [autoResponseMessage, setAutoResponseMessage] =
    useState("One moment please.");
  const [offlineTransition, setOfflineTransition] = useState("3min");
  const [showUnreadCount, setShowUnreadCount] = useState(true);

  useEffect(() => {
    if (workspace) {
      setCurrentWorkspace(workspace);
      return;
    }

    const fetchWorkspace = async () => {
      if (!workspaceId) return;

      try {
        setLoading(true);
        const data = await workspaceService.getWorkspace(workspaceId);
        setCurrentWorkspace(data);
      } catch (error) {
        console.error("Error fetching workspace:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspace();
  }, [workspace, workspaceId]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Save settings to API (implementation would depend on your API structure)
    console.log("Saving behavior settings...");
  };

  if (loading) {
    return (
      <div className="behavior-settings__loading">Loading settings...</div>
    );
  }

  return (
    <div className="behavior-settings">
      <h2>Presence and widget behavior</h2>

      <div className="behavior-settings__status-section">
        <div className="behavior-settings__status-label">
          Current Status{" "}
          <span className="behavior-settings__status-badge behavior-settings__status-badge--offline">
            offline
          </span>
          {currentWorkspace?.selected_channel_id && (
            <span className="behavior-settings__status-detail">
              all operators away from {currentWorkspace.name}
            </span>
          )}
        </div>

        <div className="behavior-settings__switch-wrapper">
          <label className="behavior-settings__switch">
            <input
              type="checkbox"
              checked={autoUpdateStatus}
              onChange={() => setAutoUpdateStatus(!autoUpdateStatus)}
            />
            <span className="behavior-settings__slider"></span>
          </label>
          <span className="behavior-settings__switch-label">
            Update widget status automatically
          </span>
          <span className="behavior-settings__help-text">
            (what does this mean?)
          </span>
        </div>
      </div>

      <div className="behavior-settings__section">
        <h3>Presence detection</h3>

        <div className="behavior-settings__radio-group">
          <label className="behavior-settings__radio">
            <input
              type="radio"
              name="presenceDetection"
              value="auto"
              checked={presenceDetection === "auto"}
              onChange={() => setPresenceDetection("auto")}
            />
            <span className="behavior-settings__radio-text">
              Automatically detect when your team is online and turn chat on/off
              accordingly
            </span>
          </label>

          <label className="behavior-settings__radio">
            <input
              type="radio"
              name="presenceDetection"
              value="manual"
              checked={presenceDetection === "manual"}
              onChange={() => setPresenceDetection("manual")}
            />
            <span className="behavior-settings__radio-text">
              Do not try to detect presence in{" "}
              {currentWorkspace?.name || "this channel"} and turn chat on/off
              manually
            </span>
          </label>
        </div>
      </div>

      <div className="behavior-settings__section">
        <h3>Ask visitors to identify themselves</h3>

        <div className="behavior-settings__radio-group">
          <label className="behavior-settings__radio">
            <input
              type="radio"
              name="visitorIdentification"
              value="none"
              checked={visitorIdentification === "none"}
              onChange={() => setVisitorIdentification("none")}
            />
            <span className="behavior-settings__radio-text">
              Let them start chatting right away
            </span>
          </label>

          <label className="behavior-settings__radio">
            <input
              type="radio"
              name="visitorIdentification"
              value="prompt"
              checked={visitorIdentification === "prompt"}
              onChange={() => setVisitorIdentification("prompt")}
            />
            <span className="behavior-settings__radio-text">
              Prompt visitors for email and name
            </span>
          </label>
        </div>

        <div className="behavior-settings__help-link">
          <a href="#">Learn more about this feature</a>
        </div>
      </div>

      <div className="behavior-settings__section">
        <h3>
          What should happen when your first Slack operator joins the chat?
        </h3>

        <div className="behavior-settings__radio-group">
          <label className="behavior-settings__radio">
            <input
              type="radio"
              name="autoResponse"
              value="enabled"
              checked={autoResponseEnabled}
              onChange={() => setAutoResponseEnabled(true)}
            />
            <span className="behavior-settings__radio-text">
              Send auto response message
            </span>
          </label>

          <label className="behavior-settings__radio">
            <input
              type="radio"
              name="autoResponse"
              value="disabled"
              checked={!autoResponseEnabled}
              onChange={() => setAutoResponseEnabled(false)}
            />
            <span className="behavior-settings__radio-text">
              Do not send an auto response message
            </span>
          </label>
        </div>
      </div>

      <div className="behavior-settings__section">
        <h3>
          Auto response message that will be sent when the first Slack operator
          joins the chat
        </h3>

        <div className="behavior-settings__input-wrapper">
          <textarea
            className="behavior-settings__textarea"
            value={autoResponseMessage}
            onChange={(e) => setAutoResponseMessage(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      <div className="behavior-settings__section">
        <h3>
          What should happen with actively chatting visitors when you transition
          offline?
        </h3>

        <div className="behavior-settings__select-wrapper">
          <select
            className="behavior-settings__select"
            value={offlineTransition}
            onChange={(e) => setOfflineTransition(e.target.value)}
          >
            <option value="3min">
              Allow them to chat until they have not sent or received a message
              for 3 minutes
            </option>
            <option value="5min">
              Allow them to chat until they have not sent or received a message
              for 5 minutes
            </option>
            <option value="10min">
              Allow them to chat until they have not sent or received a message
              for 10 minutes
            </option>
            <option value="immediate">End conversations immediately</option>
          </select>
        </div>

        <div className="behavior-settings__help-text">
          <p>
            NOTE: This means you could receive messages after you go offline
            from visitors you were actively chatting with until they have no
            chat activity for 3 minutes. After that they will see offline form.
          </p>
        </div>
      </div>

      <div className="behavior-settings__section">
        <h3>Show a badge with unread messages count on the tab?</h3>

        <div className="behavior-settings__radio-group">
          <label className="behavior-settings__radio">
            <input
              type="radio"
              name="unreadCount"
              value="show"
              checked={showUnreadCount}
              onChange={() => setShowUnreadCount(true)}
            />
            <span className="behavior-settings__radio-text">
              Show unread count
            </span>
          </label>

          <label className="behavior-settings__radio">
            <input
              type="radio"
              name="unreadCount"
              value="hide"
              checked={!showUnreadCount}
              onChange={() => setShowUnreadCount(false)}
            />
            <span className="behavior-settings__radio-text">
              Do not show unread count
            </span>
          </label>
        </div>
      </div>

      <div className="behavior-settings__actions">
        <button
          className="behavior-settings__submit-button"
          onClick={handleSubmit}
          type="button"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default BehaviorSettings;
