import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Dashboard.scss";
import { useAuth } from "../context/AuthContext";

// Define workspace interface
interface Workspace {
  id: string;
  name: string;
  owner_id: number;
  createdAt: string;
  updatedAt?: string;
  bot_token_slack?: string;
  selected_channel_id?: string;
  service_slack_account_id?: string;
  service_type_slack?: string;
}

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [slackConnected, setSlackConnected] = useState(false);
  const [isSlackLoading, setIsSlackLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkspaces();
    // Check URL parameters
    const params = new URLSearchParams(location.search);
    if (params.get("slackConnected") === "true") {
      setSlackConnected(true);
    }
    if (params.get("error")) {
      setError(params.get("error"));
    }
  }, [location]);

  const fetchWorkspaces = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get<Workspace[]>(
        "http://localhost:3000/workspace",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Workspaces:", response.data);

      setWorkspaces(response.data);

      // Check if any workspace has Slack connected
      const hasSlackIntegration = response.data.some(
        (workspace: Workspace) => workspace.bot_token_slack
      );

      setSlackConnected(hasSlackIntegration);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching workspaces:", error);
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(
        "http://localhost:3000/workspace",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Refresh workspaces list
      await fetchWorkspaces();
    } catch (error) {
      console.error("Error creating workspace:", error);
    }
  };

  const handleAddToSlack = async () => {
    try {
      setIsSlackLoading(true);
      const token = localStorage.getItem("accessToken");
      const response = await axios.get("http://localhost:3000/slack/auth-url", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Redirect to the Slack OAuth URL
      window.location.href = response.data.url;
    } catch (error) {
      console.error("Error getting Slack auth URL:", error);
      setError("Failed to connect to Slack. Please try again.");
      setIsSlackLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Chat Support Dashboard</h1>
        <div className="user-controls">
          <span>Welcome, {user?.email}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      {error && (
        <div className="alert alert-danger">
          Error: {error.replace(/_/g, " ")}
        </div>
      )}

      {slackConnected && (
        <div className="alert alert-success">
          Slack has been successfully connected to your workspace!
        </div>
      )}

      <div className="dashboard-content">
        <section className="workspaces-section">
          <div className="section-header">
            <h2>Your Workspaces</h2>
            <button onClick={handleCreateWorkspace} className="btn">
              Create Workspace
            </button>
          </div>

          {workspaces.length === 0 ? (
            <div className="no-workspaces">
              <p>
                You don't have any workspaces yet. Create one to get started.
              </p>
            </div>
          ) : (
            <div className="workspaces-list">
              {workspaces.map((workspace) => (
                <div key={workspace.id} className="workspace-card">
                  <h3>{workspace.name}</h3>
                  <div className="workspace-details">
                    <p>
                      Created:{" "}
                      {new Date(workspace.createdAt).toLocaleDateString()}
                    </p>
                    <p>
                      Slack:{" "}
                      {workspace.bot_token_slack ? (
                        <span className="badge badge-success">Connected</span>
                      ) : (
                        <span className="badge badge-secondary">
                          Not connected
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="integrations-section">
          <h2>Integrations</h2>

          <div className="integration-card">
            <div className="integration-header">
              <h3>Slack</h3>
              {slackConnected ? (
                <span className="badge badge-success">Connected</span>
              ) : (
                <span className="badge badge-secondary">Not connected</span>
              )}
            </div>

            <p>
              Connect your workspace with Slack to provide chat support through
              your Slack channels.
            </p>

            {!slackConnected && (
              <>
                <button
                  onClick={handleAddToSlack}
                  className="slack-button"
                  disabled={isSlackLoading}
                >
                  {isSlackLoading ? (
                    <span>Loading...</span>
                  ) : (
                    <img
                      alt="Add to Slack"
                      height="40"
                      width="139"
                      src="https://platform.slack-edge.com/img/add_to_slack.png"
                      srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
                    />
                  )}
                </button>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
