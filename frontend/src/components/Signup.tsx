import React, { useState } from "react";
import "./Signup.scss";
import { Link, useNavigate } from "react-router-dom";
import Button from "./Button";
import Input from "./Input";
import { useAuth } from "../context/AuthContext";

const Signup: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { signup, loading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await signup(email, password);
      navigate("/");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="signup">
      <form className="signup__form" onSubmit={handleSubmit}>
        <h2 className="signup__title">Sign up</h2>

        {error && <div className="signup__error">{error}</div>}
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
          label={loading ? "Signing up..." : "Sign up"}
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
