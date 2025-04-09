import { Controller, Get, Post, Body, Param, UseGuards, Request, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceSettingsService, WORKSPACE_SETTINGS } from './workspace-settings.service';
import { UpdateWorkspaceSettingsDto } from './workspace-settings.dto';

@Controller('workspace-settings')
export class WorkspaceSettingsController {
    private readonly logger = new Logger(WorkspaceSettingsController.name);

    constructor(private readonly workspaceSettingsService: WorkspaceSettingsService) { }

    @Get(':workspaceId')
    @UseGuards(JwtAuthGuard)
    async getSettings(@Param('workspaceId') workspaceId: string, @Request() req) {
        const settings = await this.workspaceSettingsService.getAllSettings(workspaceId);
        return { settings };
    }

    @Post(':workspaceId/update')
    @UseGuards(JwtAuthGuard)
    async updateSettings(
        @Param('workspaceId') workspaceId: string,
        @Body() settings: UpdateWorkspaceSettingsDto,
    ) {
        try {
            this.logger.log(`Updating settings for workspace: ${workspaceId}`);

            const { changedSettings, updatedSettings } =
                await this.workspaceSettingsService.updateMultipleSettings(workspaceId, settings);

            return {
                success: true,
                message: changedSettings.length > 0 ? 'Settings updated successfully' : 'No settings were changed',
                changedSettings,
                settings: updatedSettings
            };
        } catch (error) {
            this.logger.error(`Error updating workspace settings: ${error.message}`, error.stack);
            return { success: false, message: error.message };
        }
    }
}