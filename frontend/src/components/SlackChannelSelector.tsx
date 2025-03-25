import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios, { AxiosError } from "axios";
import "./SlackChannelSelector.scss";

// Define types for better type safety
interface SlackChannel {
  id: string;
  name: string;
  is_member: boolean;
  num_members: number;
}

interface ChannelsResponse {
  channels: SlackChannel[];
}

const SlackChannelSelector = () => {
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Extract workspaceId from URL
    const params = new URLSearchParams(location.search);
    const id = params.get("workspaceId");

    if (!id) {
      setError("Workspace ID not found in URL");
      setLoading(false);
      return;
    }

    setWorkspaceId(id);
    fetchChannels(id);
  }, [location]);

  const fetchChannels = async (id: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await axios.get<ChannelsResponse>(
        `http://localhost:3000/slack/channels?workspaceId=${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data && response.data.channels) {
        setChannels(response.data.channels);
      } else {
        setChannels([]);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching channels:", err);
      const axiosError = err as AxiosError<{ message: string }>;
      const errorMessage =
        axiosError.response?.data?.message ||
        axiosError.message ||
        "Failed to load channels. Please try again.";
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleChannelSelect = async () => {
    if (!selectedChannel) {
      setError("Please select a channel");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      await axios.post(
        "http://localhost:3000/slack/select-channel",
        {
          workspaceId,
          channelId: selectedChannel,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Redirect back to dashboard with success message
      navigate("/dashboard?slackConnected=true");
    } catch (err) {
      console.error("Error selecting channel:", err);
      const axiosError = err as AxiosError<{ message: string }>;
      const errorMessage =
        axiosError.response?.data?.message ||
        axiosError.message ||
        "Failed to save channel selection";
      setError(errorMessage);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="channel-selector-loading">
        Loading available channels...
      </div>
    );
  }

  return (
    <div className="channel-selector">
      <div className="channel-selector-container">
        <h1>Select a Slack Channel</h1>
        <p>Choose a channel where visitor chat notifications will be sent:</p>

        {error && <div className="channel-selector-error">{error}</div>}

        {channels.length === 0 ? (
          <div className="no-channels">
            <p>
              No channels found. Please create a channel in your Slack workspace
              first.
            </p>
            <button
              className="back-button"
              onClick={() => navigate("/dashboard")}
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <>
            <div className="channels-list">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className={`channel-item ${
                    selectedChannel === channel.id ? "selected" : ""
                  }`}
                  onClick={() => setSelectedChannel(channel.id)}
                >
                  <div className="channel-radio">
                    <input
                      type="radio"
                      name="channel"
                      checked={selectedChannel === channel.id}
                      onChange={() => setSelectedChannel(channel.id)}
                      id={`channel-${channel.id}`}
                    />
                  </div>
                  <div className="channel-details">
                    <label htmlFor={`channel-${channel.id}`}>
                      <span className="channel-name">#{channel.name}</span>
                      <span className="channel-members">
                        {channel.num_members} members
                      </span>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="channel-selector-actions">
              <button
                className="skip-button"
                onClick={() => navigate("/dashboard")}
              >
                Skip
              </button>
              <button
                className="select-button"
                onClick={handleChannelSelect}
                disabled={!selectedChannel}
              >
                Select Channel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SlackChannelSelector;
