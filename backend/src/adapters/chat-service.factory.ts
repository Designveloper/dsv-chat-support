import { Injectable } from '@nestjs/common';
import { ChatServiceAdapter } from './chat-service.adapter';
import { SlackService } from '../slack/slack.service';
import { MattermostService } from '../mattermost/mattermost.service';
import { WorkSpace } from '../workspace/workspace.entity';

@Injectable()
export class ChatServiceFactory {
    constructor(
        private slackService: SlackService,
        private mattermostService: MattermostService
    ) { }

    async getChatServiceAdapter(workspace: WorkSpace): Promise<ChatServiceAdapter> {
        if (!workspace) {
            throw new Error('Workspace not provided');
        }

        // if (workspace.service_type === 'mattermost') {
        //     if (!workspace.server_url || !workspace.service_token) {
        //         throw new Error('Missing required Mattermost configuration for this workspace');
        //     }

        //     // Always initialize with the current workspace's data from the database
        //     await this.mattermostService.initialize(
        //         workspace.server_url,
        //         undefined,
        //         undefined,
        //         workspace.service_token,
        //         workspace.service_team_id,
        //         workspace.bot_token_slack // Bot token is stored in this field
        //     );
        //     return this.mattermostService;
        // } else {
        //     // Default to Slack service
        //     if (!workspace.bot_token_slack) {
        //         throw new Error('No token found for this Slack workspace');
        //     }
        //     return this.slackService;
        // }

        if (!workspace.server_url || !workspace.service_token) {
            throw new Error('Missing required Mattermost configuration for this workspace');
        }

        // Always initialize with the current workspace's data from the database
        await this.mattermostService.initialize(
            workspace.server_url,
            undefined,
            undefined,
            workspace.service_token,
            workspace.service_team_id,
            workspace.bot_token_slack
        );
        return this.mattermostService;
    }
}