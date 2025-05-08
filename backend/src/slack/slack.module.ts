import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlackService } from './slack.service';
import { SlackBoltService } from './slack-bolt.service';
import { SlackController } from './slack.controller';
import { ChatSession } from '../chat-session/chat-session.entity';
import { WorkspaceModule } from 'src/workspace/workspace.module';
import { HttpModule } from '@nestjs/axios';
import { ChatSessionModule } from '../chat-session/chat-session.module';
import { ConfigModule } from '@nestjs/config';
import { EavModule } from 'src/eav/eav.module';
import { NoResponseTrackerService } from '../chat-session/no-response-tracker.service';
import { AdaptersModule } from 'src/adapters/adapters.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([ChatSession]),
        EavModule,
        HttpModule,
        ConfigModule,
        forwardRef(() => ChatSessionModule),
        forwardRef(() => WorkspaceModule),
        forwardRef(() => AdaptersModule),
    ],
    providers: [SlackService, SlackBoltService],
    controllers: [SlackController],
    exports: [SlackService, SlackBoltService],
})
export class SlackModule { }