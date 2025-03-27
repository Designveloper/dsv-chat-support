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

@Module({
    imports: [
        TypeOrmModule.forFeature([ChatSession]),
        WorkspaceModule,
        HttpModule,
        ConfigModule,
        forwardRef(() => ChatSessionModule),
    ],
    providers: [SlackService, SlackBoltService],
    controllers: [SlackController],
    exports: [SlackService, SlackBoltService],
})
export class SlackModule { }