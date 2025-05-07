import { Controller, Get, Post, Req, Res, UseGuards, Body, Query } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { MattermostService } from "./mattermost.service";
import { WorkspaceService } from "../workspace/workspace.service";
import { v4 as uuidv4 } from "uuid";

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

            // Initialize client with the server URL
            await this.mattermostService.initialize(serverUrl, username, password);

            // Authenticate with the provided credentials
            const isAuthenticated = await this.mattermostService.authenticate(username, password);
            if (!isAuthenticated) {
                return { success: false, message: 'Authentication failed' };
            }

            // Get token from the current client session
            const token = this.mattermostService.getToken();

            // Create a new workspace ID
            const workspaceId = uuidv4();
            const workspaceName = name || "Default Workspace";

            // Get or create the entity type for the workspace
            const entityType = await this.workspaceService.getOrCreateEntityType('workspace', 'Default workspace entity type');

            // Create the workspace entry
            const workspace = await this.workspaceService.create(
                userId,
                workspaceName,
                'mattermost',
                entityType.type_id,
            );

            // Save the Mattermost details to the workspace
            await this.workspaceService.updateMattermostDetails(
                workspace.id,
                serverUrl,
                username,
                password,
                token,
            );

            return {
                success: true,
                message: 'Connected to Mattermost successfully',
                workspaceId: workspace.id,
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

            // Verify workspace exists
            const workspace = await this.workspaceService.findById(workspaceId);
            if (!workspace) {
                return { success: false, message: 'Workspace not found' };
            }

            // Update the bot token in the workspace record
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

    @Get('teams')
    @UseGuards(JwtAuthGuard)
    async getTeams(@Query('workspaceId') workspaceId: string) {
        try {
            console.log("Getting teams for workspace:", workspaceId);

            // Get the workspace details from the database
            const workspace = await this.workspaceService.findById(workspaceId);

            if (!workspace) {
                return { success: false, message: 'Workspace not found' };
            }

            if (!workspace.service_token) {
                return { success: false, message: 'No token found for this workspace' };
            }

            // Initialize Mattermost client with workspace credentials from DB
            await this.mattermostService.initialize(
                workspace.server_url,
                undefined,
                undefined,
                workspace.service_token
            );

            // Get teams
            const teams = await this.mattermostService.listTeams();
            return { success: true, teams };
        } catch (error) {
            console.error('Error fetching Mattermost teams:', error);
            return { success: false, message: 'Failed to fetch teams' };
        }
    }

    @Post('select-team')
    @UseGuards(JwtAuthGuard)
    async selectTeam(@Body() body: { workspaceId: string; teamId: string }) {
        try {
            const { workspaceId, teamId } = body;

            // Verify workspace exists
            const workspace = await this.workspaceService.findById(workspaceId);
            if (!workspace) {
                return { success: false, message: 'Workspace not found' };
            }

            // Update the selected team in the workspace record
            await this.workspaceService.updateMattermostTeam(workspaceId, teamId);

            return { success: true, message: 'Team selected successfully' };
        } catch (error) {
            console.error('Error selecting Mattermost team:', error);
            return { success: false, message: 'Failed to select team' };
        }
    }

    @Get('channels')
    @UseGuards(JwtAuthGuard)
    async getChannels(@Query('workspaceId') workspaceId: string) {
        try {
            console.log("Getting channels for workspace:", workspaceId);

            // Get the workspace details from the database
            const workspace = await this.workspaceService.findById(workspaceId);

            if (!workspace) {
                return { success: false, message: 'Workspace not found' };
            }

            if (!workspace.service_token) {
                return { success: false, message: 'No token found for this workspace' };
            }

            if (!workspace.service_team_id) {
                return { success: false, message: 'No team selected for this workspace' };
            }

            // Initialize Mattermost client with workspace credentials from DB
            await this.mattermostService.initialize(
                workspace.server_url,
                undefined,
                undefined,
                workspace.service_token
            );

            // Get channels using the team ID from the workspace
            const channels = await this.mattermostService.listChannels(workspace.service_team_id);
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

            // Verify workspace exists
            const workspace = await this.workspaceService.findById(workspaceId);
            if (!workspace) {
                return { success: false, message: 'Workspace not found' };
            }

            // Update the selected channel in the workspace record
            await this.workspaceService.updateMattermostChannel(workspaceId, channelId);

            return { success: true, message: 'Channel selected successfully' };
        } catch (error) {
            console.error('Error selecting Mattermost channel:', error);
            return { success: false, message: 'Failed to select channel' };
        }
    }
}