import { Controller, Get, Post, Req, Res, UseGuards, Body, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SlackService } from './slack.service';
import { WorkspaceService } from '../workspace/workspace.service';

@Controller('slack')
export class SlackController {
    constructor(
        private slackService: SlackService,
        private workspaceService: WorkspaceService,
    ) { }

    @Get('auth-url')
    @UseGuards(JwtAuthGuard)
    async getAuthUrl(@Req() req) {
        const userId = req.user.userId;
        return this.slackService.generateAuthUrl(userId);
    }

    @Get('oauth_redirect')
    async oauthRedirect(@Req() req, @Res() res) {
        const { code, state } = req.query;
        const redirectResult = await this.slackService.handleOAuthRedirect(code, state);
        return res.redirect(redirectResult.redirectUrl);
    }

    @Post('complete-oauth')
    @UseGuards(JwtAuthGuard)
    async completeOAuth(@Body() body: { code: string, state: string }) {
        return this.slackService.completeOAuth(body.code, body.state);
    }

    @Get('channels')
    @UseGuards(JwtAuthGuard)
    async getChannels(@Req() req, @Query('workspaceId') workspaceId: string) {
        const userId = req.user.userId;
        return this.slackService.getWorkspaceChannels(userId, workspaceId);
    }

    @Post('select-channel')
    @UseGuards(JwtAuthGuard)
    async selectChannel(
        @Req() req,
        @Body() body: { workspaceId: string, channelId: string }
    ) {
        const userId = req.user.userId;
        return this.slackService.selectChannel(userId, body.workspaceId, body.channelId);
    }
}