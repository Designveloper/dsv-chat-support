import { useState, useEffect } from "react";
import { workspaceService, Workspace } from "../services/workspaceService";
import "./WorkspaceSelector.scss";

interface WorkspaceSelectorProps {
  onSelect: (workspaceId: string) => void;
  onClose: () => void;
}

const WorkspaceSelector = ({ onSelect, onClose }: WorkspaceSelectorProps) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await workspaceService.fetchWorkspaces();
        setWorkspaces(data);
      } catch (error) {
        console.error("Error fetching workspaces:", error);
        setError("Failed to load workspaces. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaces();
  }, []);

  return (
    <div className="workspace-selector">
      <div className="workspace-selector__backdrop" onClick={onClose}></div>
      <div className="workspace-selector__content">
        <div className="workspace-selector__header">
          <h2>Select Workspace</h2>
          <button className="workspace-selector__close" onClick={onClose}>
            &times;
          </button>
        </div>

        {loading && (
          <div className="workspace-selector__loading">
            <div className="loading">
              <div className="loading__spinner"></div>
            </div>
          </div>
        )}

        {error && <div className="workspace-selector__error">{error}</div>}

        {!loading && !error && workspaces.length === 0 && (
          <div className="workspace-selector__empty">
            <p>You don't have any workspaces yet.</p>
          </div>
        )}

        {!loading && !error && workspaces.length > 0 && (
          <div className="workspace-selector__list">
            {workspaces.map((workspace) => (
              <div
                key={workspace.id}
                className="workspace-selector__item"
                onClick={() => onSelect(workspace.id)}
              >
                <h3 className="workspace-selector__workspace-name">
                  {workspace.name}
                </h3>
                <div className="workspace-selector__workspace-info">
                  <p>
                    Created:{" "}
                    {new Date(workspace.createdAt).toLocaleDateString()}
                  </p>
                  <p>
                    Slack Status:{" "}
                    {workspace.bot_token_slack ? "Connected" : "Not connected"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspaceSelector;
