import React, { useState } from 'react';
import './Signup.scss';
// import { Link } from 'react-router-dom';

const Signup: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Email:', email, 'Password:', password);
    };

    return (
        <div className="signup">
            <form className="signup__form" onSubmit={handleSubmit}>
                <h2 className="signup__title">Chatlio</h2>
                <div className="signup__field">
                    <label className="signup__label" htmlFor="email">Email</label>
                    <input
                        className="signup__input"
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="signup__field">
                    <label className="signup__label" htmlFor="password">Password</label>
                    <input
                        className="signup__input"
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button className="signup__button" type="submit">Sign up</button>

                {/* <div className="signup__login">
                    <span className="signup__login-label">Already have an account?</span>
                    <Link to="/login" className="signup__login-link">Login</Link>
                </div> */}
            </form>
        </div>
    );
};

export default Signup;