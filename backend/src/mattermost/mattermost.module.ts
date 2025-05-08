import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MattermostService } from './mattermost.service';
import { MattermostController } from './mattermost.controller';
import { WorkspaceModule } from 'src/workspace/workspace.module';
import { ChatSessionModule } from 'src/chat-session/chat-session.module';

@Module({
    imports: [
        ConfigModule,
        forwardRef(() => WorkspaceModule),
        forwardRef(() => ChatSessionModule),
    ],
    providers: [MattermostService],
    controllers: [MattermostController],
    exports: [MattermostService],
})
export class MattermostModule { }