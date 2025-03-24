import { Module } from '@nestjs/common';
import { SlackService } from './slack.service';
import { SlackOAuthController } from './slack.controller';
import { WorkspaceModule } from '../workspace/workspace.module';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [HttpModule, WorkspaceModule],
    providers: [SlackService],
    controllers: [SlackOAuthController],
    exports: [SlackService],
})
export class SlackModule { }