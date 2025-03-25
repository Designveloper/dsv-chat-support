import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const SlackOAuthCallback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const completeOAuth = async () => {
      try {
        // Get code and state from URL
        const params = new URLSearchParams(location.search);
        const code = params.get("code");
        const state = params.get("state");

        if (!code || !state) {
          setError("Missing code or state parameters");
          setLoading(false);
          return;
        }

        console.log(
          "Completing OAuth with code",
          code.substring(0, 10) + "..."
        );

        // Send to your backend
        const token = localStorage.getItem("accessToken");
        await axios.post(
          "http://localhost:3000/slack/complete-oauth",
          { code, state },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Redirect to dashboard with success message
        navigate("/dashboard?slackConnected=true");
      } catch (error) {
        console.error("Error completing OAuth:", error);
        setError("Failed to connect Slack. Please try again.");
        setLoading(false);
      }
    };

    completeOAuth();
  }, [location.search, navigate]);

  if (loading) {
    return (
      <div className="slack-callback-container">
        <div className="slack-callback-content">
          <h2>Completing Slack Integration</h2>
          <div className="spinner"></div>
          <p>Please wait while we complete your Slack integration...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="slack-callback-container error">
        <div className="slack-callback-content">
          <h2>Integration Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate("/dashboard")}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default SlackOAuthCallback;
