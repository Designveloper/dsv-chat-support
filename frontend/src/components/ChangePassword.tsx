import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useProtectedRoute } from "../hooks/useProtectedRoute";
import Button from "./Button";
import Input from "./Input";
import "./ChangePassword.scss";

const ChangePassword: React.FC = () => {
  const isAuthenticated = useProtectedRoute();
  const { changePassword, loading, error, clearError } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      return;
    }

    try {
      const result = await changePassword(currentPassword, newPassword);

      if (result) {
        setSuccess("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Failed to change password:", err);
    }
  };

  return (
    <div className="change-password">
      <form onSubmit={handleSubmit} className="change-password__form">
        <h2 className="change-password__title">Change Password</h2>

        <Input
          id="current-password"
          type="password"
          label="Current Password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />

        <Input
          id="new-password"
          type="password"
          label="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        <Input
          id="confirm-password"
          type="password"
          label="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        {newPassword !== confirmPassword && confirmPassword && (
          <p className="password-mismatch">Passwords don't match</p>
        )}

        {success && <div className="change-password__success">{success}</div>}
        {error && <div className="change-password__error">{error}</div>}

        <div className="change-password__buttons">
          <Button
            label={loading ? "Changing..." : "Change Password"}
            type="submit"
            variant="primary"
            disabled={
              loading ||
              (newPassword !== confirmPassword && confirmPassword !== "")
            }
          />
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;
