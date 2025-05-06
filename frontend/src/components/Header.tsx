import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Header.scss";
import { useAuth } from "../context/AuthContext";
import Button from "./Button";
import companyLogo from "../assets/company-logo.png";

type HeaderProps = {
  showAnimation?: boolean;
};

const Header: React.FC<HeaderProps> = ({ showAnimation = false }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isHomePage = location.pathname === "/";

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleDashboardClick = () => {
    navigate("/dashboard");
  };

  const headerClass = `header ${showAnimation ? "header--animated" : ""}`;

  return (
    <header className={headerClass}>
      <div className="header__logo" onClick={() => navigate("/")}>
        DSV Chat Support
      </div>
      <div
        className={`header__mobile-menu ${
          isMenuOpen ? "header__mobile-menu--open" : ""
        }`}
      >
        {isHomePage && (
          <nav className="header__nav">
            <img
              src={companyLogo}
              alt="Logo"
              style={{ width: "300px", height: "auto" }}
            />
          </nav>
        )}
        <div className="header__auth">
          {isAuthenticated ? (
            <>
              {isHomePage && (
                <Button
                  label="Open Dashboard"
                  onClick={handleDashboardClick}
                  variant="secondary"
                  className="header__auth-dashboard"
                />
              )}
            </>
          ) : (
            <>
              <Link to="/login" className="header__auth-login">
                Login
              </Link>
              <Link to="/signup" className="header__auth-signup-link">
                <button className="header__auth-signup">Signup</button>
              </Link>
            </>
          )}
        </div>
      </div>
      <button
        className="header__hamburger"
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        <span className="header__hamburger-line"></span>
        <span className="header__hamburger-line"></span>
        <span className="header__hamburger-line"></span>
      </button>
    </header>
  );
};

export default Header;
