import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Header from "./components/Header";
import Login from "./components/Login";
import ForgotPassword from "./components/ForgotPassword";
import Signup from "./components/Signup";
import EmailConfirmation from "./components/EmailConfirmation";
import Dashboard from "./components/Dashboard";
import ChangePassword from "./components/ChangePassword";
import SlackOAuthCallback from "./components/SlackOauthCallback";
import SlackChannelSelector from "./components/SlackChannelSelector";
import VisitorDemo from "./components/VisitorDemo";

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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/slack/callback" element={<SlackOAuthCallback />} />
          <Route
            path="/slack/select-channel"
            element={<SlackChannelSelector />}
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
