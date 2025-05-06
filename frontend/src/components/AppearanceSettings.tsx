import React, { useState, useEffect } from "react";
import { workspaceService, Workspace } from "../services/workspaceService";
import { useParams } from "react-router-dom";
import "./AppearanceSettings.scss";

interface AppearanceSettingsProps {
  workspace?: Workspace;
}

const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({
  workspace,
}) => {
  const [loading, setLoading] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(
    null
  );
  const { id: workspaceId } = useParams<{ id: string }>();

  // Online mode settings
  const [titleBarColor, setTitleBarColor] = useState("#34419f");
  const [titleFontColor, setTitleFontColor] = useState("#fff");
  const [widgetStyle, setWidgetStyle] = useState("chip");
  const [greetingMessage, setGreetingMessage] = useState(
    "Question? Just type it below and we are online and ready to answer."
  );
  const [placeholderText, setPlaceholderText] = useState(
    "Type your message..."
  );

  // Alignment settings
  const [widgetAlignment, setWidgetAlignment] = useState("bottom-right");

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
    console.log("Saving appearance settings...");
  };

  if (loading) {
    return (
      <div className="appearance-settings__loading">Loading settings...</div>
    );
  }

  return (
    <div className="appearance-settings">
      <div className="appearance-settings__section">
        <h2 className="appearance-settings__section-title">Appearance</h2>

        <div className="appearance-settings__form-group">
          <div className="appearance-settings__form-group">
            <label className="appearance-settings__label">
              Alignment of widget
            </label>
            <div className="appearance-settings__radio-group">
              <label className="appearance-settings__radio">
                <input
                  type="radio"
                  name="widgetAlignment"
                  value="bottom-right"
                  checked={widgetAlignment === "bottom-right"}
                  onChange={() => setWidgetAlignment("bottom-right")}
                />
                <span className="appearance-settings__radio-text">
                  Bottom Right
                </span>
              </label>

              <label className="appearance-settings__radio">
                <input
                  type="radio"
                  name="widgetAlignment"
                  value="bottom-left"
                  checked={widgetAlignment === "bottom-left"}
                  onChange={() => setWidgetAlignment("bottom-left")}
                />
                <span className="appearance-settings__radio-text">
                  Bottom Left
                </span>
              </label>
            </div>
          </div>
          <label className="appearance-settings__label">Title bar color</label>
          <div className="appearance-settings__color-picker">
            <input
              type="text"
              className="appearance-settings__color-input"
              value={titleBarColor}
              onChange={(e) => setTitleBarColor(e.target.value)}
            />
            <div
              className="appearance-settings__color-preview"
              style={{ backgroundColor: titleBarColor }}
            >
              <input
                type="color"
                value={titleBarColor}
                onChange={(e) => setTitleBarColor(e.target.value)}
                className="appearance-settings__color-selector"
              />
            </div>
          </div>
          <span className="appearance-settings__help-text">
            CSS colors (include the preceding #)
          </span>
        </div>

        <div className="appearance-settings__form-group">
          <label className="appearance-settings__label">Title font color</label>
          <div className="appearance-settings__color-picker">
            <input
              type="text"
              className="appearance-settings__color-input"
              value={titleFontColor}
              onChange={(e) => setTitleFontColor(e.target.value)}
            />
            <div
              className="appearance-settings__color-preview"
              style={{ backgroundColor: titleFontColor }}
            >
              <input
                type="color"
                value={titleFontColor}
                onChange={(e) => setTitleFontColor(e.target.value)}
                className="appearance-settings__color-selector"
              />
            </div>
          </div>
        </div>

        <div className="appearance-settings__form-group">
          <label className="appearance-settings__label">
            Style of widget when closed
          </label>
          <div className="appearance-settings__radio-group">
            <label className="appearance-settings__radio">
              <input
                type="radio"
                name="widgetStyle"
                value="chip"
                checked={widgetStyle === "chip"}
                onChange={() => setWidgetStyle("chip")}
              />
              <span className="appearance-settings__radio-text">Chip</span>
            </label>

            <label className="appearance-settings__radio">
              <input
                type="radio"
                name="widgetStyle"
                value="button"
                checked={widgetStyle === "button"}
                onChange={() => setWidgetStyle("button")}
              />
              <span className="appearance-settings__radio-text">Button</span>
            </label>
          </div>
        </div>

        <div className="appearance-settings__form-group">
          <label className="appearance-settings__label">Greeting message</label>
          <textarea
            className="appearance-settings__textarea"
            value={greetingMessage}
            onChange={(e) => setGreetingMessage(e.target.value)}
            rows={3}
          />
          <span className="appearance-settings__help-text">
            The first message shown to visitors when they open the chat window.
          </span>
        </div>

        <div className="appearance-settings__form-group">
          <label className="appearance-settings__label">
            Message entry placeholder text
          </label>
          <input
            type="text"
            className="appearance-settings__text-input"
            value={placeholderText}
            onChange={(e) => setPlaceholderText(e.target.value)}
          />
        </div>

        <div className="appearance-settings__actions">
          <button
            className="appearance-settings__submit-button"
            onClick={handleSubmit}
            type="button"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettings;
