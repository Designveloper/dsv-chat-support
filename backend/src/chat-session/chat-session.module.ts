import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatSessionService } from './chat-session.service';
import { ChatController } from './chat-session.controller';
import { ChatSession } from './chat-session.entity';
import { WorkSpace } from '../workspace/workspace.entity';
import { SlackModule } from '../slack/slack.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([ChatSession, WorkSpace]),
        SlackModule,
    ],
    providers: [ChatSessionService],
    controllers: [ChatController],
})
export class ChatSessionModule { }