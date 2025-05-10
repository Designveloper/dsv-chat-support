import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { mattermostService, Channel } from "../../services/mattermostService";
import Button from "../Button";
import MattermostLayout from "./MattermostLayout";

const MattermostChannel = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const workspaceId =
    queryParams.get("workspaceId") ||
    localStorage.getItem("mattermost_workspace_id") ||
    "";

  // Form states
  const [selectedChannel, setSelectedChannel] = useState("");
  const [channels, setChannels] = useState<Channel[]>([]);

  // UI states
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If no workspaceId, redirect back to first step
    if (!workspaceId) {
      navigate("/mattermost/connect");
      return;
    }

    fetchChannels();
  }, [workspaceId, navigate]);

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const channelsData = await mattermostService.getChannels(workspaceId);
      if (channelsData && channelsData.length > 0) {
        setChannels(channelsData);
      } else {
        setError("No channels found in your Mattermost team");
      }
    } catch (error) {
      console.error("Error fetching channels:", error);
      setError("Failed to fetch channels from Mattermost");
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
        // Clear localStorage mattermost data after successful completion
        localStorage.removeItem("mattermost_workspace_id");
        localStorage.removeItem("mattermost_selected_team");

        // Redirect back to dashboard with success message
        navigate("/dashboard");
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

  return (
    <MattermostLayout error={error} title="Select Channel">
      <form onSubmit={handleSelectChannel} className="mattermost-form">
        <h2>Select Channel</h2>
        <p>Choose a channel to receive support chat notifications</p>

        {loading ? (
          <div className="loading">
            <div className="loading__spinner"></div>
          </div>
        ) : channels.length === 0 ? (
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
            label="Back"
            onClick={() =>
              navigate(`/mattermost/bot?workspaceId=${workspaceId}`)
            }
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
    </MattermostLayout>
  );
};

export default MattermostChannel;
