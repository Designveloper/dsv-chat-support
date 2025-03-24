import { Controller, Post, Body } from '@nestjs/common';
import { ChatSessionService } from './chat-session.service';

@Controller('chat')
export class ChatController {
    constructor(private chatSessionService: ChatSessionService) { }

    @Post('start')
    async startChat(@Body('workspace_id') workspaceId: string) {
        const session = await this.chatSessionService.startChat(workspaceId);
        return { session_id: session.session_id };
    }
}