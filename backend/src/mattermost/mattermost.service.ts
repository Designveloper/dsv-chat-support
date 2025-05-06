import { Injectable } from '@nestjs/common';
import { Client4 } from '@mattermost/client';
import { ConfigService } from '@nestjs/config';
import { Server } from 'socket.io';
import { ChatServiceAdapter } from '../adapters/chat-service.adapter';
import { WebSocketClient } from '@mattermost/client';

@Injectable()
export class MattermostService implements ChatServiceAdapter {
    private client: Client4;
    private wsClient: WebSocketClient;
    private token: string;
    private teamId: string;

    constructor(private configService: ConfigService) {
        this.client = new Client4();
    }

    async initialize(serverUrl: string, username: string, password: string, teamId?: string): Promise<void> {
        this.client.setUrl(serverUrl);
        this.teamId = teamId ?? '';
        await this.authenticate(username, password);
        this.setupWebSocket(serverUrl);
    }

    async authenticate(username?: string, password?: string): Promise<boolean> {
        try {
            if (!username || !password) {
                return false;
            }

            // Login with username and password
            await this.client.login(username, password);
            this.token = this.client.getToken();
            this.client.setToken(this.token);

            return true;
        } catch (error) {
            console.error('Mattermost authentication error:', error);
            return false;
        }
    }

    private setupWebSocket(serverUrl: string): void {
        // Create a WebSocket client for real-time events
        const wsUrl = serverUrl.replace(/^http/, 'ws');
        this.wsClient = new WebSocketClient();

        this.wsClient.initialize(wsUrl, this.token);
    }

    async listChannels(): Promise<any[]> {
        try {
            if (!this.teamId) {
                const teamsResult = await this.client.getTeams();
                let teamsArray: any[] = [];

                if (Array.isArray(teamsResult)) {
                    teamsArray = teamsResult;
                } else if (teamsResult && Array.isArray(teamsResult.teams)) {
                    teamsArray = teamsResult.teams;
                }

                if (teamsArray.length > 0) {
                    this.teamId = teamsArray[0].id;
                } else {
                    throw new Error('No teams found');
                }
            }

            const channels = await this.client.getMyChannels(this.teamId);

            return channels.map(channel => ({
                id: channel.id,
                name: channel.display_name || channel.name,
                is_member: true, // If we retrieved it via getChannelsForTeamForUser, user is a member
                num_members: channel.total_msg_count || 0
            }));
        } catch (error) {
            console.error('Error listing Mattermost channels:', error);
            return [];
        }
    }

    async joinChannel(channelId: string): Promise<void> {
        try {
            await this.client.addToChannel('me', channelId);
            console.log(`Successfully joined channel: ${channelId}`);
        } catch (error) {
            // Check if error is because we're already in the channel
            if (error.status_code === 403) {
                console.log(`User is already in channel: ${channelId}`);
                return;
            }
            console.error('Error joining Mattermost channel:', error);
        }
    }

    async sendMessage(channelId: string, text: string, username?: string): Promise<void> {
        try {
            const post = {
                channel_id: channelId,
                message: text,
            };
            await this.client.createPost(post);
        } catch (error) {
            console.error('Error sending message to Mattermost channel:', error);
            throw new Error('Failed to send message to Mattermost channel');
        }
    }

    async createChannel(channelName: string): Promise<string> {
        try {
            // Create a public channel in the team
            const channel = await this.client.createChannel({
                team_id: this.teamId,
                name: channelName.toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
                display_name: channelName,
                type: 'O', // O = public channel
            });

            console.log(`Created Mattermost channel: ${channelName} with id: ${channel.id}`);
            return channel.id;
        } catch (error) {
            console.error('Error creating Mattermost channel:', error);
            throw error;
        }
    }

    setupMessageListener(server: Server, sessionMapping: Map<string, string[]>, messageHandler: Function): void {
        if (!this.wsClient) {
            console.error('WebSocket client not initialized');
            return;
        }

        // Listen for new posts
        this.wsClient.addMessageListener(event => {
            if (event && event.data && event.event === 'posted') {
                try {
                    const post = JSON.parse(event.data.post);

                    // Ignore messages from the bot itself
                    if (post.user_id === this.client.userId) {
                        return;
                    }

                    messageHandler({
                        channel: post.channel_id,
                        text: post.message,
                        user: post.user_id
                    });
                } catch (error) {
                    console.error('Error processing Mattermost message:', error);
                }
            }
        });
    }

    async disconnect(): Promise<void> {
        if (this.wsClient) {
            this.wsClient.close();
        }
    }
}