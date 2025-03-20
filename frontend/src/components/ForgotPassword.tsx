import React, { useState } from "react";
import "./ForgotPassword.scss";
import Button from "./Button";
import Input from "./Input";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Email:", email);
  };

  return (
    <div className="forgot-password">
      <form className="forgot-password__form" onSubmit={handleSubmit}>
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
          label="Reset Password"
          type="submit"
          className="forgot-password__button"
          variant="primary"
        />
      </form>
    </div>
  );
};

export default ForgotPassword;
