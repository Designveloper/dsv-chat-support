import React, { useState, useEffect, useRef } from "react";
import { Workspace } from "../services/workspaceService";
import { useOutletContext } from "react-router-dom";
import { workspaceSettingsService } from "../services/workspaceSettingsService";
// import { chatService } from "../services/chatService";
import "./BehaviorSettings.scss";

type ContextType = { workspace: Workspace | null };

// Define a type for the settings state
interface SettingsState {
  presenceDetection?: string;
  visitorIdentification?: string;
  noResponseAction?: string;
  noResponseDelay?: string;
  showUnreadCount?: boolean;
  playSound?: boolean;
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

  const [settings, setSettings] = useState<SettingsState>({} as SettingsState);

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
      const fetchedSettings = await workspaceSettingsService.getSettings(
        workspaceId
      );

      // Map backend settings to frontend state - remove fallbacks
      const mappedSettings: SettingsState = {
        presenceDetection: fetchedSettings.presence_detection,
        visitorIdentification: fetchedSettings.visitor_identification,
        noResponseAction: fetchedSettings.no_response_action,
        noResponseDelay: fetchedSettings.no_response_delay,
        showUnreadCount: fetchedSettings.show_unread_count,
        playSound: fetchedSettings.play_sound,
      };
      console.log("Fetched settings:", fetchedSettings);
      console.log("Mapped settings:", mappedSettings);
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
      const changedSettings: Record<string, unknown> = {};
      const original = originalSettingsRef.current;

      if (!original) {
        setError(
          "Unable to determine changed settings. Please reload the page."
        );
        setLoading(false);
        return;
      }

      const settingsKeys: (keyof SettingsState)[] = [
        "presenceDetection",
        "visitorIdentification",
        "noResponseAction",
        "noResponseDelay",
        "showUnreadCount",
        "playSound",
      ];

      for (const key of settingsKeys) {
        if (settings[key] !== original[key]) {
          changedSettings[key] = settings[key];
        }
      }

      console.log("Original settings:", original);
      console.log("Current settings:", settings);
      console.log("Changed settings:", changedSettings);

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
          What should happen if no one responds to a visitor's first message?
        </h3>

        <div className="behavior-settings__radio-group">
          <label className="behavior-settings__radio">
            <input
              type="radio"
              name="noResponseAction"
              value="send warning"
              checked={settings.noResponseAction === "send warning"}
              onChange={() =>
                handleSettingChange("noResponseAction", "send warning")
              }
            />
            <span className="behavior-settings__radio-text">
              Send warning notifications every
              <select
                value={settings.noResponseDelay || "30sec"}
                onChange={(e) =>
                  handleSettingChange("noResponseDelay", e.target.value)
                }
                // disabled={settings.noResponseAction !== "send warning"}
                className="behavior-settings__inline-select"
              >
                <option value="30sec">30 secs</option>
                <option value="1min">1 minute</option>
                <option value="2min">2 minutes</option>
                <option value="5min">5 minutes</option>
              </select>
              until a visitor receives a reply
            </span>
          </label>

          <label className="behavior-settings__radio">
            <input
              type="radio"
              name="noResponseAction"
              value="no warnings"
              checked={settings.noResponseAction === "no warnings"}
              onChange={() =>
                handleSettingChange("noResponseAction", "no warnings")
              }
            />
            <span className="behavior-settings__radio-text">
              Do not send warnings
            </span>
          </label>
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
