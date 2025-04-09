import { authService } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface WorkspaceSettings {
    auto_update_status?: boolean;
    presence_detection?: string;
    visitor_identification?: string;
    auto_response_enabled?: boolean;
    auto_response_message?: string;
    offline_transition?: string;
    show_unread_count?: boolean;
}

interface UpdateSettingsPayload {
    autoUpdateStatus?: boolean;
    presenceDetection?: string;
    visitorIdentification?: string;
    autoResponseEnabled?: boolean;
    autoResponseMessage?: string;
    offlineTransition?: string;
    showUnreadCount?: boolean;
}

export const workspaceSettingsService = {
    async getSettings(workspaceId: string): Promise<WorkspaceSettings> {
        try {
            const accessToken = authService.getAccessToken();
            if (!accessToken) {
                throw new Error('No access token found');
            }

            const response = await fetch(`${API_URL}/workspace-settings/${workspaceId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                console.log('Token expired, refreshing...');
                await authService.refreshAccessToken();
                return this.getSettings(workspaceId);
            }

            if (!response.ok) {
                throw new Error('Failed to fetch workspace settings');
            }

            const data = await response.json();
            return data.settings || {};
        } catch (error) {
            console.error('Error fetching workspace settings:', error);
            throw error;
        }
    },

    async updateSettings(workspaceId: string, changedSettings: UpdateSettingsPayload): Promise<WorkspaceSettings> {
        try {
            const accessToken = authService.getAccessToken();
            if (!accessToken) {
                throw new Error('No access token found');
            }

            // Log what's being updated for debugging
            console.log('Updating settings with changes:', changedSettings);

            const response = await fetch(`${API_URL}/workspace-settings/${workspaceId}/update`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(changedSettings)
            });

            if (response.status === 401) {
                console.log('Token expired, refreshing...');
                await authService.refreshAccessToken();
                return this.updateSettings(workspaceId, changedSettings);
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update workspace settings');
            }

            const data = await response.json();
            return data.settings || {};
        } catch (error) {
            console.error('Error updating workspace settings:', error);
            throw error;
        }
    },
};