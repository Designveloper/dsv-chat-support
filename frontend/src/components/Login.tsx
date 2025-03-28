import React, { useState } from "react";
import "./Login.scss";
import { useNavigate } from "react-router-dom";
import Button from "./Button";
import Input from "./Input";
import { useAuth } from "../context/AuthContext";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login, loading, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const user = await login(email, password);
      if (user) {
        navigate("/");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const goToForgotPassword = () => {
    clearError();
    navigate("/forgot-password");
  };

  const goToSignup = () => {
    clearError();
    navigate("/signup");
  };

  return (
    <div className="login">
      {loading && (
        <div className="loading">
          <div className="loading__spinner"></div>
        </div>
      )}
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

        {error && <div className="login__error">{error}</div>}

        <div className="login__forgot-password">
          <span
            onClick={goToForgotPassword}
            className="login__forgot-password-link"
          >
            Forgot password?
          </span>
        </div>

        <div className="login__signup">
          <span className="login__signup-label">Don't have an account?</span>
          <span onClick={goToSignup} className="login__signup-link">
            Signup
          </span>
        </div>
      </form>
    </div>
  );
};

export default Login;
