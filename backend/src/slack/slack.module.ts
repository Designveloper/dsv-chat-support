import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlackService } from './slack.service';
import { SlackOAuthController } from './slack.controller';
import { ChatSession } from '../chat-session/chat-session.entity';
import { WorkspaceModule } from 'src/workspace/workspace.module';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [
        TypeOrmModule.forFeature([ChatSession]),
        WorkspaceModule,
        HttpModule
    ],
    providers: [SlackService],
    controllers: [SlackOAuthController],
    exports: [SlackService],
})
export class SlackModule { }