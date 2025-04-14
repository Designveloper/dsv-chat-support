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
    OPERATING_HOURS: 'operating_hours',
};

@Injectable()
export class WorkspaceSettingsService {
    private readonly logger = new Logger(WorkspaceSettingsService.name);

    constructor(private readonly eavService: EavService) { }

    async initializeDefaultSettings(workspaceId: string): Promise<void> {
        this.logger.log(`Initializing default settings for workspace: ${workspaceId}`);

        const defaultSettings = [
            { code: WORKSPACE_SETTINGS.PRESENCE_DETECTION, type: 'varchar', value: 'auto' },
            { code: WORKSPACE_SETTINGS.VISITOR_IDENTIFICATION, type: 'varchar', value: 'none' },
            { code: WORKSPACE_SETTINGS.NO_RESPONSE_ACTION, type: 'varchar', value: 'no warnings' },
            { code: WORKSPACE_SETTINGS.NO_RESPONSE_DELAY, type: 'varchar', value: '300' },
            { code: WORKSPACE_SETTINGS.SHOW_UNREAD_COUNT, type: 'boolean', value: false },
            { code: WORKSPACE_SETTINGS.PLAY_SOUND, type: 'boolean', value: true },
            { code: WORKSPACE_SETTINGS.OPERATING_HOURS, type: 'text', value: 'none' },
        ];


        await this.eavService.setEntityAttributes({
            entityId: workspaceId,
            entityTypeCode: 'workspace',
            attributes: defaultSettings
        });

        this.logger.log(`Default settings initialization completed for workspace: ${workspaceId}`);
    }

    async setBooleanSetting(workspaceId: string, settingCode: string, value: boolean): Promise<void> {
        // Ensure the attribute exists before setting the value
        await this.ensureAttributeExists(settingCode, 'boolean');
        return this.eavService.setBooleanValue(workspaceId, settingCode, value);
    }

    async setStringSetting(workspaceId: string, settingCode: string, value: string): Promise<void> {
        // Ensure the attribute exists before setting the value
        await this.ensureAttributeExists(settingCode, 'varchar');
        return this.eavService.setVarcharValue(workspaceId, settingCode, value);
    }
    async setNumberSetting(workspaceId: string, settingCode: string, value: number): Promise<void> {
        // Ensure the attribute exists before setting the value
        await this.ensureAttributeExists(settingCode, 'int');
        return this.eavService.setIntegerValue(workspaceId, settingCode, value);
    }

    async setTextSetting(workspaceId: string, settingCode: string, value: string): Promise<void> {
        // Ensure the attribute exists before setting the value
        await this.ensureAttributeExists(settingCode, 'text');
        return this.eavService.setTextValue(workspaceId, settingCode, value);
    }

    private async ensureAttributeExists(attCode: string, backendType: string): Promise<void> {
        const attribute = await this.eavService.getAttributeByCode(attCode);

        if (!attribute) {
            const entityType = await this.eavService.getOrCreateEntityType('workspace');
            this.logger.log(`Creating missing attribute ${attCode} (${backendType})`);
            await this.eavService.createAttribute({
                attCode: attCode,
                backendType: backendType,
                entityTypeId: entityType.type_id,
            });
        };
    }

    async getBooleanSetting(workspaceId: string, settingCode: string, defaultValue = false): Promise<boolean> {
        try {
            const value = await this.eavService.getAttributeValue(workspaceId, settingCode);
            return value !== null ? value : defaultValue;
        } catch (error) {
            this.logger.warn(`Error getting boolean setting ${settingCode}: ${error.message}`);
            return defaultValue;
        }
    }

    async getStringSetting(workspaceId: string, settingCode: string, defaultValue = ''): Promise<string> {
        try {
            const value = await this.eavService.getAttributeValue(workspaceId, settingCode);
            console.log("🚀 ~ WorkspaceSettingsService ~ getStringSetting ~ value:", value)
            return value !== null ? value : defaultValue;
        } catch (error) {
            this.logger.warn(`Error getting string setting ${settingCode}: ${error.message}`);
            return defaultValue;
        }
    }

    async getAllSettings(workspaceId: string): Promise<Record<string, any>> {
        try {
            await this.eavService.getOrCreateEntityType('workspace');

            const attributeCodes = Object.values(WORKSPACE_SETTINGS);

            const settings = await this.eavService.getEntityAttributes({
                entityId: workspaceId,
                entityTypeCode: 'workspace',
                attributeCodes
            });

            const missingSettings = attributeCodes.filter(code => settings[code] === undefined);

            if (missingSettings.length > 0) {
                await this.initializeDefaultSettings(workspaceId);

                return this.eavService.getEntityAttributes({
                    entityId: workspaceId,
                    entityTypeCode: 'workspace',
                    attributeCodes
                });
            }
            return settings;
        } catch (error) {
            this.logger.error(`Error getting all settings for workspace ${workspaceId}: ${error.message}`);
            return {};
        }
    }

    async updateMultipleSettings(workspaceId: string, settings: UpdateWorkspaceSettingsDto) {
        const settingsMap = [
            {
                dtoKey: 'presenceDetection',
                attrCode: WORKSPACE_SETTINGS.PRESENCE_DETECTION,
                type: 'varchar'
            },
            {
                dtoKey: 'visitorIdentification',
                attrCode: WORKSPACE_SETTINGS.VISITOR_IDENTIFICATION,
                type: 'varchar'
            },
            {
                dtoKey: 'noResponseAction',
                attrCode: WORKSPACE_SETTINGS.NO_RESPONSE_ACTION,
                type: 'varchar'
            },
            {
                dtoKey: 'noResponseDelay',
                attrCode: WORKSPACE_SETTINGS.NO_RESPONSE_DELAY,
                type: 'varchar'
            },
            {
                dtoKey: 'showUnreadCount',
                attrCode: WORKSPACE_SETTINGS.SHOW_UNREAD_COUNT,
                type: 'boolean'
            },
            {
                dtoKey: 'playSound',
                attrCode: WORKSPACE_SETTINGS.PLAY_SOUND,
                type: 'boolean'
            },
            {
                dtoKey: 'operatingHours',
                attrCode: WORKSPACE_SETTINGS.OPERATING_HOURS,
                type: 'text'
            }
        ];

        const attributes: { code: string; type: string; value: any }[] = [];

        for (const setting of settingsMap) {
            const newValue = settings[setting.dtoKey];

            if (newValue !== undefined) {
                attributes.push({
                    code: setting.attrCode,
                    type: setting.type,
                    value: newValue
                });
            }
        }

        if (attributes.length > 0) {
            this.logger.log(`Updating ${attributes.length} settings for workspace ${workspaceId}`);
            await this.eavService.setEntityAttributes({
                entityId: workspaceId,
                entityTypeCode: 'workspace',
                attributes
            });
        }

        const updatedSettings = await this.getAllSettings(workspaceId);

        return { updatedSettings };
    }
}