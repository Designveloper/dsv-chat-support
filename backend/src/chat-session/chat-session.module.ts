import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatSessionController } from './chat-session.controller';
import { ChatSessionService } from './chat-session.service';
import { ChatSession } from './chat-session.entity';
import { WorkspaceModule } from '../workspace/workspace.module';
import { SlackModule } from '../slack/slack.module';
import { ChatGateway } from './chat.gateway';
import { EavModule } from '../eav/eav.module';
import { NoResponseTrackerService } from './no-response-tracker.service';
import { AdaptersModule } from 'src/adapters/adapters.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([ChatSession]),
        forwardRef(() => WorkspaceModule),
        forwardRef(() => SlackModule),
        EavModule,
        AdaptersModule,
    ],
    controllers: [ChatSessionController],
    providers: [ChatSessionService, ChatGateway, NoResponseTrackerService],
    exports: [ChatSessionService],
})
export class ChatSessionModule { }