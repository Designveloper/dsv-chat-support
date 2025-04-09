import React, { useState, useEffect, useRef } from "react";
import { Workspace } from "../services/workspaceService";
import { useOutletContext } from "react-router-dom";
import { workspaceSettingsService } from "../services/workspaceSettingsService";
// import { chatService } from "../services/chatService";
import "./BehaviorSettings.scss";

type ContextType = { workspace: Workspace | null };

// Define a type for the settings state
interface SettingsState {
  presenceDetection: string;
  visitorIdentification: string;
  autoResponseEnabled: boolean;
  autoResponseMessage: string;
  offlineTransition: string;
  showUnreadCount: boolean;
}

const BehaviorSettings = () => {
  const { workspace } = useOutletContext<ContextType>();
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // const [isOnline, setIsOnline] = useState<boolean>(false);

  // Form state
  const [settings, setSettings] = useState<SettingsState>({
    // autoUpdateStatus: true,
    presenceDetection: "auto",
    visitorIdentification: "prompt",
    autoResponseEnabled: true,
    autoResponseMessage: "One moment please.",
    offlineTransition: "3min",
    showUnreadCount: true,
  });

  // Reference to the original settings for change tracking
  const originalSettingsRef = useRef<SettingsState | null>(null);

  // Load workspace and settings
  useEffect(() => {
    if (workspace) {
      setCurrentWorkspace(workspace);
      loadWorkspaceSettings(workspace.id);
      // checkOnlineStatus(workspace.id);
    }
  }, [workspace]);

  // const checkOnlineStatus = async (workspaceId: string) => {
  //   try {
  //     const online = await chatService.checkOnlineStatus(workspaceId);
  //     setIsOnline(online);
  //   } catch (error) {
  //     console.error("Error checking online status:", error);
  //     setIsOnline(false);
  //   }
  // };

  const loadWorkspaceSettings = async (workspaceId: string) => {
    setLoading(true);
    setError(null);
    try {
      // First check if settings already exist
      // const settingsInitialized =
      //   await workspaceSettingsService.checkIfSettingsInitialized(workspaceId);

      // Only initialize if needed
      // if (!settingsInitialized) {
      //   console.log("Settings not initialized, initializing now...");
      //   await workspaceSettingsService.initializeSettings(workspaceId);
      // }

      const fetchedSettings = await workspaceSettingsService.getSettings(
        workspaceId
      );

      // Map backend settings to frontend state
      const mappedSettings: SettingsState = {
        presenceDetection: fetchedSettings.presence_detection ?? "auto",
        visitorIdentification:
          fetchedSettings.visitor_identification ?? "prompt",
        autoResponseEnabled: fetchedSettings.auto_response_enabled ?? true,
        autoResponseMessage:
          fetchedSettings.auto_response_message ?? "One moment please.",
        offlineTransition: fetchedSettings.offline_transition ?? "3min",
        showUnreadCount: fetchedSettings.show_unread_count ?? true,
      };

      // Update the form state
      setSettings(mappedSettings);

      // Save the original settings for comparison later
      originalSettingsRef.current = { ...mappedSettings };
    } catch (error) {
      console.error("Error loading settings:", error);
      setError("Failed to load settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle individual setting changes
  const handleSettingChange = (
    name: keyof SettingsState,
    value: SettingsState[keyof SettingsState]
  ) => {
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!currentWorkspace) {
      setError("No workspace selected");
      setLoading(false);
      return;
    }

    try {
      // Compare current settings with original settings
      const changedSettings: Partial<SettingsState> = {};
      const original = originalSettingsRef.current;

      if (!original) {
        setError(
          "Unable to determine changed settings. Please reload the page."
        );
        setLoading(false);
        return;
      }

      if (settings.presenceDetection !== original.presenceDetection) {
        changedSettings.presenceDetection = settings.presenceDetection;
      }

      if (settings.visitorIdentification !== original.visitorIdentification) {
        changedSettings.visitorIdentification = settings.visitorIdentification;
      }

      if (settings.autoResponseEnabled !== original.autoResponseEnabled) {
        changedSettings.autoResponseEnabled = settings.autoResponseEnabled;
      }

      if (settings.autoResponseMessage !== original.autoResponseMessage) {
        changedSettings.autoResponseMessage = settings.autoResponseMessage;
      }

      if (settings.offlineTransition !== original.offlineTransition) {
        changedSettings.offlineTransition = settings.offlineTransition;
      }

      if (settings.showUnreadCount !== original.showUnreadCount) {
        changedSettings.showUnreadCount = settings.showUnreadCount;
      }

      // If nothing changed, show a message and return
      if (Object.keys(changedSettings).length === 0) {
        setSuccessMessage("No changes detected");
        setLoading(false);
        return;
      }

      console.log("Updating with changed settings:", changedSettings);

      // Only send the changed settings to the backend
      await workspaceSettingsService.updateSettings(
        currentWorkspace.id,
        changedSettings
      );

      // Update the original settings reference after successful save
      originalSettingsRef.current = { ...settings };

      // Check online status again in case auto-update setting changed
      // if (
      //   changedSettings.autoUpdateStatus !== undefined ||
      //   changedSettings.presenceDetection !== undefined
      // ) {
      //   checkOnlineStatus(currentWorkspace.id);
      // }

      setSuccessMessage(`Settings saved successfully!`);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setError("Failed to save settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="behavior-settings">
      <h2>Presence and widget behavior</h2>

      {loading && <div className="behavior-settings__loading">Loading...</div>}

      {error && <div className="behavior-settings__error">{error}</div>}

      {successMessage && (
        <div className="behavior-settings__success">{successMessage}</div>
      )}

      {/* <div className="behavior-settings__status-section">
        <div className="behavior-settings__status-label">
          Current Status{" "}
          <span
            className={`behavior-settings__status-badge ${
              isOnline
                ? "behavior-settings__status-badge--online"
                : "behavior-settings__status-badge--offline"
            }`}
          >
            {isOnline ? "online" : "offline"}
          </span>
          {currentWorkspace?.selected_channel_id && (
            <span className="behavior-settings__status-detail">
              {isOnline ? "operators available in" : "all operators away from"}{" "}
              {currentWorkspace.name}
            </span>
          )}
        </div>

        <div className="behavior-settings__switch-wrapper">
          <label className="behavior-settings__switch">
            <input
              type="checkbox"
              checked={settings.autoUpdateStatus}
              onChange={() =>
                handleSettingChange(
                  "autoUpdateStatus",
                  !settings.autoUpdateStatus
                )
              }
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
      </div> */}

      <div className="behavior-settings__section">
        <h3>Presence detection</h3>

        <div className="behavior-settings__radio-group">
          <label className="behavior-settings__radio">
            <input
              type="radio"
              name="presenceDetection"
              value="auto"
              checked={settings.presenceDetection === "auto"}
              onChange={() => handleSettingChange("presenceDetection", "auto")}
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
              checked={settings.presenceDetection === "manual"}
              onChange={() =>
                handleSettingChange("presenceDetection", "manual")
              }
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
              checked={settings.visitorIdentification === "none"}
              onChange={() =>
                handleSettingChange("visitorIdentification", "none")
              }
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
              checked={settings.visitorIdentification === "prompt"}
              onChange={() =>
                handleSettingChange("visitorIdentification", "prompt")
              }
            />
            <span className="behavior-settings__radio-text">
              Prompt visitors for email and name
            </span>
          </label>
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
              checked={settings.autoResponseEnabled}
              onChange={() => handleSettingChange("autoResponseEnabled", true)}
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
              checked={!settings.autoResponseEnabled}
              onChange={() => handleSettingChange("autoResponseEnabled", false)}
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
            value={settings.autoResponseMessage}
            onChange={(e) =>
              handleSettingChange("autoResponseMessage", e.target.value)
            }
            disabled={!settings.autoResponseEnabled}
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
            value={settings.offlineTransition}
            onChange={(e) =>
              handleSettingChange("offlineTransition", e.target.value)
            }
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
              checked={settings.showUnreadCount}
              onChange={() => handleSettingChange("showUnreadCount", true)}
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
              checked={!settings.showUnreadCount}
              onChange={() => handleSettingChange("showUnreadCount", false)}
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
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default BehaviorSettings;
