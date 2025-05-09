import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Client4, WebSocketClient } from '@mattermost/client';
import { ConfigService } from '@nestjs/config';
import { Server } from 'socket.io';
import { ChatServiceAdapter } from '../adapters/chat-service.adapter';
import { WorkspaceService } from 'src/workspace/workspace.service';
import { WorkSpace } from 'src/workspace/workspace.entity';
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class MattermostService implements ChatServiceAdapter {
    private client: Client4;
    private wsClient: WebSocketClient | null = null;
    private server: Server | null = null;
    private messageHandler: Function | null = null;
    private botUserIds: Set<string> = new Set();

    constructor(
        @Inject(forwardRef(() => WorkspaceService))
        private workspaceService: WorkspaceService
    ) {
        this.client = new Client4();
    }

    async initialize(serverUrl: string, username?: string, password?: string, token?: string): Promise<void> {
        if (!serverUrl) {
            throw new Error('Server URL is required for Mattermost initialization');
        }

        // Clean up the server URL
        const cleanServerUrl = serverUrl.replace(/\/+$/, '');

        const baseUrl = cleanServerUrl.includes('/api/v4')
            ? cleanServerUrl.split('/api/v4')[0]
            : cleanServerUrl;

        console.log(`Setting Mattermost base URL to: ${baseUrl}`);
        this.client.setUrl(baseUrl);

        // Set token if provided
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
                            message: post.message,
                            type: post.type
                        });

                        // Check if the message is from a known bot user ID
                        if (this.botUserIds.has(post.user_id)) {
                            console.log(`Ignoring message from known bot user: ${post.user_id}`);
                            return;
                        }

                        // Also ignore messages from the client itself
                        if (post.user_id === this.client.userId) {
                            console.log('Ignoring message from self');
                            return;
                        }

                        // Ignore system messages
                        if (
                            post.message.includes('added to the channel') ||
                            post.message.includes('joined the channel') ||
                            post.message.includes('left the channel')
                        ) {
                            console.log('Ignoring system message:', post.message);
                            return;
                        }

                        // Forward the message to the handler - must be from a staff member
                        if (this.messageHandler) {
                            console.log('Calling message handler with staff post data');
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

    async connectWorkspace(userId: number, serverUrl: string, username: string, password: string, workspaceName?: string): Promise<{ workspace: any; success: boolean; message: string }> {
        try {
            // Initialize client with the server URL
            await this.initialize(serverUrl, username, password);

            // Authenticate with the provided credentials
            const isAuthenticated = await this.authenticate(username, password);
            if (!isAuthenticated) {
                return { workspace: null, success: false, message: 'Authentication failed' };
            }

            // Get token from the current client session
            const token = this.getToken();

            // Create a new workspace ID
            const workspaceId = uuidv4();
            const name = workspaceName || "Default Workspace";

            // Get or create the entity type for the workspace
            const entityType = await this.workspaceService.getOrCreateEntityType('workspace', 'Default workspace entity type');

            // Create the workspace entry
            const workspace = await this.workspaceService.create(
                userId,
                name,
                'mattermost',
                entityType.type_id,
            );

            // Save the Mattermost details to the workspace
            await this.workspaceService.updateMattermostDetails(
                workspace.id,
                serverUrl,
                username,
                password,
                token,
            );

            return {
                workspace,
                success: true,
                message: 'Connected to Mattermost successfully'
            };
        }
        catch (error) {
            console.error('Error connecting to Mattermost:', error);
            return { workspace: null, success: false, message: 'Connection failed: ' + error.message };
        }
    }

    async connectBotToWorkspace(workspaceId: string, botToken: string): Promise<{ success: boolean; message: string }> {
        try {
            const workspace = await this.workspaceService.findById(workspaceId);
            if (!workspace) {
                return { success: false, message: 'Workspace not found' };
            }

            // Update the bot token in the workspace record
            await this.workspaceService.updateMattermostBotToken(workspaceId, botToken);

            try {
                console.log('Registering bot user ID with new bot token');
                const originalToken = this.getToken();

                // Set the new bot token temporarily
                this.setToken(botToken);

                // Get the bot's user ID
                const me = await this.getMe();
                if (me && me.id) {
                    console.log(`Discovered and registering bot user ID: ${me.id}`);
                    this.registerBotUserId(me.id);
                }

                if (originalToken && originalToken !== botToken) {
                    this.setToken(originalToken);
                }
            } catch (error) {
                console.error('Failed to register bot user ID, but continuing:', error);
            }

            return {
                success: true,
                message: 'Bot connected and registered successfully'
            };
        } catch (error) {
            console.error('Error connecting bot:', error);
            return { success: false, message: 'Failed to connect bot: ' + error.message };
        }
    }

    async getTeamsForWorkspace(workspaceId: string): Promise<{ teams?: any[]; success: boolean; message: string }> {
        try {
            // Get the workspace details from the database
            const workspace = await this.workspaceService.findById(workspaceId);

            if (!workspace) {
                return { success: false, message: 'Workspace not found' };
            }

            if (!workspace.service_token) {
                return { success: false, message: 'No token found for this workspace' };
            }

            // Initialize Mattermost client with workspace credentials from DB
            await this.initialize(
                workspace.server_url,
                undefined,
                undefined,
                workspace.service_token
            );

            // Get teams
            const teams = await this.listTeams();
            return { teams, success: true, message: 'Teams fetched successfully' };
        } catch (error) {
            console.error('Error fetching Mattermost teams:', error);
            return { success: false, message: 'Failed to fetch teams: ' + error.message };
        }
    }

    async selectTeamForWorkspace(workspaceId: string, teamId: string): Promise<{ success: boolean; message: string }> {
        try {
            // Verify workspace exists
            const workspace = await this.workspaceService.findById(workspaceId);
            if (!workspace) {
                return { success: false, message: 'Workspace not found' };
            }

            // Update the selected team in the workspace record
            await this.workspaceService.updateMattermostTeam(workspaceId, teamId);

            return { success: true, message: 'Team selected successfully' };
        } catch (error) {
            console.error('Error selecting Mattermost team:', error);
            return { success: false, message: 'Failed to select team: ' + error.message };
        }
    }

    async getChannelsForWorkspace(workspaceId: string): Promise<{ channels?: any[]; success: boolean; message: string }> {
        try {
            // Get the workspace details from the database
            const workspace = await this.workspaceService.findById(workspaceId);

            if (!workspace) {
                return { success: false, message: 'Workspace not found' };
            }

            if (!workspace.service_token) {
                return { success: false, message: 'No token found for this workspace' };
            }

            if (!workspace.service_team_id) {
                return { success: false, message: 'No team selected for this workspace' };
            }

            // Initialize Mattermost client with workspace credentials from DB
            await this.initialize(
                workspace.server_url,
                undefined,
                undefined,
                workspace.service_token
            );

            // Get channels using the team ID from the workspace
            const channels = await this.listChannels(workspace.service_team_id);
            return { channels, success: true, message: 'Channels fetched successfully' };
        } catch (error) {
            console.error('Error fetching Mattermost channels:', error);
            return { success: false, message: 'Failed to fetch channels: ' + error.message };
        }
    }

    async selectChannelForWorkspace(workspaceId: string, channelId: string): Promise<{ success: boolean; message: string }> {
        try {
            // Verify workspace exists
            const workspace = await this.workspaceService.findById(workspaceId);
            if (!workspace) {
                return { success: false, message: 'Workspace not found' };
            }

            // Update the selected channel in the workspace record
            await this.workspaceService.updateMattermostChannel(workspaceId, channelId);

            return { success: true, message: 'Channel selected successfully' };
        } catch (error) {
            console.error('Error selecting Mattermost channel:', error);
            return { success: false, message: 'Failed to select channel: ' + error.message };
        }
    }

    async listTeams(): Promise<any[]> {
        try {
            console.log('Fetching teams from Mattermost...');
            const teamsResult = await this.client.getTeams();
            let teamsArray: any[] = [];

            if (Array.isArray(teamsResult)) {
                teamsArray = teamsResult;
            } else if (teamsResult && Array.isArray(teamsResult.teams)) {
                teamsArray = teamsResult.teams;
            }

            console.log(`Found ${teamsArray.length} teams`);

            // Map the teams to a consistent format
            return teamsArray.map(team => ({
                id: team.id,
                name: team.display_name || team.name,
                description: team.description || '',
                type: team.type
            }));
        } catch (error) {
            console.error('Error listing Mattermost teams:', error);
            return [];
        }
    }

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

    async createChannel(channelName: string, botToken?: string, teamId?: string): Promise<string> {
        try {
            if (!teamId) {
                throw new Error('Team ID is required to create a channel in Mattermost');
            }

            console.log(`Creating Mattermost channel: ${channelName} in team ${teamId}`);

            // Create a public channel in the team
            const channel = await this.client.createChannel({
                team_id: teamId,
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

    async listChannels(teamId: string): Promise<any[]> {
        try {
            if (!teamId) {
                throw new Error('Team ID is required to list channels in Mattermost');
            }

            console.log(`Listing channels for team: ${teamId}`);
            const channels = await this.client.getMyChannels(teamId);
            console.log(`Found ${channels.length} channels in team ${teamId}`);

            return channels.map(channel => ({
                id: channel.id,
                name: channel.display_name || channel.name,
                is_member: true,
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

    async sendMessage(channelId: string, text: string | any[], botToken?: string, username?: string): Promise<void> {
        try {
            const post: any = {
                channel_id: channelId,
                message: text as string,
            };

            // If username is provided, add it to the props
            console.log("🚀 ~ MattermostService ~ sendMessage ~ username:", username)
            if (username) {
                post.props = {
                    from_webhook: 'true',
                    override_username: username,
                };
                console.log("🚀 ~ MattermostService ~ sendMessage ~ post.props:", post.props)
            }

            if (botToken) {
                const originalToken = this.client.getToken();
                this.client.setToken(botToken);

                try {
                    await this.client.createPost(post);
                } finally {
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

    formatWelcomeMessage(
        sessionId: string,
        message: string,
        userInfo: { email?: string, userId?: string } | undefined,
        referer: string,
        location: string,
        localTime: string,
        channelId: string  // Add channelId parameter (though not used in the markdown formatting)
    ): string {
        return `### :speech_balloon: New chat session started\n\n` +
            `**User Email:** ${userInfo?.email || 'Anonymous'}\n` +
            `${userInfo?.userId ? `**Name:** ${userInfo.userId}\n` : ''}` +
            `**Status:** Active\n` +
            `**Session ID:** ${sessionId}\n\n` +
            `**First Message:** ${message}\n` +
            `**Location:** :flag-VN: ${location}\n` +
            `**Local Time:** ${localTime}\n` +
            `**Current Page:** ${referer}\n\n` +
            `---\n`;
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
    ): string {
        // Create a Mattermost notification with a link to the new channel
        const channelLink = `~${channelName}`; // Mattermost uses ~ for channel links

        return `### :bell: New Chat Session\n\n` +
            `**User:** ${userInfo?.email || 'Anonymous'}\n` +
            `${userInfo?.userId ? `**Name:** ${userInfo.userId}\n` : ''}` +
            `**Status:** Active\n` +
            `**Click to join:** ${channelLink}\n\n` +
            `**First Message:** ${message}\n` +
            `**Location:** :flag-VN: ${location}\n` +
            `**Local Time:** ${localTime}\n\n` +
            `---\n`;
    }

    formatOfflineMessage(
        sessionId: string,
        message: string,
        email: string,
        name: string | undefined,
        referer: string,
        location: string,
        localTime: string
    ): string {
        return `### :email: Live-chat offline message\n\n` +
            `**Offline message from:** ${email}\n\n` +
            `---\n\n` +
            `**Message:**\n` +
            `> ${message.split('\n').join('\n> ')}\n\n` +
            `---\n\n` +
            `**Email:** ${email}\n` +
            `**Name:** ${name || 'Not provided'}\n\n` +
            `**Location:** :flag-VN: ${location}\n` +
            `**Local Time:** ${localTime}\n\n` +
            `**Current Page:** ${referer}\n` +
            `**Session ID:** ${sessionId}\n\n` +
            `---\n`;
    }

    registerBotUserId(userId: string): void {
        if (userId) {
            console.log(`Registering bot user ID: ${userId}`);
            this.botUserIds.add(userId);
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

    setToken(token: string): void {
        if (token) {
            this.client.setToken(token);
        }
    }

    async getMe(): Promise<any> {
        try {
            return await this.client.getMe();
        } catch (error) {
            console.error('Error getting user info:', error);
            return null;
        }
    }

    async isWorkspaceOnline(workspaceId: string): Promise<boolean> {
        try {
            // Get the workspace by ID
            const workspace = await this.workspaceService.findById(workspaceId);
            if (!workspace || !workspace.selected_channel_id) {
                console.log(`Workspace ${workspaceId} not found or channel not selected`);
                return false;
            }

            // Initialize the Mattermost client with workspace credentials
            await this.initialize(
                workspace.server_url,
                undefined,
                undefined,
                workspace.service_token,
            );

            try {
                await this.joinChannel(workspace.selected_channel_id);
            } catch (joinError) {
                console.log(`Error joining channel: ${joinError.message}`);
            }

            // Get channel members
            console.log(`Getting members for channel ${workspace.selected_channel_id}`);
            const channelMembers = await this.client.getChannelMembers(workspace.selected_channel_id);

            if (!channelMembers || !channelMembers.length) {
                console.log('No members found in channel');
                return false;
            }

            // Get bot and system user IDs to filter them out
            const botUserIds = this.botUserIds;
            const currentClientUserId = this.client.userId;

            // Check presence status for each member
            for (const member of channelMembers) {
                const userId = member.user_id;

                // Skip known bot users
                if (botUserIds.has(userId)) {
                    console.log(`Skipping bot user: ${userId}`);
                    continue;
                }

                // Skip the client's own user ID
                if (userId === currentClientUserId) {
                    console.log(`Skipping current client user: ${userId}`);
                    continue;
                }

                console.log(`Checking presence for staff user ${userId}`)
                try {
                    // Get additional user info to check if this is a bot account
                    const userInfo = await this.client.getUser(userId);
                    if (userInfo && (userInfo.is_bot || userInfo.roles.includes('system_admin') && userInfo.username.includes('bot'))) {
                        console.log(`Skipping system bot user: ${userId}`);
                        continue;
                    }

                    // Get user status
                    const userStatus = await this.client.getStatus(userId);
                    console.log(`Staff user ${userId} has status: ${userStatus.status}`);

                    // Consider "online" or "away" as active
                    if (userStatus.status === 'online' || userStatus.status === 'away') {
                        return true;
                    }
                } catch (statusError) {
                    console.error(`Error checking status for user ${userId}:`, statusError);
                }
            }

            return false;
        } catch (error) {
            console.error('Error checking Mattermost workspace online status:', error);
            return false; // Default to offline on error
        }
    }
}