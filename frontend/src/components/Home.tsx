import React from "react";
import Header from "./Header";
import "./Home.scss";

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
            {/* copyright with company website url */}
            <p className="home__copyright">
              &copy; {new Date().getFullYear()} DSV. All rights reserved.
              <a
                href="https://www.designveloper.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="home__link"
              >
                DSV
              </a>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
