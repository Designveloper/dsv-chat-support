import { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import "./Settings.scss";
import Layout from "./Layout";
import { workspaceService, Workspace } from "../services/workspaceService";
import { useParams } from "react-router-dom";

const Settings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const { id: workspaceId } = useParams<{ id: string }>();

  // Determine active tab based on the URL path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/settings/behavior")) return "behavior";
    if (path.includes("/settings/appearance")) return "appearance";
    if (path.includes("/settings/operating-hours")) return "operating-hours";
    if (path.includes("/settings/widget-install")) return "widget-install";
    if (path.includes("/settings/saved-replies")) return "saved-replies";
    return "behavior"; // Default
  };

  // Handle tab click navigations
  const handleTabClick = (tab: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/settings/${tab}`);
  };

  // Get tab title for header
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
        // If workspaceId is not available via params, try to get one workspace
        try {
          setLoading(true);
          const workspaces = await workspaceService.fetchWorkspaces();
          if (workspaces.length > 0) {
            setWorkspace(workspaces[0]);
          }
        } catch (error) {
          console.error("Error fetching workspaces:", error);
        } finally {
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const data = await workspaceService.getWorkspace(workspaceId);
        setWorkspace(data);
      } catch (error) {
        console.error("Error fetching workspace:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspace();
  }, [workspaceId]);

  return (
    <Layout>
      <div className="settings__content">
        <div className="settings__header">
          <div className="settings__header-top">
            <h1 className="settings__title">
              {loading ? "Loading..." : workspace?.name || "Workspace"} -{" "}
              {getTabTitle()}
            </h1>
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
              <li
                className={`settings__tabs-item ${
                  getActiveTab() === "saved-replies"
                    ? "settings__tabs-item--active"
                    : ""
                }`}
              >
                <a
                  href="#"
                  className="settings__tabs-link"
                  onClick={handleTabClick("saved-replies")}
                >
                  Saved Replies
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="settings__body">
          <div className="settings__content-section">
            {/* Outlet renders the matched child route */}
            <Outlet context={{ workspace }} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
