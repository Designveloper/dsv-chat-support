import React, { useState } from "react";
import "./Login.scss";
import { Link } from "react-router-dom";
import Button from "./Button";
import Input from "./Input";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Email:", email, "Password:", password);
  };

  return (
    <div className="login">
      <form className="login__form" onSubmit={handleSubmit}>
        <h2 className="login__title">Login</h2>
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
          label="Login"
          type="submit"
          className="login__button"
          variant="primary"
        />

        <div className="login__forgot-password">
          <Link to="/forgot-password" className="login__forgot-password-link">
            Forgot password?
          </Link>
        </div>

        <div className="login__signup">
          <span className="login__signup-label">Don't have an account?</span>
          <Link to="/signup" className="login__signup-link">
            Signup
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Login;
