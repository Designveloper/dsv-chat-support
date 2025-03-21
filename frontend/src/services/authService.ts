import axios from 'axios';

const API_URL = 'http://localhost:3000';

interface AuthResponse {
    accessToken: string;
    refreshToken?: string;
}

interface UserProfile {
    email: string;
}

export const authService = {
    async signup(email: string, password: string): Promise<AuthResponse> {
        const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Signup failed');
        }

        return response.json();
    },

    async confirmEmail(email: string, code: string): Promise<void> {
        const response = await fetch(`${API_URL}/auth/confirm`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, code }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to confirm email');
        }
    },

    async resendConfirmation(email: string): Promise<void> {
        const response = await fetch(`${API_URL}/auth/resend-confirmation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to resend confirmation code');
        }
    },

    async forgotPassword(email: string): Promise<void> {
        const response = await fetch(`${API_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to send password reset code');
        }
    },

    async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
        const response = await fetch(`${API_URL}/auth/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, code, newPassword }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to reset password');
        }
    },

    async login(email: string, password: string): Promise<AuthResponse> {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Login failed');
        }

        return response.json();
    },

    saveTokens(accessToken: string) {
        localStorage.setItem('accessToken', accessToken);
    },

    getAccessToken() {
        return localStorage.getItem('accessToken');
    },

    clearTokens() {
        localStorage.removeItem('accessToken');
    },

    logout() {
        localStorage.removeItem('accessToken');
    },

    async refreshAccessToken(): Promise<string> {
        try {
            const response = await axios.post(
                `${API_URL}/auth/refresh`,
                {},
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }
            );

            const { accessToken } = response.data;
            localStorage.setItem('accessToken', accessToken);
            return accessToken;
        } catch {
            this.clearTokens();
            throw new Error('Session expired. Please login again');
        }
    },

    async getUserProfile(): Promise<UserProfile> {
        try {
            const accessToken = this.getAccessToken();
            if (!accessToken) {
                throw new Error('Access token not found');
            }

            const response = await fetch(`${API_URL}/users/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.log('Access token expired. Refreshing token...');
                    await this.refreshAccessToken();
                    return this.getUserProfile();
                }
                throw new Error('Failed to fetch user profile');
            }

            return response.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    isAuthenticated() {
        return !!this.getAccessToken();
    }
};