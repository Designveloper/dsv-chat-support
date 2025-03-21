import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./EmailConfirmation.scss";
import Button from "./Button";
import Input from "./Input";
import { useAuth } from "../context/AuthContext";

const EmailConfirmation: React.FC = () => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { error, confirmEmail, resendConfirmation } = useAuth();

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await confirmEmail(email, code);
      if (response) {
        alert("Email confirmed successfully!");
        navigate("/login");
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleResendCode = async () => {
    try {
      await resendConfirmation(email);
      alert("Confirmation code has been resent to your email!");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="email-confirmation">
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

        <Button
          label="Verify Code"
          type="submit"
          className="email-confirmation__button"
          variant="primary"
        />

        {error && <div className="email-confirmation__error">{error}</div>}

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
