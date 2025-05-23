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
import { MattermostModule } from 'src/mattermost/mattermost.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([ChatSession]),
        forwardRef(() => WorkspaceModule),
        forwardRef(() => SlackModule),
        EavModule,
        forwardRef(() => AdaptersModule),
        forwardRef(() => MattermostModule),
    ],
    controllers: [ChatSessionController],
    providers: [ChatSessionService, ChatGateway, NoResponseTrackerService],
    exports: [ChatSessionService, NoResponseTrackerService],
})
export class ChatSessionModule { }