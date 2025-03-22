import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./EmailConfirmation.scss";
import Button from "./Button";
import Input from "./Input";
import { useAuth } from "../context/AuthContext";

const EmailConfirmation: React.FC = () => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { loading, error, confirmEmail, resendConfirmation, clearError } =
    useAuth();

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMessage(null);

    try {
      const response = await confirmEmail(email, code);
      if (response) {
        setSuccessMessage("Email confirmed successfully!");

        // Clear the form
        setCode("");

        // Redirect to login after a brief delay
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleResendCode = async () => {
    clearError();
    setSuccessMessage(null);

    try {
      await resendConfirmation(email);
      setSuccessMessage("Confirmation code has been resent to your email!");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="email-confirmation">
      {loading && (
        <div className="auth-loading">
          <div className="auth-loading__spinner"></div>
        </div>
      )}
      <form className="email-confirmation__form" onSubmit={handleSubmit}>
        <h2 className="email-confirmation__title">Email Confirmation</h2>

        <p className="email-confirmation__instructions">
          Please check your email for a confirmation code and enter it below.
        </p>

        <Input
          id="email"
          type="email"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={!!location.state?.email}
        />

        <Input
          id="code"
          type="text"
          label="Confirmation Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter the 6-digit code"
          required
        />

        {successMessage && (
          <div className="email-confirmation__success">{successMessage}</div>
        )}

        {error && <div className="email-confirmation__error">{error}</div>}

        <Button
          label="Verify Code"
          type="submit"
          className="email-confirmation__button"
          variant="primary"
        />

        <div className="email-confirmation__resend">
          <span>Didn't receive a code?</span>
          <button
            type="button"
            className="email-confirmation__resend-button"
            onClick={handleResendCode}
          >
            Resend Code
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmailConfirmation;
