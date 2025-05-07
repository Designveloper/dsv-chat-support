import axios from 'axios';
import { authService } from './authService';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface MattermostWorkspace {
    id: string;
    name: string;
    serverUrl: string;
    token: string;
    teamId?: string;
    channelId?: string;
    botToken?: string;
}

export interface Channel {
    id: string;
    name: string;
    is_member: boolean;
    num_members: number;
}

export const mattermostService = {
    // Connect to Mattermost server
    async connectToMattermost(serverUrl: string, username: string, password: string, name?: string) {
        return this.executeWithTokenRefresh(async () => {
            const token = authService.getAccessToken();
            if (!token) throw new Error("Authentication required");

            const response = await axios.post(
                `${API_URL}/mattermost/connect`,
                {
                    serverUrl,
                    username,
                    password,
                    name
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            return response.data;
        });
    },

    // Connect bot to Mattermost
    async connectBot(workspaceId: string, botToken: string) {
        console.log("🚀 ~ connectBot ~ workspaceId:", workspaceId)
        return this.executeWithTokenRefresh(async () => {
            const token = authService.getAccessToken();
            if (!token) throw new Error("Authentication required");

            const response = await axios.post(
                `${API_URL}/mattermost/connect-bot`,
                {
                    workspaceId,
                    botToken
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            return response.data;
        });
    },

    // Get channels from Mattermost
    async getChannels(workspaceId: string) {
        console.log("🚀 ~ getChannels ~ workspaceId:", workspaceId)
        return this.executeWithTokenRefresh(async () => {
            const token = authService.getAccessToken();
            if (!token) throw new Error("Authentication required");

            const response = await axios.get(
                `${API_URL}/mattermost/channels?workspaceId=${workspaceId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            return response.data.channels as Channel[];
        });
    },

    // Select channel for integration
    async selectChannel(workspaceId: string, channelId: string) {
        return this.executeWithTokenRefresh(async () => {
            const token = authService.getAccessToken();
            if (!token) throw new Error("Authentication required");

            const response = await axios.post(
                `${API_URL}/mattermost/select-channel`,
                {
                    workspaceId,
                    channelId
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            return response.data;
        });
    },

    // Helper method to execute API calls with token refresh handling
    async executeWithTokenRefresh<T>(apiCall: () => Promise<T>): Promise<T> {
        try {
            return await apiCall();
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                try {
                    await authService.refreshAccessToken();
                    // Retry the original request with new token
                    return await apiCall();
                } catch (refreshError) {
                    // If refresh fails, rethrow the error
                    console.log('Failed to refresh token:', refreshError);
                    throw new Error('Session expired. Please login again.');
                }
            }
            // If error is not related to authentication, rethrow it
            throw error;
        }
    }
};