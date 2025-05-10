import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { mattermostService } from "../../services/mattermostService";
import Button from "../Button";
import MattermostLayout from "./MattermostLayout";

const MattermostBot = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const workspaceId =
    queryParams.get("workspaceId") ||
    localStorage.getItem("mattermost_workspace_id") ||
    "";

  // Form states
  const [botToken, setBotToken] = useState("");

  // UI states
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If no workspaceId, redirect back to first step
    if (!workspaceId) {
      navigate("/mattermost/connect");
    }
  }, [workspaceId, navigate]);

  const handleConnectBot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await mattermostService.connectBot(workspaceId, botToken);

      if (result.success) {
        navigate(`/mattermost/channel?workspaceId=${workspaceId}`);
      } else {
        setError(result.message || "Failed to connect bot");
      }
    } catch (error) {
      setError("Error connecting bot. Please check your bot token.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MattermostLayout title="Connect Bot Account">
      <form onSubmit={handleConnectBot} className="mattermost-form">
        <h2>Connect Bot Account</h2>
        <p>
          Add a bot token to enable posting messages as a dedicated bot. This is
          required for proper message attribution in your Mattermost channels.
        </p>

        <div className="bot-instructions">
          <h3>How to create a Mattermost bot:</h3>
          <ol>
            <li>Log in to Mattermost as a System Admin</li>
            <li>
              Go to <strong>System Console</strong> →{" "}
              <strong>Integrations</strong> → <strong>Bot Accounts</strong>
            </li>
            <li>Enable bot accounts if not already enabled</li>
            <li>
              Click <strong>Integrations</strong> →{" "}
              <strong>Bot Accounts</strong> in the left menu
            </li>
            <li>
              Click <strong>Add Bot Account</strong>
            </li>
            <li>
              Fill in the required fields:
              <ul>
                <li>
                  <strong>Username:</strong> Choose a name (e.g., support-bot)
                </li>
                <li>
                  <strong>Display Name:</strong> How the bot will appear (e.g.,
                  Support Bot)
                </li>
                <li>
                  <strong>Description:</strong> "Bot for customer support
                  notifications"
                </li>
                <li>
                  Enable <strong>Post All</strong> permission
                </li>
              </ul>
            </li>
            <li>
              Click <strong>Create Bot Account</strong>
            </li>
            <li>
              On the next screen, copy the <strong>Token</strong>
            </li>
            <li>Paste the token below</li>
          </ol>
          <div className="note-box">
            <strong>Why a bot is required:</strong> The bot will post
            notifications when new messages arrive from customers. This ensures
            visitor messages are clearly distinguished from staff responses,
            improving your team's workflow.
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="bot-token">Bot Token</label>
          <input
            id="bot-token"
            type="text"
            placeholder="Enter your bot's access token"
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            required
          />
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        <div className="form-actions">
          <Button
            label="Back"
            onClick={() => {
              const teamId = localStorage.getItem("mattermost_selected_team");
              navigate(
                `/mattermost/team?workspaceId=${workspaceId}${
                  teamId ? `&teamId=${teamId}` : ""
                }`
              );
            }}
            variant="secondary"
            disabled={loading}
          />
          <Button
            label={loading ? "Connecting" : "Connect Bot"}
            type="submit"
            disabled={loading || !botToken}
          />
        </div>
      </form>
    </MattermostLayout>
  );
};

export default MattermostBot;
