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
  const [titleText, setTitleText] = useState("How can we help you?");
  const [widgetStyle, setWidgetStyle] = useState("chip");
  const [greetingMessage, setGreetingMessage] = useState(
    "Question? Just type it below and we are online and ready to answer."
  );
  const [placeholderText, setPlaceholderText] = useState(
    "Type message here..."
  );

  // Offline mode settings
  const [offlineTitleText, setOfflineTitleText] = useState("Contact Us");
  const [offlineGreeting, setOfflineGreeting] = useState(
    "Sorry we are away, but we would love to hear from you and chat soon!"
  );
  const [offlineEmailPlaceholder, setOfflineEmailPlaceholder] =
    useState("Email");
  const [offlineMessagePlaceholder, setOfflineMessagePlaceholder] =
    useState("Your message here");
  const [offlineNamePlaceholder, setOfflineNamePlaceholder] = useState(
    "Name (optional but helpful)"
  );
  const [offlineSendButton, setOfflineSendButton] = useState("Send");
  const [offlineThankYou, setOfflineThankYou] = useState(
    "Thanks for your message. We will be in touch soon!"
  );
  const [offlineEmailSubject, setOfflineEmailSubject] = useState(
    "Live-chat offline message from"
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
      <div className="appearance-settings__intro">
        <p>
          Use this tab to change labels and colors used by your chat widget. For
          most users the defaults will work just fine, but if you want to
          translate to another language or otherwise tweak the communication,
          this is for you.
        </p>
      </div>

      {/* Online Mode Section */}
      <div className="appearance-settings__section">
        <h2 className="appearance-settings__section-title">Online mode</h2>

        <div className="appearance-settings__form-group">
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
            Title bar text when online
          </label>
          <input
            type="text"
            className="appearance-settings__text-input"
            value={titleText}
            onChange={(e) => setTitleText(e.target.value)}
          />
          <span className="appearance-settings__help-text">
            Text shown on the title bar.
          </span>
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
                value="collapsed"
                checked={widgetStyle === "collapsed"}
                onChange={() => setWidgetStyle("collapsed")}
              />
              <span className="appearance-settings__radio-text">
                Collapsed widget image
              </span>
            </label>

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

            <label className="appearance-settings__radio">
              <input
                type="radio"
                name="widgetStyle"
                value="tab"
                checked={widgetStyle === "tab"}
                onChange={() => setWidgetStyle("tab")}
              />
              <span className="appearance-settings__radio-text">Tab</span>
            </label>

            <label className="appearance-settings__radio">
              <input
                type="radio"
                name="widgetStyle"
                value="hidden"
                checked={widgetStyle === "hidden"}
                onChange={() => setWidgetStyle("hidden")}
              />
              <span className="appearance-settings__radio-text">
                Hidden (use your own button/link to open)
              </span>
            </label>
          </div>
          <span className="appearance-settings__help-text">
            Note: chip and tab will always display as button on mobile
          </span>
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

      {/* Offline Mode Section */}
      <div className="appearance-settings__section">
        <h2 className="appearance-settings__section-title">Offline mode</h2>

        <div className="appearance-settings__form-group">
          <label className="appearance-settings__label">
            Title bar text when offline
          </label>
          <input
            type="text"
            className="appearance-settings__text-input"
            value={offlineTitleText}
            onChange={(e) => setOfflineTitleText(e.target.value)}
          />
        </div>

        <div className="appearance-settings__form-group">
          <label className="appearance-settings__label">
            Offline greeting message
          </label>
          <textarea
            className="appearance-settings__textarea"
            value={offlineGreeting}
            onChange={(e) => setOfflineGreeting(e.target.value)}
            rows={3}
          />
        </div>

        <div className="appearance-settings__form-group">
          <label className="appearance-settings__label">
            Offline email placeholder text
          </label>
          <input
            type="text"
            className="appearance-settings__text-input"
            value={offlineEmailPlaceholder}
            onChange={(e) => setOfflineEmailPlaceholder(e.target.value)}
          />
        </div>

        <div className="appearance-settings__form-group">
          <label className="appearance-settings__label">
            Offline message placeholder text
          </label>
          <input
            type="text"
            className="appearance-settings__text-input"
            value={offlineMessagePlaceholder}
            onChange={(e) => setOfflineMessagePlaceholder(e.target.value)}
          />
        </div>

        <div className="appearance-settings__form-group">
          <label className="appearance-settings__label">
            Offline name placeholder text
          </label>
          <input
            type="text"
            className="appearance-settings__text-input"
            value={offlineNamePlaceholder}
            onChange={(e) => setOfflineNamePlaceholder(e.target.value)}
          />
        </div>

        <div className="appearance-settings__form-group">
          <label className="appearance-settings__label">
            Offline send button label
          </label>
          <input
            type="text"
            className="appearance-settings__text-input"
            value={offlineSendButton}
            onChange={(e) => setOfflineSendButton(e.target.value)}
          />
        </div>

        <div className="appearance-settings__form-group">
          <label className="appearance-settings__label">
            Offline thank you message
          </label>
          <textarea
            className="appearance-settings__textarea"
            value={offlineThankYou}
            onChange={(e) => setOfflineThankYou(e.target.value)}
            rows={3}
          />
          <span className="appearance-settings__help-text">
            Text shown to visitors after they sent their offline message.
          </span>
        </div>

        <div className="appearance-settings__form-group">
          <label className="appearance-settings__label">
            Offline email subject
          </label>
          <input
            type="text"
            className="appearance-settings__text-input"
            value={offlineEmailSubject}
            onChange={(e) => setOfflineEmailSubject(e.target.value)}
          />
          <span className="appearance-settings__help-text">
            The subject line of offline messages delivered to you as emails. The
            visitor's email will be appended to this string.
          </span>
        </div>

        {/* <div className="appearance-settings__widget-preview">
          <h3 className="appearance-settings__preview-title">
            Sample of offline widget
          </h3>
          <div className="appearance-settings__preview-image">
            <img
              src="/images/offline-widget-example.png"
              alt="Widget offline example"
            />
          </div>
          <span className="appearance-settings__help-text">
            (this is an image and does not update)
          </span>
        </div> */}

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

      {/* Alignment Section */}
      <div className="appearance-settings__section">
        <h2 className="appearance-settings__section-title">Alignment</h2>

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
