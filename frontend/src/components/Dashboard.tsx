import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useProtectedRoute } from "../hooks/useProtectedRoute";
import "./Dashboard.scss";

const Dashboard: React.FC = () => {
  const isAuthenticated = useProtectedRoute();
  const { user, clearError, logout } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const goToChangePassword = () => {
    clearError();
    navigate("/change-password");
  };

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h1>Dashboard</h1>
        <div className="dashboard__header-buttons">
          <button
            onClick={goToChangePassword}
            className="dashboard__change-password-button"
          >
            Change Password
          </button>
          <button onClick={handleLogout} className="dashboard__logout-button">
            Logout
          </button>
        </div>
      </div>
      <div className="dashboard__content">
        <div className="dashboard__welcome">
          <h2>Welcome, {user?.email}</h2>
          <p>
            This is a protected route that only authenticated users can see.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
