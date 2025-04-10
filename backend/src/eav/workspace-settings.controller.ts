import { Controller, Get, Post, Body, Param, UseGuards, Request, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceSettingsService, WORKSPACE_SETTINGS } from './workspace-settings.service';
import { UpdateWorkspaceSettingsDto } from './workspace-settings.dto';

@Controller('workspace-settings')
export class WorkspaceSettingsController {
    private readonly logger = new Logger(WorkspaceSettingsController.name);

    constructor(private readonly workspaceSettingsService: WorkspaceSettingsService) { }

    @Get(':workspaceId')
    async getSettings(@Param('workspaceId') workspaceId: string) {
        try {
            const settings = await this.workspaceSettingsService.getAllSettings(workspaceId);

            return { settings };
        } catch (error) {
            this.logger.error(`Error getting workspace settings: ${error.message}`);
            return {
                error: error.message,
                success: false
            };
        }
    }

    @Post(':workspaceId/update')
    @UseGuards(JwtAuthGuard)
    async updateSettings(
        @Param('workspaceId') workspaceId: string,
        @Body() settings: UpdateWorkspaceSettingsDto,
    ) {
        try {
            const { updatedSettings } =
                await this.workspaceSettingsService.updateMultipleSettings(workspaceId, settings);
            return {
                success: true,
                settings: updatedSettings
            };
        } catch (error) {
            this.logger.error(`Error updating workspace settings: ${error.message}`, error.stack);
            return { success: false, message: error.message };
        }
    }
}