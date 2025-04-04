import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Settings.scss";

type LayoutProps = {
  children: React.ReactNode;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab based on current route
  const getActiveTab = () => {
    if (location.pathname.includes("/dashboard")) return "dashboard";
    if (location.pathname.includes("/settings")) return "settings";
    if (location.pathname.includes("/account")) return "account";
    if (location.pathname.includes("/reports")) return "reports";
    return "dashboard"; // Default
  };

  const handleNavClick = (tab: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/${tab}`);
  };

  return (
    <div className="settings">
      <div className="settings__sidebar">
        <nav className="settings__nav">
          <ul className="settings__nav-list">
            <li
              className={`settings__nav-item ${
                getActiveTab() === "dashboard"
                  ? "settings__nav-item--active"
                  : ""
              }`}
            >
              <a
                href="#"
                className="settings__nav-link"
                onClick={handleNavClick("dashboard")}
              >
                <span className="settings__nav-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="settings__icon"
                  >
                    <rect
                      x="3"
                      y="3"
                      width="18"
                      height="18"
                      rx="2"
                      ry="2"
                    ></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="9" y1="21" x2="9" y2="9"></line>
                  </svg>
                </span>
                <span className="settings__nav-text">Dashboard</span>
              </a>
            </li>
            <li
              className={`settings__nav-item ${
                getActiveTab() === "settings"
                  ? "settings__nav-item--active"
                  : ""
              }`}
            >
              <a
                href="#"
                className="settings__nav-link"
                onClick={handleNavClick("settings")}
              >
                <span className="settings__nav-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="settings__icon"
                  >
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                </span>
                <span className="settings__nav-text">Settings</span>
              </a>
            </li>
            <li className="settings__nav-item">
              <a
                href="#"
                className="settings__nav-link"
                onClick={handleNavClick("account")}
              >
                <span className="settings__nav-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="settings__icon"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </span>
                <span className="settings__nav-text">Account</span>
              </a>
            </li>
            <li className="settings__nav-item">
              <a
                href="#"
                className="settings__nav-link"
                onClick={handleNavClick("reports")}
              >
                <span className="settings__nav-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="settings__icon"
                  >
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                  </svg>
                </span>
                <span className="settings__nav-text">Reports</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>
      <div className="settings__content">{children}</div>
    </div>
  );
};

export default Layout;
