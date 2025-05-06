import { Injectable } from '@nestjs/common';
import { SlackService } from '../slack/slack.service';
import { MattermostService } from '../mattermost/mattermost.service';
import { ChatServiceAdapter } from './chat-service.adapter';
import { WorkSpace } from '../workspace/workspace.entity';

@Injectable()
export class ChatServiceFactory {
    constructor(
        private slackService: SlackService,
        private mattermostService: MattermostService
    ) { }

    async createForWorkspace(workspace: WorkSpace): Promise<ChatServiceAdapter> {
        if (!workspace) {
            throw new Error('Workspace not provided');
        }

        // if (workspace.service_type === 'mattermost') {
        //     // Initialize and return Mattermost service
        //     await this.mattermostService.initialize(
        //         workspace.server_url,
        //         workspace.service_username,
        //         workspace.service_password,
        //         undefined // team ID will be determined in the service
        //     );
        //     return this.mattermostService;
        // } else {
        //     // Default to Slack service
        //     return this.slackService;
        // }

        await this.mattermostService.initialize(
            workspace.server_url,
            workspace.service_username,
            workspace.service_password,
            undefined // team ID will be determined in the service
        );
        return this.mattermostService;
    }
}