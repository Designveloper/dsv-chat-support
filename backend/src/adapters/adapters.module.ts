import { Module } from '@nestjs/common';
import { ChatServiceFactory } from './chat-service.factory';
import { SlackModule } from '../slack/slack.module';
import { MattermostModule } from '../mattermost/mattermost.module';

@Module({
    imports: [
        SlackModule,
        MattermostModule,
    ],
    providers: [ChatServiceFactory],
    exports: [ChatServiceFactory],
})
export class AdaptersModule { }