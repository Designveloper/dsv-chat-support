import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatSessionService } from './chat-session.service';
import { ChatSessionController } from './chat-session.controller';
import { ChatGateway } from './chat.gateway';
import { ChatSession } from './chat-session.entity';
import { WorkSpace } from '../workspace/workspace.entity';
import { SlackModule } from '../slack/slack.module';
import { WorkspaceModule } from 'src/workspace/workspace.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([ChatSession, WorkSpace]),
        WorkspaceModule,
        forwardRef(() => SlackModule),
    ],
    providers: [ChatSessionService, ChatGateway],
    controllers: [ChatSessionController],
    exports: [ChatSessionService],
})
export class ChatSessionModule { }