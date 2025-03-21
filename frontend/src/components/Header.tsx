import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Header.scss";
import { useAuth } from "../context/AuthContext";

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleDashboardClick = () => {
    navigate("/dashboard");
  };

  return (
    <header className="header">
      <div className="header__logo">Chatlio</div>
      <div
        className={`header__mobile-menu ${
          isMenuOpen ? "header__mobile-menu--open" : ""
        }`}
      >
        <nav className="header__nav">
          <ul className="header__nav-list">
            <li className="header__nav-item">
              <a href="#" className="header__nav-link">
                Features
              </a>
            </li>
            <li className="header__nav-item">
              <a href="#" className="header__nav-link">
                Docs
              </a>
            </li>
            <li className="header__nav-item">
              <a href="#" className="header__nav-link">
                Pricing
              </a>
            </li>
            <li className="header__nav-item">
              <a href="#" className="header__nav-link">
                FAQ
              </a>
            </li>
            <li className="header__nav-item">
              <a href="#" className="header__nav-link">
                Help
              </a>
            </li>
          </ul>
        </nav>
        <div className="header__auth">
          {isAuthenticated ? (
            <>
              <button
                className="header__auth-dashboard"
                onClick={handleDashboardClick}
              >
                Open Dashboard
              </button>
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
