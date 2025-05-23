import React, { useState, useEffect, useRef } from "react";
import { Workspace } from "../services/workspaceService";
import { useOutletContext } from "react-router-dom";
import { workspaceSettingsService } from "../services/workspaceSettingsService";
// import { chatService } from "../services/chatService";
import "./BehaviorSettings.scss";
// import ChatWidget from "./ChatWidget";

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
  const [saveLoading, setSaveLoading] = useState(false);

  const [settings, setSettings] = useState<SettingsState>({} as SettingsState);

  const originalSettingsRef = useRef<SettingsState | null>(null);

  useEffect(() => {
    if (workspace) {
      setCurrentWorkspace(workspace);
      loadWorkspaceSettings(workspace.id);
    }
  }, [workspace]);

  const loadWorkspaceSettings = async (workspaceId: string) => {
    setLoading(true);
    setError(null);
    try {
      const fetchedSettings = await workspaceSettingsService.getSettings(
        workspaceId
      );
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

      setSettings(mappedSettings);

      originalSettingsRef.current = { ...mappedSettings };
    } catch (error) {
      console.error("Error loading settings:", error);
      setError("Failed to load settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
    setSaveLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!currentWorkspace) {
      setError("No workspace selected");
      setSaveLoading(false);
      return;
    }

    try {
      const changedSettings: Record<string, unknown> = {};
      const original = originalSettingsRef.current;

      if (!original) {
        setError(
          "Unable to determine changed settings. Please reload the page."
        );
        setSaveLoading(false);
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
        setSaveLoading(false);
        return;
      }

      console.log("Updating with changed settings:", changedSettings);

      await workspaceSettingsService.updateSettings(
        currentWorkspace.id,
        changedSettings
      );

      originalSettingsRef.current = { ...settings };

      setSuccessMessage(`Settings saved successfully!`);

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setError("Failed to save settings. Please try again.");
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="behavior-settings__loading">
        <div className="loading">
          <div className="loading__spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="behavior-settings__error">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="behavior-settings">
      {/* <ChatWidget workspaceId="6821af37-8d27-4b1f-8741-4a451a529104" /> */}
      <h2>Widget behavior</h2>

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
              {currentWorkspace?.name || "this channel"} and turn chat on
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

      <div className="behavior-settings__section">
        <h3>Play sound for new messages?</h3>

        <div className="behavior-settings__radio-group">
          <label className="behavior-settings__radio">
            <input
              type="radio"
              name="playSound"
              value="yes"
              checked={settings.playSound}
              onChange={() => handleSettingChange("playSound", true)}
            />
            <span className="behavior-settings__radio-text">
              Play sound when a new message is sent to the widget
            </span>
          </label>

          <label className="behavior-settings__radio">
            <input
              type="radio"
              name="playSound"
              value="no"
              checked={!settings.playSound}
              onChange={() => handleSettingChange("playSound", false)}
            />
            <span className="behavior-settings__radio-text">
              Do not play sound when a new message is sent to the widget
            </span>
          </label>
        </div>
      </div>

      {successMessage && (
        <div className="behavior-settings__success">{successMessage}</div>
      )}

      <div className="behavior-settings__actions">
        <button
          className="behavior-settings__submit-button"
          onClick={handleSubmit}
          type="button"
          disabled={loading}
        >
          {saveLoading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default BehaviorSettings;
