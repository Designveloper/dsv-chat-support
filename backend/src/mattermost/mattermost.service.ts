import { Injectable } from '@nestjs/common';
import { Client4, WebSocketClient } from '@mattermost/client';
import { ConfigService } from '@nestjs/config';
import { Server } from 'socket.io';
import { ChatServiceAdapter } from '../adapters/chat-service.adapter';

@Injectable()
export class MattermostService implements ChatServiceAdapter {
    private client: Client4;
    private wsClient: WebSocketClient | null = null;
    private server: Server | null = null;
    private messageHandler: Function | null = null;


    constructor(private configService: ConfigService) {
        this.client = new Client4();
    }

    async initialize(serverUrl: string, username?: string, password?: string, token?: string, teamId?: string, botToken?: string): Promise<void> {
        if (!serverUrl) {
            throw new Error('Server URL is required for Mattermost initialization');
        }

        // Clean up the server URL by removing trailing slashes
        const cleanServerUrl = serverUrl.replace(/\/+$/, '');

        // Make sure URL doesn't already include /api/v4
        const baseUrl = cleanServerUrl.includes('/api/v4')
            ? cleanServerUrl.split('/api/v4')[0]
            : cleanServerUrl;

        console.log(`Setting Mattermost base URL to: ${baseUrl}`);
        this.client.setUrl(baseUrl);

        // Set token if provided (main authentication method)
        if (token) {
            this.client.setToken(token);
            console.log('Client initialized with provided token');

            // Re-initialize WebSocket when we have valid credentials
            console.log('Reconnecting WebSocket with new credentials');
            this.setupWebSocketConnection();

            return;
        }

        // Otherwise try to authenticate with username/password
        if (username && password) {
            const success = await this.authenticate(username, password);
            if (!success) {
                console.error('Failed to authenticate with provided credentials');
            } else {
                // Re-initialize WebSocket after successful authentication
                console.log('Reconnecting WebSocket after authentication');
                this.setupWebSocketConnection();
            }
        }
    }

    private setupWebSocketConnection(): void {
        // Only proceed if we have a messageHandler set up
        if (!this.messageHandler) {
            console.log('No message handler registered yet, skipping WebSocket setup');
            return;
        }

        if (this.wsClient) {
            console.log('Closing existing WebSocket connection before creating a new one');
            try {
                this.wsClient.close();
            } catch (e) {
                console.error('Error closing existing WebSocket:', e);
            }
            this.wsClient = null;
        }

        this.wsClient = new WebSocketClient();

        try {
            // Get the WebSocket URL directly from the Client4 instance
            const wsUrl = this.client.getWebSocketUrl();
            const token = this.client.getToken();

            console.log(`Re-initializing Mattermost WebSocket with URL: ${wsUrl} and token: ${token ? 'Present' : 'Missing'}`);

            if (!wsUrl || !token) {
                console.error('Missing WebSocket URL or token, cannot initialize WebSocket client');
                return;
            }

            // Initialize WebSocket connection
            this.wsClient.initialize(wsUrl, token);

            console.log('Mattermost WebSocket client initialized with current credentials');

            // Set up event listeners for connection status
            this.wsClient.addFirstConnectListener(() => {
                console.log('Mattermost WebSocket connected successfully');
            });

            this.wsClient.addReconnectListener(() => {
                console.log('Mattermost WebSocket reconnected');
            });

            this.wsClient.addErrorListener((err) => {
                console.error('Mattermost WebSocket error:', err);
                // Try to reconnect after error
                setTimeout(() => this.setupWebSocketConnection(), 5000);
            });

            this.wsClient.addCloseListener(() => {
                console.log('Mattermost WebSocket connection closed');
                // Try to reconnect after close
                setTimeout(() => this.setupWebSocketConnection(), 5000);
            });

            // Listen for new posts
            this.wsClient.addMessageListener(event => {
                console.log('🚀 Received Mattermost WebSocket event:', event.event);

                if (event && event.data && event.event === 'posted') {
                    try {
                        const post = JSON.parse(event.data.post);

                        // Debug the received post
                        console.log('🚀 Received post from Mattermost:', {
                            channel_id: post.channel_id,
                            user_id: post.user_id,
                            message: post.message
                        });

                        // Ignore messages from the bot itself
                        if (post.user_id === this.client.userId) {
                            console.log('Ignoring message from self');
                            return;
                        }

                        // Forward the message to the handler
                        if (this.messageHandler) {
                            console.log('Calling message handler with post data');
                            this.messageHandler({
                                channel: post.channel_id,
                                text: post.message,
                                user: post.user_id
                            });
                        } else {
                            console.error('Message handler is not available');
                        }
                    } catch (error) {
                        console.error('Error processing Mattermost message:', error);
                    }
                }
            });
        } catch (error) {
            console.error('Error setting up Mattermost WebSocket:', error);
        }
    }

