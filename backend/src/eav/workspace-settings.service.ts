import { Injectable, Logger } from '@nestjs/common';
import { EavService } from './eav.service';
import { UpdateWorkspaceSettingsDto } from './workspace-settings.dto';

// Define settings constants to avoid typos
export const WORKSPACE_SETTINGS = {
    PRESENCE_DETECTION: 'presence_detection',
    VISITOR_IDENTIFICATION: 'visitor_identification',
    NO_RESPONSE_ACTION: 'no_response_action',
    NO_RESPONSE_DELAY: 'no_response_delay',
    SHOW_UNREAD_COUNT: 'show_unread_count',
    PLAY_SOUND: 'play_sound',
};

@Injectable()
export class WorkspaceSettingsService {
    private readonly logger = new Logger(WorkspaceSettingsService.name);

    constructor(private readonly eavService: EavService) { }

    /**
     * Ensure all necessary attributes exist in the EAV model
     */
    // private async ensureAttributesExist(): Promise<void> {
    //     this.logger.log('Ensuring all workspace settings attributes exist');

    //     const entityType = await this.eavService.getOrCreateEntityType('workspace');

    //     // Define all attributes with their types
    //     const attributeDefinitions = [
    //         { code: WORKSPACE_SETTINGS.AUTO_UPDATE_STATUS, type: 'boolean' },
    //         { code: WORKSPACE_SETTINGS.PRESENCE_DETECTION, type: 'varchar' },
    //         { code: WORKSPACE_SETTINGS.VISITOR_IDENTIFICATION, type: 'varchar' },
    //         { code: WORKSPACE_SETTINGS.AUTO_RESPONSE_ENABLED, type: 'boolean' },
    //         { code: WORKSPACE_SETTINGS.AUTO_RESPONSE_MESSAGE, type: 'varchar' },
    //         { code: WORKSPACE_SETTINGS.OFFLINE_TRANSITION, type: 'varchar' },
    //         { code: WORKSPACE_SETTINGS.SHOW_UNREAD_COUNT, type: 'boolean' },
    //     ];

    //     // Create all attributes sequentially with more extensive error handling
    //     for (const attr of attributeDefinitions) {
    //         try {
    //             // Check if attribute exists
    //             const existingAttribute = await this.eavService.getAttributeByCode(attr.code);

    //             if (!existingAttribute) {
    //                 this.logger.log(`Creating attribute: ${attr.code} (${attr.type})`);
    //                 console.log(`Creating attribute: ${attr.code} (${attr.type})`);
    //                 const createdAttr = await this.eavService.createAttribute(attr.code, entityType.type_id, attr.type);
    //                 console.log(`Created attribute with ID: ${createdAttr.att_id}`);
    //                 // Add a small delay to ensure database operations complete
    //                 await new Promise(resolve => setTimeout(resolve, 100));
    //             } else {
    //                 this.logger.log(`Attribute ${attr.code} already exists`);
    //                 console.log(`Attribute ${attr.code} already exists`);
    //             }
    //         } catch (error) {
    //             this.logger.error(`Error creating attribute ${attr.code}: ${error.message}`);
    //             console.error(`Error creating attribute ${attr.code}:`, error);
    //             // We'll continue trying to create other attributes instead of throwing
    //         }
    //     }
    // }

    /**
     * Set a boolean setting for a workspace
     */
    async setBooleanSetting(workspaceId: string, settingCode: string, value: boolean): Promise<void> {
        // Ensure the attribute exists before setting the value
        await this.ensureAttributeExists(settingCode, 'boolean');
        return this.eavService.setBooleanValue(workspaceId, settingCode, value);
    }

    /**
     * Set a string setting for a workspace
     */
    async setStringSetting(workspaceId: string, settingCode: string, value: string): Promise<void> {
        // Ensure the attribute exists before setting the value
        await this.ensureAttributeExists(settingCode, 'varchar');
        return this.eavService.setVarcharValue(workspaceId, settingCode, value);
    }

    /**
     * Set a number setting for a workspace
     */
    async setNumberSetting(workspaceId: string, settingCode: string, value: number): Promise<void> {
        // Ensure the attribute exists before setting the value
        await this.ensureAttributeExists(settingCode, 'int');
        return this.eavService.setIntegerValue(workspaceId, settingCode, value);
    }

