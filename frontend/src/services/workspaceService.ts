import axios from 'axios';

const API_URL = 'http://localhost:3000';

export interface Workspace {
    id: string;
    name: string;
    owner_id: number;
    createdAt: string;
    updatedAt?: string;
    bot_token_slack?: string;
    selected_channel_id?: string;
    service_slack_account_id?: string;
    service_type_slack?: string;
}

export const workspaceService = {
    // Get all workspaces for the authenticated user
    async fetchWorkspaces(): Promise<Workspace[]> {
        const token = localStorage.getItem("accessToken");
        if (!token) throw new Error("Authentication required");

        const response = await axios.get<Workspace[]>(
            `${API_URL}/workspace`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        return response.data;
    },

    // Create a new workspace
    async createWorkspace(): Promise<Workspace> {
        const token = localStorage.getItem("accessToken");
        if (!token) throw new Error("Authentication required");

        const response = await axios.post<Workspace>(
            `${API_URL}/workspace`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        return response.data;
    },

    // Get a single workspace by ID
    async getWorkspace(id: string): Promise<Workspace> {
        const token = localStorage.getItem("accessToken");
        if (!token) throw new Error("Authentication required");

        const response = await axios.get<Workspace>(
            `${API_URL}/workspace/${id}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        return response.data;
    },

    // Get Slack authorization URL
    async getSlackAuthUrl(): Promise<{ url: string }> {
        const token = localStorage.getItem("accessToken");
        if (!token) throw new Error("Authentication required");

        const response = await axios.get<{ url: string }>(
            `${API_URL}/slack/auth-url`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        return response.data;
    },

    // Check if any workspace has Slack connected
    hasSlackIntegration(workspaces: Workspace[]): boolean {
        return workspaces.some(workspace => workspace.bot_token_slack);
    }
};