    async fetchTeamId(token?: string): Promise<string | null> {
        try {
            // If token is provided, temporarily set it for this operation
            const originalToken = token ? this.setTemporaryToken(token) : null;

            console.log('Fetching teams to get team ID...');
            const teamsResult = await this.client.getTeams();
            let teamsArray: any[] = [];

            if (Array.isArray(teamsResult)) {
                teamsArray = teamsResult;
            } else if (teamsResult && Array.isArray(teamsResult.teams)) {
                teamsArray = teamsResult.teams;
            }

            console.log(`Found ${teamsArray.length} teams`);

            // Restore original token if needed
            if (originalToken) {
                this.client.setToken(originalToken);
            }

            if (teamsArray.length > 0) {
                const teamId = teamsArray[0].id;
                console.log(`Selected team ID: ${teamId}`);
                return teamId;
            } else {
                console.warn('No teams found, may need to create one');
                return null;
            }
        } catch (error) {
            console.error('Error fetching team ID:', error);
            return null;
        }
    }

    private setTemporaryToken(token: string): string | null {
        const originalToken = this.client.getToken();
        this.client.setToken(token);
        return originalToken;
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

            const teamId = team.id;
            console.log(`Created team with ID: ${teamId}`);
            return teamId;
        } catch (error) {
            console.error('Error creating team:', error);
            throw error;
        }
    }

    async createChannel(channelName: string, teamId?: string): Promise<string> {
        try {
            // Make sure we have a team ID
            let effectiveTeamId = teamId;
            if (!effectiveTeamId) {
                // Try to fetch a team ID
                const fetchedTeamId = await this.fetchTeamId();
                if (fetchedTeamId !== null) {
                    effectiveTeamId = fetchedTeamId;
                }

                // If we still don't have a team ID, create one
                if (!effectiveTeamId) {
                    effectiveTeamId = await this.createTeam('chat-support', 'Chat Support');
                    if (!effectiveTeamId) {
                        throw new Error('Unable to get or create a team');
                    }
                }
            }

            console.log(`Using team ID for channel creation: ${effectiveTeamId}`);

            // Create a public channel in the team
            const channel = await this.client.createChannel({
                team_id: effectiveTeamId,
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

    async authenticate(username: string, password: string): Promise<boolean> {
        try {
            await this.client.login(username, password);
            return true;
        } catch (error) {
            console.error('Mattermost authentication error:', error);
            return false;
        }
    }

    async listChannels(teamId?: string): Promise<any[]> {
        try {
            let effectiveTeamId = teamId;
            if (!effectiveTeamId) {
                // If no teamId provided, try to get one from the system
                const teamsResult = await this.client.getTeams();
                let teamsArray: any[] = [];

                if (Array.isArray(teamsResult)) {
                    teamsArray = teamsResult;
                } else if (teamsResult && Array.isArray(teamsResult.teams)) {
                    teamsArray = teamsResult.teams;
                }
                console.log("🚀 ~ MattermostService ~ listChannels ~ teamsArray:", teamsArray);

                if (teamsArray.length > 0) {
                    effectiveTeamId = teamsArray[0].id;
                } else {
                    throw new Error('No teams found');
                }
            }

            if (!effectiveTeamId) {
                throw new Error('Team ID is undefined when trying to list channels');
            }
            const channels = await this.client.getMyChannels(effectiveTeamId);
            console.log("🚀 ~ MattermostService ~ listChannels ~ channels:", channels);

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
            const me = await this.client.getMe();
            const userId = me.id;

            console.log(`Attempting to join channel ${channelId} with user ID: ${userId}`);

            await this.client.addToChannel(userId, channelId);

            console.log(`Successfully joined channel: ${channelId}`);
        } catch (error) {
            // Check if error is because we're already in the channel
            if (error.status_code === 403) {
                console.log(`User is already in channel: ${channelId}`);
                return;
            }
            console.error('Error joining Mattermost channel:', error);

            console.warn('Continuing with message sending despite channel join failure');
        }
    }

    async sendMessage(channelId: string, text: string, botToken?: string): Promise<void> {
        try {
            const post = {
                channel_id: channelId,
                message: text,
            };

            if (botToken) {
                const originalToken = this.client.getToken();
                this.client.setToken(botToken);

                try {
                    await this.client.createPost(post);
                } finally {
                    // Restore the original token
                    if (originalToken) {
                        this.client.setToken(originalToken);
                    }
                }
            } else {
                // Fall back to regular token if no bot token
                await this.client.createPost(post);
            }
        } catch (error) {
            console.error('Error sending message to Mattermost channel:', error);
            throw new Error('Failed to send message to Mattermost channel');
        }
    }

    setupMessageListener(server: Server, sessionMapping: Map<string, string[]>, messageHandler: Function): void {
        console.log('Registering Mattermost message handler...');
        this.server = server;
        this.messageHandler = messageHandler;

        // Try to initialize WebSocket if we already have credentials
        if (this.client.getUrl() && this.client.getToken()) {
            console.log('We have existing credentials, setting up WebSocket connection');
            this.setupWebSocketConnection();
        } else {
            console.log('No credentials available yet, WebSocket will be set up when initialized');
        }
    }

    getToken(): string {
        return this.client.getToken();
    }

    getWebSocketUrl(): string | null {
        try {
            return this.client.getWebSocketUrl();
        } catch (error) {
            console.error('Error getting WebSocket URL:', error);
            return null;
        }
    }

    async disconnect(): Promise<void> {
        if (this.wsClient) {
            console.log('Closing Mattermost WebSocket connection');
            this.wsClient.close();
            this.wsClient = null;
        }
    }
}