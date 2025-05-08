import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MattermostIntegration.scss";
import {
  mattermostService,
  Channel,
  Team,
} from "../services/mattermostService";
import Button from "./Button";
import Layout from "./Layout";

const MattermostIntegration = () => {
  const navigate = useNavigate();

  // Form states
  const [step, setStep] = useState(1);
  const [serverUrl, setServerUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [botToken, setBotToken] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("");

  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState("");

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
        // Fetch teams and move to team selection step
        try {
          const teamsData = await mattermostService.getTeams(
            extractedWorkspaceId
          );
          if (teamsData && teamsData.length > 0) {
            setTeams(teamsData);
            setStep(2);
          } else {
            setError("No teams found in your Mattermost account");
          }
        } catch (teamsError) {
          console.error("Error fetching teams:", teamsError);
          setError("Failed to fetch teams from Mattermost");
        }
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

  const handleSelectTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await mattermostService.selectTeam(
        workspaceId,
        selectedTeam
      );

      if (result.success) {
        // After team is selected, move to bot setup step
        setStep(3); // Now bot setup is step 3
      } else {
        setError(result.message || "Failed to select team");
      }
    } catch (error) {
      setError("Error selecting team.");
      console.error(error);
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
        setStep(4);
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
                variant="secondary"
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
          <form onSubmit={handleSelectTeam} className="mattermost-form">
            <h2>Select Mattermost Team</h2>
            <p>Choose a team to use for support chats</p>

            {teams.length === 0 ? (
              <div className="no-teams">
                <p>
                  No teams found. You may need to create a team in your
                  Mattermost server first.
                </p>
              </div>
            ) : (
              <div className="form-group">
                <label htmlFor="team">Team</label>
                <select
                  id="team"
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  required
                >
                  <option value="">Select a team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-actions">
              <Button
                label="Back"
                onClick={() => setStep(1)}
                variant="secondary"
                disabled={loading}
              />
              <Button
                label={loading ? "Selecting..." : "Select Team"}
                type="submit"
                disabled={loading || !selectedTeam}
              />
            </div>
          </form>
        );

      case 3:
        return (
          <form onSubmit={handleConnectBot} className="mattermost-form">
            <h2>Connect Bot Account</h2>
            <p>
              Add a bot token to enable posting messages as a dedicated bot.
              This is required for proper message attribution in your Mattermost
              channels.
            </p>

            <div className="bot-instructions">
              <h3>How to create a Mattermost bot:</h3>
              <ol>
                <li>Log in to Mattermost as a System Admin</li>
                <li>
                  Go to <strong>System Console</strong> →{" "}
                  <strong>Integrations</strong> → <strong>Bot Accounts</strong>
                </li>
                <li>
                  Click <strong>Add Bot Account</strong>
                </li>
                <li>
                  Fill in the required fields:
                  <ul>
                    <li>
                      <strong>Username:</strong> Choose a name (e.g.,
                      support-bot)
                    </li>
                    <li>
                      <strong>Display Name:</strong> How the bot will appear
                      (e.g., Support Bot)
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
                  On the next screen, copy the <strong>Access Token</strong>
                </li>
                <li>Paste the token below</li>
              </ol>
              <div className="note-box">
                <strong>Why a bot is required:</strong> The bot will post
                notifications when new messages arrive from customers. This
                ensures visitor messages are clearly distinguished from staff
                responses, improving your team's workflow.
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

            <div className="form-actions">
              <Button
                label="Back"
                onClick={() => setStep(2)}
                variant="secondary"
                disabled={loading}
              />
              <Button
                label={loading ? "Connecting..." : "Connect Bot"}
                type="submit"
                disabled={loading || !botToken}
              />
            </div>
          </form>
        );
      case 4:
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
                variant="secondary"
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
              2. Team
            </div>
            <div className={`step ${step >= 3 ? "step--active" : ""}`}>
              3. Bot Setup
            </div>
            <div className={`step ${step >= 4 ? "step--active" : ""}`}>
              4. Channel
            </div>
          </div>

          {renderStepContent()}
        </div>
      </div>
    </Layout>
  );
};

export default MattermostIntegration;
