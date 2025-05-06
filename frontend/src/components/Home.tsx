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
            <h1 className="home__title">Customer Support Made Simple</h1>
            <p className="home__subtitle">
              Chat with visitors directly from Slack and never miss a message.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
