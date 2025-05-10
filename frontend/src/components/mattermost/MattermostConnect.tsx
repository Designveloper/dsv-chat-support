import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { mattermostService } from "../../services/mattermostService";
import Button from "../Button";
import MattermostLayout from "./MattermostLayout";

const MattermostConnect = () => {
  const navigate = useNavigate();

  // Form states
  const [serverUrl, setServerUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");

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
        // Extract workspaceId from response
        const extractedWorkspaceId = result.workspaceId;

        if (!extractedWorkspaceId) {
          setError("Couldn't get workspace ID from server response");
          setLoading(false);
          return;
        }

        // Store workspaceId in localStorage for subsequent steps
        localStorage.setItem("mattermost_workspace_id", extractedWorkspaceId);

        navigate(`/mattermost/team?workspaceId=${extractedWorkspaceId}`);
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

  return (
    <MattermostLayout title="Connect to Mattermost">
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

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

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
    </MattermostLayout>
  );
};

export default MattermostConnect;
