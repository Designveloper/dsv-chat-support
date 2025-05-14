import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Layout from "../Layout";
import "./MattermostIntegration.scss";

interface MattermostLayoutProps {
  children: ReactNode;
  title?: string;
}

const MattermostLayout: React.FC<MattermostLayoutProps> = ({
  children,
  title = "Mattermost Integration",
}) => {
  // Determine current step based on the route
  const location = useLocation();
  const path = location.pathname;

  const currentStep = path.includes("/mattermost/connect")
    ? 1
    : path.includes("/mattermost/team")
    ? 2
    : path.includes("/mattermost/bot")
    ? 3
    : path.includes("/mattermost/channel")
    ? 4
    : 1;

  return (
    <Layout>
      <div className="mattermost-integration">
        <div className="mattermost-integration__header">
          <h1>{title}</h1>
        </div>

        <div className="mattermost-integration__content">
          <div className="steps-indicator">
            <div className={`step ${currentStep >= 1 ? "step--active" : ""}`}>
              1. Connect
            </div>
            <div className={`step ${currentStep >= 2 ? "step--active" : ""}`}>
              2. Team
            </div>
            <div className={`step ${currentStep >= 3 ? "step--active" : ""}`}>
              3. Bot Setup
            </div>
            <div className={`step ${currentStep >= 4 ? "step--active" : ""}`}>
              4. Channel
            </div>
          </div>

          {children}
        </div>
      </div>
    </Layout>
  );
};

export default MattermostLayout;
