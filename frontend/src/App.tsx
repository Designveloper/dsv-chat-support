import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Header from "./components/Header";
import Login from "./components/Login";
import ForgotPassword from "./components/ForgotPassword";
import Signup from "./components/Signup";
import EmailConfirmation from "./components/EmailConfirmation";
import Dashboard from "./components/Dashboard";
import ChangePassword from "./components/ChangePassword";
import SlackChannelSelector from "./components/SlackChannelSelector";
import VisitorDemo from "./components/VisitorDemo";
import Settings from "./components/Settings";
import BehaviorSettings from "./components/BehaviorSettings";
import AppearanceSettings from "./components/AppearanceSettings";
import WidgetInstall from "./components/WidgetInstall";
import OperatingHours from "./components/OperatingHours";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Header />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/confirm" element={<EmailConfirmation />} />
          <Route path="/demo" element={<VisitorDemo />} />

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
            path="/settings/workspace/:workspaceId"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={<Navigate to="/settings/behavior" replace />}
            />
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
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
