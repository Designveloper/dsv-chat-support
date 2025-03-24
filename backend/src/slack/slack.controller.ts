import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { SlackService } from './slack.service';
import { WorkspaceService } from '../workspace/workspace.service';

@Controller('slack')
export class SlackOAuthController {
    constructor(
        private configService: ConfigService,
        private slackService: SlackService,
        private workspaceService: WorkspaceService,
    ) { }

    @Get('install')
    @UseGuards(AuthGuard('jwt')) // Assumes JWT auth from your users module
    async install(@Req() req, @Res() res) {
        const clientId = this.configService.get('SLACK_CLIENT_ID');
        const redirectUri = this.configService.get('SLACK_REDIRECT_URI');
        const scopes = 'channels:manage,commands,channels:read,channels:join,chat:write';
        const state = 'some-state'; // Use a secure random string in production

        const url = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${redirectUri}&state=${state}`;
        console.log('Redirecting to Slack OAuth:', url);
        return res.redirect(url);
    }

    @Get('oauth_redirect')
    async oauthRedirect(@Req() req, @Res() res) {
        const code = req.query.code as string;
        const redirectUri = this.configService.get('SLACK_REDIRECT_URI');
        try {
            const data = await this.slackService.exchangeCodeForToken(code, redirectUri);
            console.log(data);

            if (data.ok) {
                const botToken = data.access_token;
                const slackWorkspaceId = data.team.id;
                const workspaceId = '33fc4525-349f-4dbb-950c-dbe88681309d';
                await this.workspaceService.updateSlackDetails(
                    workspaceId,
                    botToken,
                    '', // Set channel later via frontend
                    slackWorkspaceId,
                );
                return res.redirect('/dashboard'); // Adjust redirect URL
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Slack OAuth error:', error);
            return res.status(500).send('Slack authentication failed');
        }
    }
}