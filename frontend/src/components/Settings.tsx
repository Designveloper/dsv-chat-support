import { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet, useParams } from "react-router-dom";
import "./Settings.scss";
import Layout from "./Layout";
import { workspaceService, Workspace } from "../services/workspaceService";
import Button from "./Button";

const Settings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { workspaceId } = useParams<{ workspaceId: string }>();

  // Determine active tab based on the URL path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/behavior")) return "behavior";
    if (path.includes("/appearance")) return "appearance";
    if (path.includes("/operating-hours")) return "operating-hours";
    if (path.includes("/widget-install")) return "widget-install";
    return "behavior"; // Default
  };

  const handleTabClick = (tab: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (workspaceId) {
      navigate(`/settings/workspace/${workspaceId}/${tab}`);
    }
  };

  const getTabTitle = () => {
    const activeTab = getActiveTab();
    return activeTab
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  useEffect(() => {
    const fetchWorkspace = async () => {
      if (!workspaceId) {
        setError("No workspace selected");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const workspace = await workspaceService.getWorkspace(workspaceId);
        setWorkspace(workspace);
      } catch (error) {
        console.error("Error fetching workspace:", error);
        setError("Failed to load workspace settings");
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspace();
  }, [workspaceId]);

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <Layout>
        <div className="settings__content">
          <div className="loading">Loading workspace settings...</div>
        </div>
      </Layout>
    );
  }

  if (error || !workspace) {
    return (
      <Layout>
        <div className="settings__content">
          <div className="settings__error">
            <p>{error || "Workspace not found"}</p>
            <Button
              label="Back to Dashboard"
              onClick={handleBackToDashboard}
              className="settings__back-btn"
            />
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
            <div className="settings__title-container">
              <h1 className="settings__title">
                {workspace.name} - {getTabTitle()}
              </h1>
            </div>
          </div>
          <div className="settings__tabs">
            <ul className="settings__tabs-list">
              <li
                className={`settings__tabs-item ${
                  getActiveTab() === "behavior"
                    ? "settings__tabs-item--active"
                    : ""
                }`}
              >
                <a
                  href="#"
                  className="settings__tabs-link"
                  onClick={handleTabClick("behavior")}
                >
                  Behavior
                </a>
              </li>
              <li
                className={`settings__tabs-item ${
                  getActiveTab() === "appearance"
                    ? "settings__tabs-item--active"
                    : ""
                }`}
              >
                <a
                  href="#"
                  className="settings__tabs-link"
                  onClick={handleTabClick("appearance")}
                >
                  Appearance
                </a>
              </li>
              <li
                className={`settings__tabs-item ${
                  getActiveTab() === "operating-hours"
                    ? "settings__tabs-item--active"
                    : ""
                }`}
              >
                <a
                  href="#"
                  className="settings__tabs-link"
                  onClick={handleTabClick("operating-hours")}
                >
                  Operating Hours
                </a>
              </li>
              <li
                className={`settings__tabs-item ${
                  getActiveTab() === "widget-install"
                    ? "settings__tabs-item--active"
                    : ""
                }`}
              >
                <a
                  href="#"
                  className="settings__tabs-link"
                  onClick={handleTabClick("widget-install")}
                >
                  Widget Install
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="settings__body">
          <div className="settings__content-section">
            <Outlet context={{ workspace }} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
