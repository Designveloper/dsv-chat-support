import React from "react";
import Header from "./Header";
import "./Home.scss";
import companyLogo from "../assets/company-logo.png";
import githubLogo from "../assets/github-logo.png";
import linkedinLogo from "../assets/linkedin-logo.png";

const Home: React.FC = () => {
  return (
    <div className="home">
      <Header showAnimation={true} />
      <main className="home__main">
        <section className="home__hero">
          <div className="home__container">
            <h1 className="home__title">DSV Customer Support Made Simple</h1>
            <p className="home__subtitle">
              Chat with visitors directly from Slack and never miss a message.
            </p>
            <a
              href="https://www.designveloper.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="home__link"
            >
              <img src={companyLogo} alt="Logo" className="home__logo" />
            </a>

            <div className="home__social-links">
              <a
                href="https://github.com/Designveloper/dsv-chat-support"
                target="_blank"
                rel="noopener noreferrer"
                className="home__social-link"
              >
                <img
                  src={githubLogo}
                  alt="GitHub"
                  className="home__social-icon"
                />
                <span className="home__social-text">GitHub</span>
              </a>
              <a
                href="https://www.linkedin.com/company/designveloper"
                target="_blank"
                rel="noopener noreferrer"
                className="home__social-link"
              >
                <img
                  src={linkedinLogo}
                  alt="LinkedIn"
                  className="home__social-icon"
                />
                <span className="home__social-text">LinkedIn</span>
              </a>
            </div>

            <p className="home__copyright">
              &copy; {new Date().getFullYear()} Designveloper - DSV TECH AND APP
              CORP. All rights reserved.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
