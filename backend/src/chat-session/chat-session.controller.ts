import { Controller, Get, Post, Body, Req, Query } from '@nestjs/common';
import { Request } from 'express';
import { ChatSessionService } from './chat-session.service';

@Controller('chat')
export class ChatSessionController {
    constructor(private chatSessionService: ChatSessionService) { }

    @Post('start')
    async startChat(@Body() body: { workspace_id: string }) {
        const { workspace_id } = body;

        const session = await this.chatSessionService.startChat(workspace_id);

        return { session_id: session.session_id };
    }

    @Post('message')
    async sendMessage(@Body() body: { session_id: string; message: string; userInfo?: { email: string, userId?: string }, currentPage?: string }, @Req() request: Request) {
        try {
            const { session_id, message, userInfo, currentPage } = body;

            if (currentPage && request.headers) {
                request.headers['referer'] = currentPage;
            }

            await this.chatSessionService.sendMessage(session_id, message, request, userInfo);
            return { success: true };
        } catch (error) {
            console.error('Error sending message:', error);
            throw new Error('Failed to send message');
        }
    }

    @Post('end')
    async endChat(@Body() body: { session_id: string }) {
        try {
            const { session_id } = body;
            await this.chatSessionService.endChatSession(session_id);
            return { success: true };
        } catch (error) {
            console.error('Error ending chat session:', error);
            throw new Error('Failed to end chat session');
        }
    }

    @Get('status')
    async getStatus(@Query('workspace_id') workspaceId: string): Promise<{ isOnline: boolean }> {
        try {
            const isOnline = await this.chatSessionService.isWorkspaceOnline(workspaceId);
            return { isOnline };
        } catch (error) {
            console.error('Error checking workspace status:', error);
            return { isOnline: false };
        }
    }

    @Post('offline-message')
    async submitOfflineMessage(
        @Body() body: { workspace_id: string; email: string; message: string; name?: string },
        @Req() request: Request
    ) {
        try {
            await this.chatSessionService.handleOfflineMessage(
                body.workspace_id,
                body.email,
                body.message,
                body.name,
                request
            );
            return { success: true };
        } catch (error) {
            console.error('Error submitting offline message:', error);
            throw new Error('Failed to submit offline message');
        }
    }
}