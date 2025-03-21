import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Dashboard.scss";

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h1>Dashboard</h1>
        <button onClick={handleLogout} className="dashboard__logout-button">
          Logout
        </button>
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
