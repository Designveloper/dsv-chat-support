import { Controller, Post, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatWidgetsService } from './chat-widgets.service';

@Controller('chat-widgets')
export class ChatWidgetsController {
    constructor(private chatWidgetsService: ChatWidgetsService) { }

    @UseGuards(JwtAuthGuard)
    @Get()
    async getUserWidgets(@Request() req) {
        return this.chatWidgetsService.findByOwnerId(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    async createWidget(@Request() req) {
        const newWidget = await this.chatWidgetsService.create(req.user.userId);
        return {
            widget_id: newWidget.widget_id,
            created_at: newWidget.createdAt,
        };
    }
}