import React, { useState } from "react";
import "./Signup.scss";
import { Link } from "react-router-dom";
import Button from "./Button";
import Input from "./Input";

const Signup: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Email:", email, "Password:", password);
  };

  return (
    <div className="signup">
      <form className="signup__form" onSubmit={handleSubmit}>
        <h2 className="signup__title">Sign up</h2>
        <Input
          id="email"
          type="email"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          id="password"
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button
          label="Sign up"
          type="submit"
          className="signup__button"
          variant="primary"
        />

        <div className="signup__login">
          <span className="signup__login-label">Already have an account?</span>
          <Link to="/login" className="signup__login-link">
            Login
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Signup;
