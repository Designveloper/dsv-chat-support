import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { authService } from "../services/authService";
import "./SlackChannelSelector.scss";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

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

  const executeWithTokenRefresh = async <T,>(
    apiCall: () => Promise<T>
  ): Promise<T> => {
    try {
      return await apiCall();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        try {
          await authService.refreshAccessToken();
          // Retry the original request with new token
          return await apiCall();
        } catch (refreshError) {
          console.error("Failed to refresh token:", refreshError);
          setError("Session expired. Please login again.");
          navigate("/login");
          throw new Error("Session expired");
        }
      }
      // If error is not related to authentication, rethrow it
      throw error;
    }
  };

  const fetchChannels = async (id: string) => {
    try {
      await executeWithTokenRefresh(async () => {
        const token = authService.getAccessToken();
        if (!token) {
          throw new Error("Authentication token not found");
        }

        const response = await axios.get<ChannelsResponse>(
          `${API_URL}/slack/channels?workspaceId=${id}`,
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
        return response;
      });
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
      await executeWithTokenRefresh(async () => {
        const token = authService.getAccessToken();
        if (!token) {
          throw new Error("Authentication token not found");
        }

        return axios.post(
          `${API_URL}/slack/select-channel`,
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
      });

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
      <div className="channel-selector__loading">
        Loading available channels...
      </div>
    );
  }

  return (
    <div className="channel-selector">
      <div className="channel-selector__container">
        <h1>Select a Slack Channel</h1>
        <p>Choose a channel where visitor chat notifications will be sent:</p>

        {error && <div className="channel-selector__error">{error}</div>}

        {channels.length === 0 ? (
          <div className="channel-selector__no-channels">
            <p>
              No channels found. Please create a channel in your Slack workspace
              first.
            </p>
            <button
              className="channel-selector__back-button"
              onClick={() => navigate("/dashboard")}
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <>
            <div className="channel-selector__list">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className={`channel-selector__item ${
                    selectedChannel === channel.id
                      ? "channel-selector__item--selected"
                      : ""
                  }`}
                  onClick={() => setSelectedChannel(channel.id)}
                >
                  <div className="channel-selector__radio">
                    <input
                      type="radio"
                      name="channel"
                      checked={selectedChannel === channel.id}
                      onChange={() => setSelectedChannel(channel.id)}
                      id={`channel-${channel.id}`}
                    />
                  </div>
                  <div className="channel-selector__details">
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

            <div className="channel-selector__actions">
              <button
                className="channel-selector__select-button"
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
