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
    private botToken: string;

    constructor(private configService: ConfigService) {
        this.client = new Client4();
    }

    async initialize(serverUrl: string, username?: string, password?: string, token?: string, teamId?: string, botToken?: string): Promise<void> {
        // Clean up the server URL by removing trailing slashes
        const cleanServerUrl = serverUrl.replace(/\/+$/, '');

        // Make sure URL doesn't already include /api/v4
        const baseUrl = cleanServerUrl.includes('/api/v4')
            ? cleanServerUrl.split('/api/v4')[0]
            : cleanServerUrl;

        console.log(`Setting Mattermost base URL to: ${baseUrl}`);
        this.client.setUrl(baseUrl);

        // If teamId is provided, use it
        if (teamId) {
            this.teamId = teamId;
            console.log(`Using provided team ID: ${teamId}`);
        }

        // Set token if provided
        if (token) {
            this.token = token;
            this.client.setToken(token);

            // If no teamId was provided, try to fetch it now that we have a token
            if (!this.teamId) {
                await this.fetchTeamId();
            }
            return;
        }

        if (botToken) {
            this.botToken = botToken;
        }

        // Otherwise try to authenticate with username/password
        if (username && password) {
            const success = await this.authenticate(username, password);
            if (success && !this.teamId) {
                // Now that we're authenticated, fetch team ID if needed
                await this.fetchTeamId();
            }
        }
    }

    async fetchTeamId(): Promise<string | null> {
        try {
            console.log('Fetching teams to get team ID...');
            const teamsResult = await this.client.getTeams();
            let teamsArray: any[] = [];

            if (Array.isArray(teamsResult)) {
                teamsArray = teamsResult;
            } else if (teamsResult && Array.isArray(teamsResult.teams)) {
                teamsArray = teamsResult.teams;
            }

            console.log(`Found ${teamsArray.length} teams`);

            if (teamsArray.length > 0) {
                this.teamId = teamsArray[0].id;
                console.log(`Selected team ID: ${this.teamId}`);
                return this.teamId;
            } else {
                console.warn('No teams found, may need to create one');
                return null;
            }
        } catch (error) {
            console.error('Error fetching team ID:', error);
            return null;
        }
    }

    // Add method to create a team if needed
    async createTeam(name: string, displayName: string): Promise<string> {
        try {
            console.log(`Creating team: ${displayName}`);
            const team = await this.client.createTeam({
                name: name.toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
                display_name: displayName,
                type: 'O' // Open team
            } as any);

            this.teamId = team.id;
            console.log(`Created team with ID: ${this.teamId}`);
            return this.teamId;
        } catch (error) {
            console.error('Error creating team:', error);
            throw error;
        }
    }

    // Update createChannel to ensure there's a team ID
    async createChannel(channelName: string): Promise<string> {
        try {
            // Make sure we have a team ID
            if (!this.teamId) {
                await this.fetchTeamId();

                // If we still don't have a team ID, create one
                if (!this.teamId) {
                    await this.createTeam('chat-support', 'Chat Support');
                    if (!this.teamId) {
                        throw new Error('Unable to get or create a team');
                    }
                }
            }

            console.log(`Using team ID for channel creation: ${this.teamId}`);
            console.log('Authorization token:', this.token ? `${this.token.substring(0, 5)}...` : 'MISSING');

            // Create a public channel in the team
            const channel = await this.client.createChannel({
                team_id: this.teamId,
                name: channelName.toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
                display_name: channelName,
                type: 'O', // O = public channel
            } as any);

            console.log(`Created Mattermost channel: ${channelName} with id: ${channel.id}`);
            return channel.id;
        } catch (error) {
            console.error('Error creating Mattermost channel:', error);
            throw error;
        }
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
                console.log("🚀 ~ MattermostService ~ listChannels ~ teamsArray:", teamsArray)

                if (teamsArray.length > 0) {
                    this.teamId = teamsArray[0].id;
                } else {
                    throw new Error('No teams found');
                }
            }

            const channels = await this.client.getMyChannels(this.teamId);
            console.log("🚀 ~ MattermostService ~ listChannels ~ channels:", channels)

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
            // First, get the current user ID
            const me = await this.client.getMe();
            const userId = me.id;

            console.log(`Attempting to join channel ${channelId} with user ID: ${userId}`);

            // Now add the user to the channel with the proper user ID
            await this.client.addToChannel(userId, channelId);

            console.log(`Successfully joined channel: ${channelId}`);
        } catch (error) {
            // Check if error is because we're already in the channel
            if (error.status_code === 403) {
                console.log(`User is already in channel: ${channelId}`);
                return;
            }
            console.error('Error joining Mattermost channel:', error);

            // Rethrow with better context but don't block the message flow
            // This allows messages to be sent even if join fails
            console.warn('Continuing with message sending despite channel join failure');
        }
    }

    async sendMessage(channelId: string, text: string, username?: string): Promise<void> {
        try {
            const post = {
                channel_id: channelId,
                message: text,
            };

            console.log("🚀 ~ MattermostService ~ sendMessage ~ this.botToken:", this.botToken)
            if (this.botToken) {
                // Use bot token for sending messages
                const originalToken = this.token;
                this.client.setToken(this.botToken);

                try {
                    await this.client.createPost(post);
                } finally {
                    // Restore the original token
                    this.client.setToken(originalToken);
                }
            } else {
                // Fall back to admin token if no bot token
                await this.client.createPost(post);
            }
        } catch (error) {
            console.error('Error sending message to Mattermost channel:', error);
            throw new Error('Failed to send message to Mattermost channel');
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

    getToken(): string {
        return this.token;
    }

    async disconnect(): Promise<void> {
        if (this.wsClient) {
            this.wsClient.close();
        }
    }
}