import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useProtectedRoute } from "../hooks/useProtectedRoute";
import "./Dashboard.scss";
import { useAuth } from "../context/AuthContext";
import { workspaceService, Workspace } from "../services/workspaceService";
import Button from "./Button";
import Layout from "./Layout";

const Dashboard = () => {
  const isAuthenticated = useProtectedRoute();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [slackConnected, setSlackConnected] = useState(false);
  const [isSlackLoading, setIsSlackLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    fetchWorkspaces();
    // Check URL parameters
    const params = new URLSearchParams(location.search);
    if (params.get("slackConnected") === "true") {
      setSlackConnected(true);
    }
    if (params.get("error")) {
      setError(params.get("error"));
    }
  }, [isAuthenticated, location]);

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      const data = await workspaceService.fetchWorkspaces();
      setWorkspaces(data);
      setSlackConnected(workspaceService.hasSlackIntegration(data));
    } catch (error) {
      console.error("Error fetching workspaces:", error);
      setError("Failed to fetch workspaces. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToSlack = async () => {
    try {
      setIsSlackLoading(true);
      const { url } = await workspaceService.getSlackAuthUrl();
      window.location.href = url;
    } catch (error) {
      console.error("Error getting Slack auth URL:", error);
      setError("Failed to connect Slack. Please try again.");
    } finally {
      setIsSlackLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading">Loading...</div>
      </Layout>
    );
  }

  // Dashboard content with the same layout structure as Settings
  const dashboardContent = (
    <>
      <div className="settings__header">
        <div className="settings__header-top">
          <h1 className="settings__title">Chat Support Dashboard</h1>
          <div className="dashboard__user-controls">
            <span className="dashboard__welcome-text">
              Welcome, {user?.email}
            </span>
            <Button
              label="Logout"
              onClick={handleLogout}
              className="dashboard__logout-btn"
            />
          </div>
        </div>
        <div className="settings__tabs">
          <ul className="settings__tabs-list">
            <li className="settings__tabs-item settings__tabs-item--active">
              <a href="#" className="settings__tabs-link">
                Overview
              </a>
            </li>
            <li className="settings__tabs-item">
              <a href="#" className="settings__tabs-link">
                Analytics
              </a>
            </li>
            <li className="settings__tabs-item">
              <a href="#" className="settings__tabs-link">
                Activity
              </a>
            </li>
          </ul>
        </div>
      </div>

      {error && (
        <div className="settings__notification">
          <p className="settings__notification-text">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      <div className="settings__body">
        <section className="dashboard__integrations-section">
          {slackConnected ? (
            <h2>Your workspace</h2>
          ) : (
            <h2>
              Click the button below to add Chat Support to your Slack account
            </h2>
          )}

          <div className="">
            {workspaces.length > 0 && (
              <div className="dashboard__workspaces-list">
                {workspaces.map((workspace) => (
                  <div key={workspace.id} className="dashboard__workspace-card">
                    <h3>{workspace.name}</h3>
                    <div className="dashboard__workspace-details">
                      <p>
                        Created:{" "}
                        {new Date(workspace.createdAt).toLocaleDateString()}
                      </p>
                      <p>
                        Slack:{" "}
                        {workspace.bot_token_slack ? (
                          <span className="dashboard__badge dashboard__badge--success">
                            Connected
                          </span>
                        ) : (
                          <span className="dashboard__badge dashboard__badge--secondary">
                            Not connected
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!slackConnected && (
              <button
                onClick={handleAddToSlack}
                className="dashboard__slack-button"
                disabled={isSlackLoading}
              >
                {isSlackLoading ? (
                  <div className="loading">
                    <div className="loading__spinner"></div>
                  </div>
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
            )}
          </div>
        </section>
      </div>
    </>
  );

  return <Layout>{dashboardContent}</Layout>;
};

export default Dashboard;
