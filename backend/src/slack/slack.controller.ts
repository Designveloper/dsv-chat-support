import { Controller, Get, Post, Req, Res, UseGuards, Body, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { SlackService } from './slack.service';
import { WorkspaceService } from '../workspace/workspace.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('slack')
export class SlackOAuthController {
    constructor(
        private configService: ConfigService,
        private slackService: SlackService,
        private workspaceService: WorkspaceService,
    ) { }

    @Get('auth-url')
    @UseGuards(JwtAuthGuard)
    async getAuthUrl(@Req() req) {
        const clientId = this.configService.get('SLACK_CLIENT_ID');
        const redirectUri = this.configService.get('SLACK_REDIRECT_URI');
        const scopes = 'channels:manage,channels:history,commands,channels:read,channels:join,chat:write,chat:write.customize,users:read,users:read.email';

        const userId = req.user.userId;
        const state = `user-${userId}-${Date.now()}`;
        const url = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${redirectUri}&state=${state}&team_selection=true`;

        console.log("Generated Slack URL:", url);

        return { url };
    }

    @Get('oauth_redirect')
    async oauthRedirect(@Req() req, @Res() res) {
        const code = req.query.code as string;
        const state = req.query.state as string;
        const redirectUri = this.configService.get('SLACK_REDIRECT_URI');
        console.log('Slack OAuth redirect:', code, state);

        try {
            // Extract user ID from state
            const stateMatch = state.match(/user-(\d+)-/);
            if (!stateMatch) {
                throw new Error('Invalid state parameter');
            }
            const userId = parseInt(stateMatch[1]);

            const data = await this.slackService.exchangeCodeForToken(code, redirectUri);
            console.log('Slack OAuth response:', data);

            if (data.ok) {
                const botToken = data.access_token;
                const slackWorkspaceId = data.team.id;

                // Get user's workspaces
                const workspaces = await this.workspaceService.findByOwnerId(userId);

                let workspaceId: string;

                if (workspaces.length === 0) {
                    // Create a new workspace if none exists
                    const workspace = await this.workspaceService.create(
                        userId,
                        `${data.team.name} Workspace`,
                        'slack'
                    );

                    workspaceId = workspace.id;
                } else {
                    // Use existing workspace
                    workspaceId = workspaces[0].id;
                }

                // Save initial Slack details without channel
                await this.workspaceService.updateSlackDetails(
                    workspaceId,
                    botToken,
                    '',
                    slackWorkspaceId
                );

                // Redirect to channel selection page instead of dashboard
                const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:5173');
                return res.redirect(`${frontendUrl}/slack/select-channel?workspaceId=${workspaceId}`);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Slack OAuth error:', error);
            const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:5173');
            return res.redirect(`${frontendUrl}/dashboard?error=slack_connection_failed`);
        }
    }

    @Post('complete-oauth')
    @UseGuards(JwtAuthGuard)
    async completeOAuth(@Req() req, @Body() body: { code: string, state: string }) {
        const { code, state } = body;
        const redirectUri = this.configService.get('SLACK_REDIRECT_URI');

        try {
            // Extract user ID from state
            const stateMatch = state.match(/user-(\d+)-/);
            if (!stateMatch) {
                throw new Error('Invalid state parameter');
            }
            const userId = parseInt(stateMatch[1]);

            const data = await this.slackService.exchangeCodeForToken(code, redirectUri);

            if (data.ok) {
                const botToken = data.access_token;
                const slackWorkspaceId = data.team.id;

                // Get user's workspaces
                const workspaces = await this.workspaceService.findByOwnerId(userId);

                if (workspaces.length === 0) {
                    // Create workspace if none exists
                    const workspace = await this.workspaceService.create(
                        userId,
                        `${data.team.name} Workspace`,
                        'slack'
                    );

                    await this.workspaceService.updateSlackDetails(
                        workspace.id,
                        botToken,
                        '',
                        slackWorkspaceId
                    );
                } else {
                    // Update existing workspace
                    await this.workspaceService.updateSlackDetails(
                        workspaces[0].id,
                        botToken,
                        '',
                        slackWorkspaceId
                    );
                }

                return { success: true };
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Slack OAuth error:', error);
            throw new Error('Failed to complete Slack integration');
        }
    }

    @Get('channels')
    @UseGuards(JwtAuthGuard)
    async getChannels(@Req() req, @Query('workspaceId') workspaceId: string) {
        try {
            const workspace = await this.workspaceService.findById(workspaceId);

            if (!workspace) {
                throw new Error('Workspace not found');
            }

            if (!workspace.bot_token_slack) {
                throw new Error('Slack not connected to this workspace');
            }

            const channels = await this.slackService.listChannels(workspace.bot_token_slack);
            return { channels };
        } catch (error) {
            console.error('Error fetching channels:', error);
            throw new Error('Failed to fetch Slack channels');
        }
    }

    @Post('select-channel')
    @UseGuards(JwtAuthGuard)
    async selectChannel(
        @Req() req,
        @Body() body: { workspaceId: string, channelId: string }
    ) {
        try {
            const { workspaceId, channelId } = body;

            // Verify the user owns this workspace
            const workspaces = await this.workspaceService.findByOwnerId(req.user.userId);
            const authorized = workspaces.some(w => w.id === workspaceId);

            if (!authorized) {
                throw new Error('Not authorized to update this workspace');
            }

            // Get current workspace details
            const workspace = await this.workspaceService.findById(workspaceId);

            // Update just the channel ID
            await this.workspaceService.updateSlackDetails(
                workspaceId,
                workspace.bot_token_slack,
                channelId,
                workspace.service_slack_account_id
            );

            return { success: true };
        } catch (error) {
            console.error('Error selecting channel:', error);
            throw new Error('Failed to select Slack channel');
        }
    }
}
