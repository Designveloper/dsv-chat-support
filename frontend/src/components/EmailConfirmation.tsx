import React, { useState } from "react";
import "./EmailConfirmation.scss";
import Button from "./Button";
import Input from "./Input";

const EmailConfirmation: React.FC = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Email:", email);
  };

  return (
    <div className="email-confirmation">
      <form className="email-confirmation__form" onSubmit={handleSubmit}>
        <h2 className="email-confirmation__title"> Email Confirmation</h2>
        <Input
          id="email"
          type="email"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button
          label="Confirm Email"
          type="submit"
          className="email-confirmation__button"
          variant="primary"
        />
      </form>
    </div>
  );
};

export default EmailConfirmation;