    /**
     * Ensure a specific attribute exists
     */
    private async ensureAttributeExists(attCode: string, backendType: string): Promise<void> {
        const attribute = await this.eavService.getAttributeByCode(attCode);

        if (!attribute) {
            const entityType = await this.eavService.getOrCreateEntityType('workspace');
            this.logger.log(`Creating missing attribute ${attCode} (${backendType})`);
            console.log(`Creating missing attribute ${attCode} (${backendType})`);
            await this.eavService.createAttribute(attCode, entityType.type_id, backendType);
        }
    }

    /**
     * Get a boolean setting for a workspace
     */
    async getBooleanSetting(workspaceId: string, settingCode: string, defaultValue = false): Promise<boolean> {
        try {
            const value = await this.eavService.getAttributeValue(workspaceId, settingCode);
            return value !== null ? value : defaultValue;
        } catch (error) {
            this.logger.warn(`Error getting boolean setting ${settingCode}: ${error.message}`);
            return defaultValue;
        }
    }

    /**
     * Get a string setting for a workspace
     */
    async getStringSetting(workspaceId: string, settingCode: string, defaultValue = ''): Promise<string> {
        try {
            const value = await this.eavService.getAttributeValue(workspaceId, settingCode);
            return value !== null ? value : defaultValue;
        } catch (error) {
            this.logger.warn(`Error getting string setting ${settingCode}: ${error.message}`);
            return defaultValue;
        }
    }

    /**
     * Get all settings for a workspace
     */
    async getAllSettings(workspaceId: string): Promise<Record<string, any>> {
        try {
            const attributeCodes = Object.values(WORKSPACE_SETTINGS);
            return this.eavService.getEntityAttributes({ entityId: workspaceId, entityTypeCode: 'workspace', attributeCodes: attributeCodes })
        } catch (error) {
            this.logger.error(`Error getting all settings for workspace ${workspaceId}: ${error.message}`);
            return {};
        }
    }

    async updateMultipleSettings(workspaceId: string, settings: UpdateWorkspaceSettingsDto) {
        const changedSettings: string[] = [];
        const updatePromises: Promise<void>[] = [];

        const settingsMap = {
            'presenceDetection': { key: WORKSPACE_SETTINGS.PRESENCE_DETECTION, method: 'setStringSetting' },
            'visitorIdentification': { key: WORKSPACE_SETTINGS.VISITOR_IDENTIFICATION, method: 'setStringSetting' },
            'noResponseAction': { key: WORKSPACE_SETTINGS.NO_RESPONSE_ACTION, method: 'setStringSetting' },
            'noResponseDelay': { key: WORKSPACE_SETTINGS.NO_RESPONSE_DELAY, method: 'setStringSetting' },
            'showUnreadCount': { key: WORKSPACE_SETTINGS.SHOW_UNREAD_COUNT, method: 'setBooleanSetting' },
            'playSound': { key: WORKSPACE_SETTINGS.PLAY_SOUND, method: 'setBooleanSetting' },
        };

        // Fetch current settings to compare
        const currentSettings = await this.getAllSettings(workspaceId);

        for (const [settingName, value] of Object.entries(settings)) {
            if (value !== undefined && settingsMap[settingName]) {
                const { key, method } = settingsMap[settingName];

                // Update only if the value has changed
                if (currentSettings[key] !== value) {
                    changedSettings.push(settingName);

                    // Call the appropriate method to update the setting
                    if (method === 'setBooleanSetting') {
                        updatePromises.push(this.setBooleanSetting(workspaceId, key, value as boolean));
                    } else if (method === 'setStringSetting') {
                        updatePromises.push(this.setStringSetting(workspaceId, key, value as string));
                    } else if (method === 'setNumberSetting') {
                        updatePromises.push(this.setNumberSetting(workspaceId, key, value as number));
                    }
                }
            }
        }

        // Wait for all updates to complete
        if (updatePromises.length > 0) {
            await Promise.all(updatePromises);
        }

        // Get all settings after updates
        const updatedSettings = await this.getAllSettings(workspaceId);

        return { changedSettings, updatedSettings };
    }
}