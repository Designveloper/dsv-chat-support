import { Controller, Get, Post, Req, UseGuards, Body, Query, BadRequestException } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { MattermostService } from "./mattermost.service";

@Controller('mattermost')
export class MattermostController {
    constructor(
        private readonly mattermostService: MattermostService
    ) { }

    @Post('connect')
    @UseGuards(JwtAuthGuard)
    async connect(@Req() req: any, @Body() body: { serverUrl: string; username: string; password: string, name?: string }) {
        const userId = req.user.userId;
        const { serverUrl, username, password, name } = body;

        const result = await this.mattermostService.connectWorkspace(userId, serverUrl, username, password, name);

        if (result.success) {
            return {
                ...result,
                workspaceId: result.workspace.id,
            };
        }

        return result;
    }

    @Post('connect-bot')
    @UseGuards(JwtAuthGuard)
    async connectBot(@Body() body: { workspaceId: string, botToken: string }) {
        const { workspaceId, botToken } = body;
        return await this.mattermostService.connectBotToWorkspace(workspaceId, botToken);
    }

    @Get('teams')
    @UseGuards(JwtAuthGuard)
    async getTeams(@Query('workspaceId') workspaceId: string) {
        if (!workspaceId) {
            throw new BadRequestException('workspaceId is required');
        }
        return await this.mattermostService.getTeamsForWorkspace(workspaceId);
    }

    @Post('select-team')
    @UseGuards(JwtAuthGuard)
    async selectTeam(@Body() body: { workspaceId: string; teamId: string }) {
        const { workspaceId, teamId } = body;
        return await this.mattermostService.selectTeamForWorkspace(workspaceId, teamId);
    }

    @Get('channels')
    @UseGuards(JwtAuthGuard)
    async getChannels(@Query('workspaceId') workspaceId: string) {
        if (!workspaceId) {
            throw new BadRequestException('workspaceId is required');
        }
        return await this.mattermostService.getChannelsForWorkspace(workspaceId);
    }

    @Post('select-channel')
    @UseGuards(JwtAuthGuard)
    async selectChannel(@Body() body: { workspaceId: string; channelId: string }) {
        const { workspaceId, channelId } = body;
        return await this.mattermostService.selectChannelForWorkspace(workspaceId, channelId);
    }
}