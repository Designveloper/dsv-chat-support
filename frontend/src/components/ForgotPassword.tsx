import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ForgotPassword.scss";
import Button from "./Button";
import Input from "./Input";
import { useAuth } from "../context/AuthContext";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const { loading, error, forgotPassword, resetPassword, clearError } =
    useAuth();
  const navigate = useNavigate();

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMessage(null);

    try {
      const response = await forgotPassword(email);
      if (response) {
        setIsCodeSent(true);
        setSuccessMessage("Password reset code has been sent to your email!");
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMessage(null);

    try {
      const response = await resetPassword(email, code, newPassword);
      if (response) {
        setSuccessMessage("Password has been successfully reset!");

        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="forgot-password">
      {loading && (
        <div className="loading">
          <div className="loading__spinner"></div>
        </div>
      )}
      {!isCodeSent ? (
        <form className="forgot-password__form" onSubmit={handleRequestCode}>
          <h2 className="forgot-password__title">Forgot Password</h2>

          <Input
            id="email"
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Button
            label="Send Reset Code"
            type="submit"
            className="forgot-password__button"
            variant="primary"
            fullWidth
          />

          {successMessage && (
            <div className="forgot-password__success">{successMessage}</div>
          )}

          {error && <div className="forgot-password__error">{error}</div>}
        </form>
      ) : (
        <form className="forgot-password__form" onSubmit={handleResetPassword}>
          <h2 className="forgot-password__title">Reset Password</h2>

          <Input
            id="email"
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={true}
            required
          />

          <Input
            id="code"
            type="text"
            label="Reset Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter the 6-digit code"
            required
          />

          <Input
            id="newPassword"
            type="password"
            label="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          {successMessage && (
            <div className="forgot-password__success">{successMessage}</div>
          )}

          {error && <div className="forgot-password__error">{error}</div>}
          <Button
            label="Reset Password"
            type="submit"
            className="forgot-password__button"
            variant="primary"
          />
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;
