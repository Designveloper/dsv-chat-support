import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Workspace } from "../services/workspaceService";
import "./WidgetInstall.scss";

// Define the type for the context
type ContextType = { workspace: Workspace };

const WidgetInstall: React.FC = () => {
  const { workspace } = useOutletContext<ContextType>();
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const widgetId = workspace?.id || "";

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopyFeedback(`${type} copied!`);
        setTimeout(() => setCopyFeedback(null), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
        setCopyFeedback("Failed to copy");
        setTimeout(() => setCopyFeedback(null), 2000);
      });
  };

  return (
    <div className="widget-install">
      <h2>Widget Installation Instructions</h2>
      <p className="widget-install__workspace-info">
        Workspace: <strong>{workspace?.name}</strong>
      </p>

      <div className="widget-install__step">
        <h3>Step 1: Add the Script to Your HTML Head</h3>
        <p>
          Place this script in the head of your project's entry HTML file (i.e.
          index.html or app.html).
        </p>
        <div className="widget-install__code-block">
          <pre>
            <code>{`<script src="https://chat-support-7j2g.onrender.com/chat-widget.js" async></script>`}</code>
          </pre>
          <button
            className="widget-install__copy-btn"
            onClick={() =>
              copyToClipboard(
                '<script src="https://chat-support-7j2g.onrender.com/chat-widget.js" async></script>',
                "Script"
              )
            }
          >
            Copy
          </button>
        </div>
      </div>

      <div className="widget-install__step">
        <h3>Step 2: Add the Widget to Your Components</h3>
        <p>
          Place this code inside the component or page where you want the chat
          widget to appear:
        </p>
        <div className="widget-install__code-block">
          <pre>
            <code>{`<chat-support-widget widgetid="${widgetId}"></chat-support-widget>`}</code>
          </pre>
          <button
            className="widget-install__copy-btn"
            onClick={() =>
              copyToClipboard(
                `<chat-support-widget widgetid="${widgetId}"></chat-support-widget>`,
                "Widget code"
              )
            }
          >
            Copy
          </button>
        </div>
      </div>

      <div className="widget-install__step">
        <h3>Step 3: Verify Installation</h3>
        <p>
          After implementing both code snippets, verify that the chat widget
          appears on your website.
        </p>
        <p>
          If you have any issues with the installation, please contact our
          support team.
        </p>
      </div>

      {copyFeedback && (
        <div className="widget-install__feedback">{copyFeedback}</div>
      )}
    </div>
  );
};

export default WidgetInstall;
