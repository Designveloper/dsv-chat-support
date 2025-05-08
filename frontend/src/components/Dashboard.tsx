import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Dashboard.scss";
import { useAuth } from "../context/AuthContext";
import { workspaceService, Workspace } from "../services/workspaceService";
import Button from "./Button";
import Layout from "./Layout";
import mattermostLogo from "../assets/mattermost-logo.png";
import ChatWidget from "./ChatWidget";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [slackConnected, setSlackConnected] = useState(false);
  const [isSlackLoading, setIsSlackLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isMattermostLoading, setIsMattermostLoading] = useState(false);

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
      setLoading(true);
      setError(null);
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
      setError(null);
      const { url } = await workspaceService.getSlackAuthUrl();
      window.location.href = url;
    } catch (error) {
      console.error("Error getting Slack auth URL:", error);
      setError("Failed to connect Slack. Please try again.");
    } finally {
      setIsSlackLoading(false);
    }
  };

  const handleConnectToMattermost = () => {
    navigate("/mattermost-connect");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleChangePassword = () => {
    navigate("/change-password");
  };

  const handleTabClick = (tab: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <Layout>
        <div className="settings__content">
          <div className="loading">
            <div className="loading__spinner"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="settings__content">
        <div className="settings__header">
          <div className="settings__header-top">
            <h1 className="settings__title">Chat Support Dashboard</h1>
            <div className="dashboard__user-controls">
              <span className="dashboard__welcome-text">
                Welcome, {user?.email}
              </span>
              <Button
                label="Change Password"
                onClick={handleChangePassword}
                className="dashboard__change-pwd-btn"
              />
              <Button
                label="Logout"
                onClick={handleLogout}
                className="dashboard__logout-btn"
              />
            </div>
          </div>
          <div className="settings__tabs">
            <ul className="settings__tabs-list">
              <li
                className={`settings__tabs-item ${
                  activeTab === "overview" ? "settings__tabs-item--active" : ""
                }`}
              >
                <a
                  href="#"
                  className="settings__tabs-link"
                  onClick={handleTabClick("overview")}
                >
                  Overview
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
          <div className="settings__content-section">
            {activeTab === "overview" && (
              <section className="dashboard__integrations-section">
                {slackConnected ? (
                  <div className="dashboard__header-actions">
                    <h2>Your workspaces</h2>
                    <Button
                      label="Add New Workspace"
                      onClick={handleAddToSlack}
                      className="dashboard__create-btn"
                    />
                  </div>
                ) : (
                  <h2>
                    Click the button below to add Chat Support to your Slack
                    account
                  </h2>
                )}

                <div>
                  {workspaces.length > 0 && (
                    <div className="dashboard__workspaces-list">
                      {workspaces.map((workspace) => (
                        <div
                          key={workspace.id}
                          className="dashboard__workspace-card"
                        >
                          <div className="dashboard__workspace-header">
                            <h3>{workspace.name}</h3>
                          </div>
                          <div className="dashboard__workspace-details">
                            <p>
                              Created:{" "}
                              {new Date(
                                workspace.createdAt
                              ).toLocaleDateString()}
                            </p>
                            <p>
                              Slack:{" "}
                              {workspace.bot_token ? (
                                <span className="dashboard__badge dashboard__badge--success">
                                  Connected
                                </span>
                              ) : (
                                <span className="dashboard__badge dashboard__badge--secondary">
                                  Not connected
                                </span>
                              )}
                            </p>
                            <p>
                              <a
                                href={`/settings/workspace/${workspace.id}/behavior`}
                                className="dashboard__link"
                              >
                                Manage Settings
                              </a>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!slackConnected && (
                    <div className="dashboard__integration-buttons">
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

                      <button
                        onClick={handleConnectToMattermost}
                        className="dashboard__mattermost-button"
                        disabled={isMattermostLoading}
                      >
                        {isMattermostLoading ? (
                          <div className="loading">
                            <div className="loading__spinner"></div>
                          </div>
                        ) : (
                          <div className="dashboard__mattermost-btn-content">
                            <img
                              alt="Connect to Mattermost"
                              height="20"
                              width="20"
                              src={mattermostLogo}
                              className="dashboard__mattermost-icon"
                            />
                            Add to Mattermost
                          </div>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
      <ChatWidget workspaceId={workspaces[0]?.id}></ChatWidget>
    </Layout>
  );
};

export default Dashboard;
