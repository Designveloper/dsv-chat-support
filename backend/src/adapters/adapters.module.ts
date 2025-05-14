import { Module, forwardRef } from '@nestjs/common';
import { ChatServiceFactory } from './chat-service.factory';
import { SlackModule } from '../slack/slack.module';
import { MattermostModule } from '../mattermost/mattermost.module';

@Module({
    imports: [
        forwardRef(() => SlackModule),
        forwardRef(() => MattermostModule),
    ],
    providers: [ChatServiceFactory],
    exports: [ChatServiceFactory],
})
export class AdaptersModule { }