import { Controller, Post, Get, UseGuards, Request, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceService } from './workspace.service';

@Controller('workspace')
export class WorkspaceController {
    constructor(private workspaceService: WorkspaceService) { }

    @UseGuards(JwtAuthGuard)
    @Get()
    async getUserWorkspaces(@Request() req) {
        return this.workspaceService.findByOwnerId(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    async createWorkspace(@Request() req) {
        const newWorkspace = await this.workspaceService.create(req.user.userId, "Default Workspace");
        return {
            workspace_id: newWorkspace.id,
            created_at: newWorkspace.createdAt,
        };
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async getWorkspace(@Param('id') id: string, @Request() req) {
        const workspaces = await this.workspaceService.findByOwnerId(req.user.userId);
        const workspace = workspaces.find(w => w.id === id);

        if (!workspace) {
            throw new Error(`Workspace with ID ${id} not found or access denied`);
        }

        return workspace;
    }
}