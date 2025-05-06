import { authService } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface WorkspaceSettings {
    presence_detection?: string;
    visitor_identification?: string;
    no_response_action?: string;
    no_response_delay?: string;
    show_unread_count?: boolean;
    play_sound?: boolean;
    operating_hours?: string;
}

interface UpdateSettingsPayload {
    presenceDetection?: string;
    visitorIdentification?: string;
    noResponseAction?: string;
    noResponseDelay?: string;
    showUnreadCount?: boolean;
    playSound?: boolean;
    operatingHours?: string;
}

export const workspaceSettingsService = {
    async getSettings(workspaceId: string): Promise<WorkspaceSettings> {
        try {
            const response = await fetch(`${API_URL}/workspace-settings/${workspaceId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch workspace settings');
            }

            const data = await response.json();

            return data.settings;
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