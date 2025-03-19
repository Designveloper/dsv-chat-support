import React, { useState } from 'react';
import './ForgotPassword.scss';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Email:', email);
    };

    return (
        <div className="forgot-password">
            <form className="forgot-password__form" onSubmit={handleSubmit}>
                <h2 className="forgot-password__title">Chatlio</h2>
                <div className="forgot-password__field">
                    <label className="forgot-password__label" htmlFor="email">Email</label>
                    <input
                        className="forgot-password__input"
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <button className="forgot-password__button" type="submit">Send confirmation code</button>
            </form>
        </div>
    );
};

export default ForgotPassword;