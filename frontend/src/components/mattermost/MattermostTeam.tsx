import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { mattermostService, Team } from "../../services/mattermostService";
import Button from "../Button";
import MattermostLayout from "./MattermostLayout";

const MattermostTeam = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const workspaceId =
    queryParams.get("workspaceId") ||
    localStorage.getItem("mattermost_workspace_id") ||
    "";

  // Form states
  const [selectedTeam, setSelectedTeam] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);

  // UI states
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If no workspaceId, redirect back to first step
    if (!workspaceId) {
      navigate("/mattermost/connect");
      return;
    }

    fetchTeams();
  }, [workspaceId, navigate]);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const teamsData = await mattermostService.getTeams(workspaceId);
      if (teamsData && teamsData.length > 0) {
        setTeams(teamsData);
      } else {
        setError("No teams found in your Mattermost account");
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
      setError("Failed to fetch teams from Mattermost");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await mattermostService.selectTeam(
        workspaceId,
        selectedTeam
      );

      if (result.success) {
        // Store selected team ID for reference
        localStorage.setItem("mattermost_selected_team", selectedTeam);
        navigate(`/mattermost/bot?workspaceId=${workspaceId}`);
      } else {
        setError(result.message || "Failed to select team");
      }
    } catch (error) {
      setError("Error selecting team.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MattermostLayout error={error} title="Select Mattermost Team">
      {loading && (
        <div className="loading">
          <div className="loading__spinner"></div>
        </div>
      )}
      <form onSubmit={handleSelectTeam} className="mattermost-form">
        <h2>Select Mattermost Team</h2>
        <p>Choose a team to use for support chats</p>

        {loading ? (
          <div className="loading">
            <div className="loading__spinner"></div>
          </div>
        ) : teams.length === 0 ? (
          <div className="no-teams">
            <p>
              No teams found. You may need to create a team in your Mattermost
              server first.
            </p>
          </div>
        ) : (
          <div className="form-group">
            <label htmlFor="team">Team</label>
            <select
              id="team"
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              required
            >
              <option value="">Select a team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="form-actions">
          <Button
            label="Back"
            onClick={() => navigate("/mattermost/connect")}
            variant="secondary"
            disabled={loading}
          />
          <Button
            label="Next"
            type="submit"
            disabled={loading || !selectedTeam}
          />
        </div>
      </form>
    </MattermostLayout>
  );
};

export default MattermostTeam;
