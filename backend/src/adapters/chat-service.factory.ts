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

        // Determine which service to use based on workspace type
        if (workspace.service_type === 'slack') {
            console.log(`Using Slack adapter for workspace ${workspace.id}`);

            // Validate Slack configuration
            if (!workspace.bot_token) {
                throw new Error('Missing required Slack configuration for this workspace');
            }
            return this.slackService;

        } else if (workspace.service_type === 'mattermost') {
            console.log(`Using Mattermost adapter for workspace ${workspace.id}`);

            // Validate Mattermost configuration
            if (!workspace.server_url || !workspace.service_token) {
                throw new Error('Missing required Mattermost configuration for this workspace');
            }

            // Initialize with the current workspace's data from the database
            await this.mattermostService.initialize(
                workspace.server_url,
                undefined,
                undefined,
                workspace.service_token,
                workspace.service_team_id,
                workspace.bot_token
            );

            try {
                await this.mattermostService.getMe();
            } catch (authError) {
                // If the token is expired and we have a bot token, try using that
                if (authError.status_code === 401 && workspace.bot_token) {
                    console.log('Admin token expired, switching to bot token');
                    this.mattermostService.setToken(workspace.bot_token);
                }
            }

            // Register bot user ID if available
            if (workspace.service_slack_account_id) {
                console.log(`Registering existing bot user ID: ${workspace.service_slack_account_id}`);
                this.mattermostService.registerBotUserId(workspace.service_slack_account_id);
            }
            // If we have a bot token but no user ID, try to fetch and register it
            else if (workspace.bot_token) {
                try {
                    console.log('Bot token available but no user ID. Fetching bot user ID...');
                    const originalToken = this.mattermostService.getToken();

                    // Temporarily use the bot token
                    this.mattermostService.setToken(workspace.bot_token);

                    // Get the bot's user ID
                    const me = await this.mattermostService.getMe();
                    if (me && me.id) {
                        console.log(`Discovered bot user ID: ${me.id}`);
                        this.mattermostService.registerBotUserId(me.id);
                    }

                    // Restore original token
                    if (originalToken) {
                        this.mattermostService.setToken(originalToken);
                    }
                } catch (error) {
                    console.error('Failed to fetch bot user ID:', error);
                }
            }

            return this.mattermostService;
        } else {
            throw new Error(`Unsupported chat service type: ${workspace.service_type}`);
        }
    }
}