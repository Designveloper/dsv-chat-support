import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Home from "./components/Home";
import Login from "./components/Login";
import ForgotPassword from "./components/ForgotPassword";
import Signup from "./components/Signup";
import EmailConfirmation from "./components/EmailConfirmation";
import Dashboard from "./components/Dashboard";
import ChangePassword from "./components/ChangePassword";
import SlackChannelSelector from "./components/SlackChannelSelector";
import Settings from "./components/Settings";
import BehaviorSettings from "./components/BehaviorSettings";
import AppearanceSettings from "./components/AppearanceSettings";
import WidgetInstall from "./components/WidgetInstall";
import OperatingHours from "./components/OperatingHours";
import ProtectedRoute from "./components/ProtectedRoute";
import MattermostConnect from "./components/mattermost/MattermostConnect";
import MattermostTeam from "./components/mattermost/MattermostTeam";
import MattermostBot from "./components/mattermost/MattermostBot";
import MattermostChannel from "./components/mattermost/MattermostChannel";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/confirm" element={<EmailConfirmation />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Settings routes */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/workspace/:workspaceId"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="behavior" replace />} />
            <Route path="behavior" element={<BehaviorSettings />} />
            <Route path="appearance" element={<AppearanceSettings />} />
            <Route path="operating-hours" element={<OperatingHours />} />
            <Route path="widget-install" element={<WidgetInstall />} />
          </Route>

          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="/slack/select-channel"
            element={
              <ProtectedRoute>
                <SlackChannelSelector />
              </ProtectedRoute>
            }
          />

          <Route
            path="/mattermost/connect"
            element={
              <ProtectedRoute>
                <MattermostConnect />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mattermost/team"
            element={
              <ProtectedRoute>
                <MattermostTeam />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mattermost/bot"
            element={
              <ProtectedRoute>
                <MattermostBot />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mattermost/channel"
            element={
              <ProtectedRoute>
                <MattermostChannel />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
