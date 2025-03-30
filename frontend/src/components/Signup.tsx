import React, { useState } from "react";
import "./Signup.scss";
import { useNavigate } from "react-router-dom";
import Button from "./Button";
import Input from "./Input";
import { useAuth } from "../context/AuthContext";

const Signup: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { signup, loading, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await signup(email, password);
      if (response) {
        navigate("/confirm", { state: { email } });
      }
    } catch (err) {
      console.log(err);
    }
  };

  const goToLogin = () => {
    clearError();
    navigate("/login");
  };

  return (
    <div className="signup">
      {loading && (
        <div className="loading">
          <div className="loading__spinner"></div>
        </div>
      )}
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
          fullWidth
        />
        {error && <div className="signup__error">{error}</div>}

        <div className="signup__login">
          <span className="login__signup-label">Already have an account?</span>
          <span onClick={goToLogin} className="signup__login-link">
            Login
          </span>
        </div>
      </form>
    </div>
  );
};

export default Signup;
