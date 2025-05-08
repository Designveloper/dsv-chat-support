import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebClient } from '@slack/web-api';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { WorkspaceService } from '../workspace/workspace.service';
import { EavService } from 'src/eav/eav.service';
import { ModuleRef } from '@nestjs/core';
import { SlackBoltService } from './slack-bolt.service';

@Injectable()
export class SlackService {
    private slackClient: WebClient;

    constructor(
        private configService: ConfigService,
        private httpService: HttpService,
        private workspaceService: WorkspaceService,
        private eavService: EavService,
        private moduleRef: ModuleRef
    ) {
        this.slackClient = new WebClient();
    }

    generateAuthUrl(userId: number) {
        const clientId = this.configService.get('SLACK_CLIENT_ID');
        const redirectUri = this.configService.get('SLACK_REDIRECT_URI');
        const scopes = 'channels:manage,channels:history,commands,channels:read,channels:join,chat:write,chat:write.customize,users:read,users:read.email,users:write';

        const state = `user-${userId}-${Date.now()}`;
        const url = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${redirectUri}&state=${state}`;

        console.log("Generated Slack URL:", url);
        return { url };
    }

    private extractUserIdFromState(state: string): number {
        const stateMatch = state.match(/user-(\d+)-/);
        if (!stateMatch) {
            throw new BadRequestException('Invalid state parameter');
        }
        return parseInt(stateMatch[1], 10);
    }

    async exchangeCodeForToken(code: string, redirectUri: string): Promise<any> {
        const clientId = this.configService.get('SLACK_CLIENT_ID');
        const clientSecret = this.configService.get('SLACK_CLIENT_SECRET');
        const response = await firstValueFrom(
            this.httpService.post('https://slack.com/api/oauth.v2.access', null, {
                params: {
                    code,
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uri: redirectUri,
                },
            }),
        );
        return response.data;
    }

    async handleOAuthRedirect(code: string, state: string) {
        const redirectUri = this.configService.get('SLACK_REDIRECT_URI');
        console.log('Slack OAuth redirect:', code, state);

        try {
            // Extract user ID from state
            const userId = this.extractUserIdFromState(state);
            const data = await this.exchangeCodeForToken(code, redirectUri);
            console.log('Slack OAuth response:', data);

            if (data.ok) {
                const botToken = data.access_token;
                const slackWorkspaceId = data.team.id;

                console.log('==DEBUG== About to call getOrCreateEntityType');
                console.log('==DEBUG== EavService instance exists:', !!this.eavService);

                let entityType;
                try {
                    entityType = await this.eavService.getOrCreateEntityType(
                        'workspace',
                        'Default workspace entity type'
                    );
                    console.log("🚀 ~ SlackService ~ handleOAuthRedirect ~ entityType:", entityType);
                } catch (err) {
                    console.error('==DEBUG== Error calling getOrCreateEntityType:', err);
                    throw err;
                }

                const workspace = await this.workspaceService.create(
                    userId,
                    `${data.team.name} Workspace`,
                    'slack',
                    entityType.type_id
                );

                // Save initial Slack details without channel
                await this.workspaceService.updateSlackDetails(
                    workspace.id,
                    botToken,
                    '',
                );

                // Redirect to channel selection page
                const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:5173');
                return {
                    redirectUrl: `${frontendUrl}/slack/select-channel?workspaceId=${workspace.id}`
                };
            } else {
                throw new Error(data.error || 'Authentication failed');
            }
        } catch (error) {
            console.error('Slack OAuth error:', error);
            const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:5173');
            return {
                redirectUrl: `${frontendUrl}/dashboard?error=slack_connection_failed`
            };
        }
    }

    async listChannels(botToken: string): Promise<any[]> {
        const web = new WebClient(botToken);

        // Get public channels that the bot is in or can join
        const result = await web.conversations.list({
            exclude_archived: true,
            types: 'public_channel'
        });

        if (!result.ok) {
            throw new Error(result.error || 'Unknown error listing channels');
        }

        if (!result.channels) {
            throw new Error('Failed to list channels: channels are undefined.');
        }

        return result.channels.map(channel => ({
            id: channel.id,
            name: channel.name,
            is_member: channel.is_member,
            num_members: channel.num_members
        }));
    }

    async getWorkspaceChannels(workspaceId: string) {
        try {
            const workspace = await this.workspaceService.findById(workspaceId);

            if (!workspace) {
                throw new NotFoundException('Workspace not found');
            }

            if (!workspace.bot_token) {
                throw new BadRequestException('Slack not connected to this workspace');
            }

            const channels = await this.listChannels(workspace.bot_token);
            return { channels };
        } catch (error) {
            console.error('Error fetching channels:', error);
            throw new BadRequestException('Failed to fetch Slack channels');
        }
    }

    async selectChannel(userId: number, workspaceId: string, channelId: string) {
        try {
            // Verify the user owns this workspace
            const workspaces = await this.workspaceService.findByOwnerId(userId);
            const authorized = workspaces.some(w => w.id === workspaceId);

            if (!authorized) {
                throw new UnauthorizedException('Not authorized to update this workspace');
            }

            // Get current workspace details
            const workspace = await this.workspaceService.findById(workspaceId);

            // Update just the channel ID
            await this.workspaceService.updateSlackDetails(
                workspaceId,
                workspace.bot_token,
                channelId,
            );

            return { success: true };
        } catch (error) {
            console.error('Error selecting channel:', error);
            throw new BadRequestException('Failed to select Slack channel');
        }
    }

    async createChannel(channelName: string, botToken: string, teamId?: string): Promise<string> {
        const web = new WebClient(botToken);
        try {
            console.log(`Creating channel: ${channelName}`);
            const result = await web.conversations.create({ name: channelName });

            if (!result.channel || !result.channel.id) {
                throw new Error('Channel creation failed: channel or ID is undefined.');
            }

            const channelId = result.channel.id;

            // Explicitly join the newly created channel
            console.log(`Joining newly created channel: ${channelId}`);
            await this.joinChannel(botToken, channelId);

            return channelId;
        } catch (error) {
            console.error('Error creating Slack channel:', error);
            throw error;
        }
    }

    async postMessage(botToken: string, channelId: string, text: string, username?: string): Promise<void> {
        const web = new WebClient(botToken);
        const messageOptions: any = {
            channel: channelId,
            text,
        };

        if (username) {
            messageOptions.username = username;
        }

        await web.chat.postMessage(messageOptions);
    }

    async joinChannel(botToken: string, channelId: string): Promise<void> {
        if (!channelId) {
            console.error('Cannot join channel: Invalid channel ID');
            return;
        }

        try {
            console.log(`Bot attempting to join channel: ${channelId}`);
            const web = new WebClient(botToken);
            const response = await web.conversations.join({ channel: channelId });

            if (!response.ok) {
                console.error(`Failed to join channel: ${response.error}`);
            } else {
                console.log(`Successfully joined channel: ${channelId}`);
            }
        } catch (error) {
            // Check if error is because we're already in the channel
            if (error.data?.error === 'already_in_channel') {
                console.log(`Bot is already in channel: ${channelId}`);
                return;
            }
            console.error('Error joining Slack channel:', error);
        }
    }

    async postBlockKitMessage(token: string, channelId: string, blocks: any[]): Promise<void> {
        try {
            // Ensure we're in the channel first
            await this.joinChannel(token, channelId);

            const web = new WebClient(token);
            const result = await web.chat.postMessage({
                token: token,
                channel: channelId,
                blocks: blocks,
                text: "New chat session started" // Fallback text for notifications
            });

            if (!result.ok) {
                throw new Error(`Failed to send message: ${result.error}`);
            }
        } catch (error) {
            console.error('Error posting Block Kit message to Slack:', error);
            throw new Error('Failed to send message to Slack');
        }
    }

    // Replace your current sendMessage method with this one
    async sendMessage(channelId: string, text: string | any[], botToken?: string, username?: string): Promise<void> {
        console.log("🚀 ~ SlackService ~ sendMessage ~ channelId:", channelId);
        try {
            // Determine which token to use
            const token = botToken || this.configService.get('SLACK_BOT_TOKEN');

            if (!token) {
                throw new Error('No bot token provided for Slack message');
            }

            // Case 1: text is already an array (Block Kit message)
            if (Array.isArray(text)) {
                console.log("Message is already a Block Kit array, sending directly");
                await this.postBlockKitMessage(token, channelId, text);
                return;
            }

            // Case 2: text is a string that might be JSON
            if (typeof text === 'string') {
                try {
                    const parsedBlocks = JSON.parse(text);
                    if (Array.isArray(parsedBlocks)) {
                        console.log("Parsed blocks are an array, sending as Block Kit message");
                        await this.postBlockKitMessage(token, channelId, parsedBlocks);
                        return;
                    }
                } catch (e) {
                    // Not a JSON string, just continue with regular message
                    console.log("Not a JSON string, sending as regular message");
                }
            }

            // Make sure bot has joined the channel before posting
            await this.joinChannel(token, channelId);

            // Post regular text message
            await this.postMessage(token, channelId, text as string, username);
        } catch (error) {
            console.error('Error in SlackService.sendMessage:', error);
            throw new Error('Failed to send message to Slack channel');
        }
    }

    formatWelcomeMessage(
        sessionId: string,
        message: string,
        userInfo: { email?: string, userId?: string } | undefined,
        referer: string,
        location: string,
        localTime: string,
        channelId: string  // Add channelId parameter
    ): any[] {
        // Create the user info section
        const userFields: { type: string; text: string }[] = [];

        // Add user email if available
        if (userInfo?.email) {
            userFields.push({
                "type": "mrkdwn",
                "text": "*User Email:*\n" + userInfo.email
            });
        } else {
            userFields.push({
                "type": "mrkdwn",
                "text": "*Session ID:*\n" + sessionId
            });
        }

        if (userInfo?.userId) {
            userFields.push({
                "type": "mrkdwn",
                "text": "*Name:*\n" + userInfo.userId
            });
        }

        return [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "New chat session started",
                    "emoji": true
                }
            },
            {
                "type": "section",
                "fields": userFields
            },
            {
                "type": "divider"
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": "*STATUS:*\nActive"
                    },
                    {
                        "type": "mrkdwn",
                        "text": "*Channel:*\n<#" + channelId + ">"
                    }
                ]
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": "*First Message:*\n" + message
                    },
                    {
                        "type": "mrkdwn",
                        "text": "*Location:*\n:flag-VN: " + location
                    }
                ]
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": "*Local Time:*\n" + localTime
                    },
                    {
                        "type": "mrkdwn",
                        "text": "*Current Page:*\n" + referer
                    }
                ]
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": "*Session ID:*\n" + sessionId
                    }
                ]
            },
            {
                "type": "divider"
            },
        ];
    }

    formatNotificationMessage(
        channelName: string,
        sessionId: string,
        message: string,
        userInfo: { email?: string, userId?: string } | undefined,
        referer: string,
        location: string,
        localTime: string,
        channelId: string  // Add channelId parameter
    ): any[] {
        // Create the user info section
        const userFields: { type: string; text: string }[] = [];

        // Add user email if available
        if (userInfo?.email) {
            userFields.push({
                "type": "mrkdwn",
                "text": "*User Email:*\n" + userInfo.email
            });
        } else {
            userFields.push({
                "type": "mrkdwn",
                "text": "*Session ID:*\n" + sessionId
            });
        }

        if (userInfo?.userId) {
            userFields.push({
                "type": "mrkdwn",
                "text": "*Name:*\n" + userInfo.userId
            });
        }

        return [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": `New message in ${channelName}`,
                    "emoji": true
                }
            },
            {
                "type": "section",
                "fields": userFields
            },
            {
                "type": "divider"
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": "*STATUS:*\nActive"
                    },
                    {
                        "type": "mrkdwn",
                        "text": "*Channel:*\n<#" + channelId + "> "
                    }
                ]
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": "*Message:*\n" + message
                    },
                    {
                        "type": "mrkdwn",
                        "text": "*Location:*\n:flag-VN:  *" + location + "*"
                    }
                ]
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": "*Local Time:*\n" + localTime
                    },
                    {
                        "type": "mrkdwn",
                        "text": "*Current Page:*\n" + referer
                    }
                ]
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": "*Session ID:*\n" + sessionId
                    }
                ]
            },
            {
                "type": "divider"
            },
        ];
    }

    // Add this method to the SlackService class
    formatOfflineMessage(
        sessionId: string,
        message: string,
        email: string,
        name: string | undefined,
        referer: string,
        location: string,
        localTime: string
    ): any[] {
        return [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "Live-chat offline message",
                    "emoji": true
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `:email: *Offline message from ${email}*`
                }
            },
            {
                "type": "divider"
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": ":memo: *Message:*"
                    }
                ]
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `>${message.split('\n').join('\n>')}`
                }
            },
            {
                "type": "divider"
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": `*Email:* ${email}`
                    },
                    {
                        "type": "mrkdwn",
                        "text": name ? `*Name:* ${name}` : "*Name:* Not provided"
                    }
                ]
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": `*Location:* :flag-VN: ${location}`
                    },
                    {
                        "type": "mrkdwn",
                        "text": `*Local Time:* ${localTime}`
                    }
                ]
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": `*Current Page:* ${referer}`
                    },
                    {
                        "type": "mrkdwn",
                        "text": `*Session ID:* ${sessionId}`
                    }
                ]
            },
            {
                "type": "divider"
            }
        ];
    }

    async isWorkspaceOnline(workspaceId: string): Promise<boolean> {
        try {
            const slackBoltService = await this.moduleRef.get(SlackBoltService, { strict: false });

            if (slackBoltService && slackBoltService.isWorkspaceOnline) {
                // Delegate to the bolt service implementation
                return await slackBoltService.isWorkspaceOnline(workspaceId);
            }

            console.log(`Unable to check Slack workspace ${workspaceId} status, returning true as default`);
            return true;
        } catch (error) {
            console.error('Error checking Slack workspace online status:', error);
            return true; // Default to online for Slack if there's an error
        }
    }
}