import { Controller, Get, Post, Req, Res, UseGuards, Body, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SlackService } from './slack.service';

@Controller('slack')
export class SlackController {
    constructor(
        private slackService: SlackService,
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

    @Get('channels')
    @UseGuards(JwtAuthGuard)
    async getChannels(@Query('workspaceId') workspaceId: string) {
        return this.slackService.getWorkspaceChannels(workspaceId);
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