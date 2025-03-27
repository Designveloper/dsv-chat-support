import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatSessionService } from './chat-session.service';
import { userInfo } from 'os';

@Controller('chat')
export class ChatSessionController {
    constructor(private chatSessionService: ChatSessionService) { }

    @Post('start')
    // @UseGuards(JwtAuthGuard)
    async startChat(@Req() req, @Body() body: { workspace_id: string }) {
        const userId = req.user?.userId || null;
        const { workspace_id } = body;

        const session = await this.chatSessionService.startChat(workspace_id, userId);

        return { session_id: session.session_id };
    }

    @Post('message')
    // @UseGuards(JwtAuthGuard)
    async sendMessage(@Body() body: { session_id: string; message: string; userInfo?: { email: string }, currentPage?: string }, @Req() request: Request) {
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
}