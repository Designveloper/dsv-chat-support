import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatSessionService } from './chat-session.service';
import { SlackBoltService } from '../slack/slack-bolt.service';
import { Inject, forwardRef } from '@nestjs/common';
import { ChatServiceFactory } from '../adapters/chat-service.factory';
import { MattermostService } from '../mattermost/mattermost.service';

@WebSocketGateway({
    cors: {
        origin: ['http://localhost:5173', 'https://chat-support-7j2g.onrender.com'],
        credentials: true,
    },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private clientToSessionMap = new Map<string, string>();
    private sessionToMattermostClient = new Map<string, { workspaceId: string }>();

    constructor(
        private chatSessionService: ChatSessionService,
        @Inject(forwardRef(() => SlackBoltService))
        private slackBoltService: SlackBoltService,
        @Inject(forwardRef(() => ChatServiceFactory))
        private chatServiceFactory: ChatServiceFactory,
        @Inject(forwardRef(() => MattermostService))
        private mattermostService: MattermostService,
    ) { }

    afterInit(server: Server): void {
        this.slackBoltService.registerSocketServer(server);

        // Set up the Mattermost message listener
        this.mattermostService.setupMessageListener(
            server,
            this.slackBoltService.getSessionToSocketMap(),
            this.handleMattermostMessage.bind(this)
        );
    }

    async handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
        const sessionId = client.handshake.query.sessionId as string;
        const session = await this.chatSessionService.findSessionBySessionId(sessionId);

        if (session) {
            console.log(`Client ${client.id} is connected to session ${session.session_id}`);
            const isOnline = await this.chatSessionService.isWorkspaceOnline(session.workspace_id);
            client.emit('status', { isOnline });

            // Register socket with appropriate service based on workspace type
            const workspace = await this.chatSessionService.findWorkspaceById(session.workspace_id);
            if (workspace) {
                if (workspace.service_type === 'mattermost') {
                    console.log(`Setting up Mattermost for workspace ${workspace.id}`);
                    // Store session mapping for Mattermost
                    this.sessionToMattermostClient.set(session.session_id, {
                        workspaceId: workspace.id
                    });

                    // Initialize Mattermost client if needed
                    if (workspace.server_url && workspace.service_token) {
                        try {
                            await this.mattermostService.initialize(
                                workspace.server_url,
                                undefined,
                                undefined,
                                workspace.service_token,
                                workspace.service_team_id
                            );
                            console.log('Mattermost client initialized for workspace');

                            // Store the client connection to support Mattermost messages
                            this.slackBoltService.registerSessionSocket(session.session_id, client.id);
                        } catch (error) {
                            console.error('Error initializing Mattermost client:', error);
                        }
                    } else {
                        console.warn('Missing Mattermost credentials in workspace');
                    }
                } else {
                    // Default to slack
                    this.slackBoltService.registerSessionSocket(session.session_id, client.id);
                }
            }

            // Store client to session mapping in all cases
            this.clientToSessionMap.set(client.id, session.session_id);
        }
    }

    handleDisconnect(client: Socket): void {
        console.log(`Client disconnected: ${client.id}`);

        // Clean up when client disconnects
        const sessionId = this.clientToSessionMap.get(client.id);
        if (sessionId) {
            // Remove from appropriate service mapping
            this.slackBoltService.removeSessionSocket(sessionId, client.id);
            this.clientToSessionMap.delete(client.id);
        }
    }

    @SubscribeMessage('register_session')
    handleRegisterSession(client: Socket, payload: { sessionId: string }): void {
        console.log(`Registering client ${client.id} for session ${payload.sessionId}`);

        // Store session mapping
        this.clientToSessionMap.set(client.id, payload.sessionId);

        // Register with slack service for both Slack and Mattermost messaging
        this.slackBoltService.registerSessionSocket(payload.sessionId, client.id);
    }

    // Handler for Mattermost messages
    private async handleMattermostMessage(messageData: { channel: string, text: string, user: string }): Promise<void> {
        try {
            console.log('Processing Mattermost message:', messageData);

            // Find session with this channel ID
            const session = await this.chatSessionService.findSessionByChannelId(messageData.channel);
            if (!session) {
                console.log(`No session found for Mattermost channel ${messageData.channel}`);
                return;
            }

            console.log(`Found session ${session.session_id} for channel ${messageData.channel}`);

            // Get client IDs from SlackBoltService (which also stores Mattermost socket mappings)
            const clientIds = this.slackBoltService.getSocketsForSession(session.session_id);

            if (clientIds && clientIds.length > 0) {
                console.log(`Found ${clientIds.length} clients for session ${session.session_id}`);

                // Forward message to all connected clients
                clientIds.forEach(socketId => {
                    console.log(`Emitting staff_message to client ${socketId}`);
                    this.server.to(socketId).emit('staff_message', {
                        text: messageData.text
                    });
                });

                console.log(`Forwarded Mattermost message to ${clientIds.length} clients`);

                // Track staff response for analytics
                await this.chatSessionService.trackStaffMessage(session.session_id);
            } else {
                console.log(`No connected clients for session ${session.session_id}`);
            }
        } catch (error) {
            console.error('Error handling Mattermost message:', error);
        }
    }

    @SubscribeMessage('send_message')
    async handleMessage(client: Socket, payload: { sessionId: string; message: string; userInfo?: { email: string }; currentPage?: string }): Promise<void> {
        try {
            const mockRequest = {
                headers: {
                    'referer': payload.currentPage,
                }
            };

            await this.chatSessionService.sendMessage(payload.sessionId, payload.message, mockRequest as any, payload.userInfo);
        } catch (error) {
            console.error('Error sending message:', error);
            client.emit('error', { message: 'Failed to send message' });
        }
    }

    @SubscribeMessage('end_session')
    async handleEndSession(client: Socket, payload: { sessionId: string }): Promise<void> {
        try {
            await this.chatSessionService.endChatSession(payload.sessionId);
        } catch (error) {
            console.error('Error ending session:', error);
            client.emit('error', { message: 'Failed to end session' });
        }
    }

    @SubscribeMessage('check_status')
    async handleCheckStatus(client: Socket, payload: { workspaceId: string }): Promise<{ isOnline: boolean }> {
        try {
            const { workspaceId } = payload;
            console.log(`Client ${client.id} checking status for workspace ${workspaceId}`);

            // Check the workspace online status
            const isOnline = await this.chatSessionService.isWorkspaceOnline(workspaceId);
            console.log(`Returning status for workspace ${workspaceId}: ${isOnline}`);

            // Return value is automatically sent as acknowledgement
            return { isOnline };

        } catch (error) {
            console.error('Error checking workspace status:', error);
            // Return offline status in case of error
            return { isOnline: false };
        }
    }

    async handleDebugMattermost(): Promise<any> {
        try {
            const wsUrl = this.mattermostService.getWebSocketUrl();
            return {
                success: true,
                wsUrl,
                sessionMappings: Array.from(this.sessionToMattermostClient.entries()).map(([key, value]) => ({
                    sessionId: key,
                    workspaceId: value.workspaceId
                }))
            };
        } catch (error) {
            console.error('Error in debug:', error);
            return { success: false, error: error.message };
        }
    }
}