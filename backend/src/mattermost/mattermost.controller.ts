import { Controller, Get, Post, Req, Res, UseGuards, Body, Query } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { MattermostService } from "./mattermost.service";
import { WorkspaceService } from "../workspace/workspace.service";
import { v4 as uuidv4 } from "uuid";
import { catchError } from "rxjs";

@Controller('mattermost')
export class MattermostController {
    constructor(
        private readonly mattermostService: MattermostService,
        private readonly workspaceService: WorkspaceService,
    ) { }

    @Post('connect')
    @UseGuards(JwtAuthGuard)
    async connect(@Req() req: any, @Body() body: { serverUrl: string; username: string; password: string, name?: string }) {
        try {
            const userId = req.user.userId;
            const { serverUrl, username, password, name } = body;

            await this.mattermostService.initialize(serverUrl, username, password);

            const isAuthenticated = await this.mattermostService.authenticate(username, password);
            if (!isAuthenticated) {
                return { success: false, message: 'Authentication failed' };
            }

            const token = await this.mattermostService.getToken();

            await this.mattermostService.fetchTeamId();
            const teamId = this.mattermostService['teamId'];

            const worksapceId = uuidv4();
            const workspaceName = name || "Default Workspace";

            const entityType = await this.workspaceService.getOrCreateEntityType('workspace', 'Default workspace entity type');

            const workspace = await this.workspaceService.create(
                userId,
                workspaceName,
                'mattermost',
                entityType.type_id,
            );

            await this.workspaceService.updateMattermostDetails(
                workspace.id,
                serverUrl,
                username,
                password,
                token,
                teamId
            );

            return {
                success: true,
                message: 'Connected to Mattermost successfully',
                redirectUrl: `/mattermost/select-channel?workspaceId=${workspace.id}`
            };
        }
        catch (error) {
            console.error('Error connecting to Mattermost:', error);
            return { success: false, message: 'Connection failed' };
        }
    }

    @Post('connect-bot')
    @UseGuards(JwtAuthGuard)
    async connectBot(@Body() body: { workspaceId: string, botToken: string }) {
        try {
            const { workspaceId, botToken } = body;

            const workspace = await this.workspaceService.findById(workspaceId);
            if (!workspace) {
                return { success: false, message: 'Workspace not found' };
            }

            await this.workspaceService.updateMattermostBotToken(workspaceId, botToken);

            return {
                success: true,
                message: 'Bot connected successfully'
            };
        } catch (error) {
            console.error('Error connecting bot:', error);
            return { success: false, message: 'Failed to connect bot' };
        }
    }

    @Get('channels')
    @UseGuards(JwtAuthGuard)
    async getChannels(@Query('workspaceId') workspaceId: string) {
        try {
            const workspace = await this.workspaceService.findById(workspaceId);

            if (!workspace) {
                return { success: false, message: 'Workspace not found' };
            }

            if (!workspace.service_token) {
                return { success: false, message: 'No token found for this workspace' };
            }

            // Initialize Mattermost client with workspace credentials
            await this.mattermostService.initialize(
                workspace.server_url,
                undefined,
                undefined,
                workspace.service_token,
            );

            const channels = await this.mattermostService.listChannels();
            return { success: true, channels };
        } catch (error) {
            console.error('Error fetching Mattermost channels:', error);
            return { success: false, message: 'Failed to fetch channels' };
        }
    }

    @Post('select-channel')
    @UseGuards(JwtAuthGuard)
    async selectChannel(@Req() req: any, @Body() body: { workspaceId: string; channelId: string }) {
        try {
            const userId = req.user.userId;
            const { workspaceId, channelId } = body;

            const workspace = await this.workspaceService.findById(workspaceId);
            if (!workspace) {
                return { success: false, message: 'Workspace not found' };
            }

            await this.workspaceService.updateMattermostChannel(workspaceId, channelId);

            return { success: true, message: 'Channel selected successfully' };
        } catch (error) {
            console.error('Error selecting Mattermost channel:', error);
            return { success: false, message: 'Failed to select channel' };
        }
    }
}