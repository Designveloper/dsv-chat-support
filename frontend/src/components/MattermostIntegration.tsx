import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MattermostIntegration.scss";
import { mattermostService, Channel } from "../services/mattermostService";
import Button from "./Button";
import Layout from "./Layout";
import { useAuth } from "../context/AuthContext";

const MattermostIntegration = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [step, setStep] = useState(1);
  const [serverUrl, setServerUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [botToken, setBotToken] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("");

  // Data states
  const [workspaceId, setWorkspaceId] = useState("");
  const [channels, setChannels] = useState<Channel[]>([]);

  // UI states
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConnectServer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await mattermostService.connectToMattermost(
        serverUrl,
        username,
        password,
        workspaceName
      );

      if (result.success) {
        // Extract workspaceId from redirectUrl if it's not directly provided in the response
        let extractedWorkspaceId = result.workspaceId;

        if (!extractedWorkspaceId && result.redirectUrl) {
          // Extract from URL parameter
          const urlParams = new URLSearchParams(
            result.redirectUrl.split("?")[1]
          );
          extractedWorkspaceId = urlParams.get("workspaceId");
          console.log(
            "Extracted workspaceId from redirectUrl:",
            extractedWorkspaceId
          );
        }

        if (!extractedWorkspaceId) {
          setError("Couldn't get workspace ID from server response");
          setLoading(false);
          return;
        }

        setWorkspaceId(extractedWorkspaceId);
        console.log("Setting workspaceId to:", extractedWorkspaceId);
        setStep(2);
      } else {
        setError(result.message || "Failed to connect to Mattermost server");
      }
    } catch (error) {
      console.error("Connection error:", error);
      setError(
        "Error connecting to Mattermost. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConnectBot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await mattermostService.connectBot(workspaceId, botToken);

      if (result.success) {
        // Fetch channels after connecting bot
        const channelsData = await mattermostService.getChannels(workspaceId);
        setChannels(channelsData || []);
        setStep(3);
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

  const handleSelectChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await mattermostService.selectChannel(
        workspaceId,
        selectedChannel
      );

      if (result.success) {
        // Redirect back to dashboard with success message
        navigate("/?mattermostConnected=true");
      } else {
        setError(result.message || "Failed to select channel");
      }
    } catch (error) {
      setError("Error selecting channel.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <form onSubmit={handleConnectServer} className="mattermost-form">
            <h2>Connect to Mattermost Server</h2>
            <p>Enter your Mattermost server details to connect</p>

            <div className="form-group">
              <label htmlFor="server-url">Server URL</label>
              <input
                id="server-url"
                type="text"
                placeholder="https://your-mattermost-server.com"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                required
              />
              <small>Enter the full URL to your Mattermost server</small>
            </div>

            <div className="form-group">
              <label htmlFor="workspace-name">Workspace Name</label>
              <input
                id="workspace-name"
                type="text"
                placeholder="My Workspace"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-actions">
              <Button
                label="Cancel"
                onClick={() => navigate("/dashboard")}
                className="button-secondary"
              />
              <Button
                label={loading ? "Connecting..." : "Connect"}
                type="submit"
                disabled={loading}
              />
            </div>
          </form>
        );

      case 2:
        return (
          <form onSubmit={handleConnectBot} className="mattermost-form">
            <h2>Connect Bot Account (Optional)</h2>
            <p>Add a bot token to enable advanced features</p>

            <div className="form-group">
              <label htmlFor="bot-token">Bot Token</label>
              <input
                id="bot-token"
                type="text"
                placeholder="xoxb-your-bot-token"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
              />
              <small>
                You can skip this step if you don't have a bot token yet
              </small>
            </div>

            <div className="form-actions">
              <Button
                label="Skip"
                onClick={async () => {
                  try {
                    setLoading(true);
                    const channelsData = await mattermostService.getChannels(
                      workspaceId
                    );
                    setChannels(channelsData || []);
                    setStep(3);
                  } catch (error) {
                    setError("Failed to fetch channels");
                  } finally {
                    setLoading(false);
                  }
                }}
                className="button-secondary"
                disabled={loading}
              />
              <Button
                label={loading ? "Connecting..." : "Connect Bot"}
                type="submit"
                disabled={loading}
              />
            </div>
          </form>
        );

      case 3:
        return (
          <form onSubmit={handleSelectChannel} className="mattermost-form">
            <h2>Select Channel</h2>
            <p>Choose a channel to receive support chat notifications</p>

            {channels.length === 0 ? (
              <div className="no-channels">
                <p>
                  No channels found. You may need to create a channel in your
                  Mattermost server first.
                </p>
              </div>
            ) : (
              <div className="form-group">
                <label htmlFor="channel">Channel</label>
                <select
                  id="channel"
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  required
                >
                  <option value="">Select a channel</option>
                  {channels.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      {channel.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-actions">
              <Button
                label="Skip"
                onClick={() => navigate("/?mattermostConnected=true")}
                className="button-secondary"
                disabled={loading}
              />
              <Button
                label={loading ? "Saving..." : "Save"}
                type="submit"
                disabled={loading || !selectedChannel}
              />
            </div>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="mattermost-integration">
        <div className="mattermost-integration__header">
          <h1>Mattermost Integration</h1>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        <div className="mattermost-integration__content">
          <div className="steps-indicator">
            <div className={`step ${step >= 1 ? "step--active" : ""}`}>
              1. Connect
            </div>
            <div className={`step ${step >= 2 ? "step--active" : ""}`}>
              2. Bot Setup
            </div>
            <div className={`step ${step >= 3 ? "step--active" : ""}`}>
              3. Channel
            </div>
          </div>

          {renderStepContent()}
        </div>
      </div>
    </Layout>
  );
};

export default MattermostIntegration;
