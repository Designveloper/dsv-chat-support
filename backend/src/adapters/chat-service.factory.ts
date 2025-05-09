import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ChatServiceAdapter } from './chat-service.adapter';
import { SlackService } from '../slack/slack.service';
import { MattermostService } from '../mattermost/mattermost.service';
import { WorkSpace } from '../workspace/workspace.entity';

@Injectable()
export class ChatServiceFactory {
    constructor(
        @Inject(forwardRef(() => SlackService))
        private slackService: SlackService,
        @Inject(forwardRef(() => MattermostService))
        private mattermostService: MattermostService
    ) { }

    async getChatServiceAdapter(workspace: WorkSpace): Promise<ChatServiceAdapter> {
        if (!workspace) {
            throw new Error('Workspace not provided');
        }

        switch (workspace.service_type) {
            case 'slack':
                console.log(`Using Slack adapter for workspace ${workspace.id}`);

                if (!workspace.bot_token) {
                    throw new Error('Missing required Slack configuration for this workspace');
                }
                return this.slackService;

            case 'mattermost':
                console.log(`Using Mattermost adapter for workspace ${workspace.id}`);

                if (!workspace.server_url || !workspace.service_token) {
                    throw new Error('Missing required Mattermost configuration for this workspace');
                }

                return this.mattermostService;

            default:
                throw new Error(`Unsupported chat service type: ${workspace.service_type}`);
        }
    }
}