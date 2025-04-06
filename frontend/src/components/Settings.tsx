import type React from "react";
import { useState } from "react";
import "./Settings.scss";
import Layout from "./Layout";
import WidgetInstall from "./WidgetInstall";
import BehaviorSettings from "./BehaviorSettings";

const Settings: React.FC = () => {
  const [activeContent, setActiveContent] = useState("behavior"); // Track active content tab

  // Handle content tab clicks
  const handleContentTabClick = (tab: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveContent(tab);
  };

  // Update the title based on active content
  //   const getTabTitle = () => {
  //     // Convert kebab-case to Title Case
  //     return activeContent
  //       .split("-")
  //       .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  //       .join(" ");
  //   };

  // Render settings content
  const settingsContent = (
    <>
      <div className="settings__header">
        {/* <h1 className="settings__title">#test-chatlio - {getTabTitle()}</h1> */}
        <div className="settings__tabs">
          <ul className="settings__tabs-list">
            <li
              className={`settings__tabs-item ${
                activeContent === "behavior"
                  ? "settings__tabs-item--active"
                  : ""
              }`}
            >
              <a
                href="#"
                className="settings__tabs-link"
                onClick={handleContentTabClick("behavior")}
              >
                Behavior
              </a>
            </li>
            <li
              className={`settings__tabs-item ${
                activeContent === "appearance"
                  ? "settings__tabs-item--active"
                  : ""
              }`}
            >
              <a
                href="#"
                className="settings__tabs-link"
                onClick={handleContentTabClick("appearance")}
              >
                Appearance
              </a>
            </li>
            <li
              className={`settings__tabs-item ${
                activeContent === "operating-hours"
                  ? "settings__tabs-item--active"
                  : ""
              }`}
            >
              <a
                href="#"
                className="settings__tabs-link"
                onClick={handleContentTabClick("operating-hours")}
              >
                Operating Hours
              </a>
            </li>
            <li
              className={`settings__tabs-item ${
                activeContent === "widget-install"
                  ? "settings__tabs-item--active"
                  : ""
              }`}
            >
              <a
                href="#"
                className="settings__tabs-link"
                onClick={handleContentTabClick("widget-install")}
              >
                Widget Install
              </a>
            </li>
            <li
              className={`settings__tabs-item ${
                activeContent === "saved-replies"
                  ? "settings__tabs-item--active"
                  : ""
              }`}
            >
              <a
                href="#"
                className="settings__tabs-link"
                onClick={handleContentTabClick("saved-replies")}
              >
                Saved Replies
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="settings__body">
        {activeContent === "behavior" && (
          <div className="settings__content-section">
            <BehaviorSettings />
          </div>
        )}
        {activeContent === "appearance" && (
          <div className="settings__content-section">
            <h2>Appearance Settings</h2>
            <p>Customize the look and feel of your chat widget.</p>
          </div>
        )}
        {activeContent === "operating-hours" && (
          <div className="settings__content-section">
            <h2>Operating Hours</h2>
            <p>Set when your chat service is available.</p>
          </div>
        )}
        {activeContent === "widget-install" && (
          <div className="settings__content-section">
            <WidgetInstall />
          </div>
        )}
        {activeContent === "saved-replies" && (
          <div className="settings__content-section">
            <h2>Saved Replies</h2>
            <p>Create templates for common responses.</p>
          </div>
        )}
      </div>
    </>
  );

  return <Layout>{settingsContent}</Layout>;
};

export default Settings;
