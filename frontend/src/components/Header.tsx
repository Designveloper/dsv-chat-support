// src/components/Header/Header.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Header.scss';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className="header">
      <div className="header__logo">Chattio</div>
      <nav className={`header__nav ${isMenuOpen ? 'header__nav--open' : ''}`}>
        <ul className="header__nav-list">
          <li className="header__nav-item">
            <a href="#" className="header__nav-link">Features</a>
          </li>
          <li className="header__nav-item">
            <a href="#" className="header__nav-link">Docs</a>
          </li>
          <li className="header__nav-item">
            <a href="#" className="header__nav-link">Pricing</a>
          </li>
          <li className="header__nav-item">
            <a href="#" className="header__nav-link">FAQ</a>
          </li>
          <li className="header__nav-item">
            <a href="#" className="header__nav-link">Help</a>
          </li>
        </ul>
      </nav>
        <div className="header__auth">
          <Link to="/login" className="header__auth-login">Login</Link>
          <button className="header__auth-signup">Signup</button>
        </div>
      <button className="header__hamburger" onClick={toggleMenu} aria-label="Toggle menu">
        <span className="header__hamburger-line"></span>
        <span className="header__hamburger-line"></span>
        <span className="header__hamburger-line"></span>
      </button>
    </header>
  );
};

export default Header;