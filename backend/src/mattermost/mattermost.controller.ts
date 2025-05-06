import { Controller, Get, Post, Req, Res, UseGuards, Body } from "@nestjs/common";
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
            const userId = req.user.id;
            const { serverUrl, username, password, name } = body;

            await this.mattermostService.initialize(serverUrl, username, password);

            const isAuthenticated = await this.mattermostService.authenticate(username, password);
            if (!isAuthenticated) {
                return { success: false, message: 'Authentication failed' };
            }

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
}