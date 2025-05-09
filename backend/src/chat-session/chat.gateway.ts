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

@WebSocketGateway({
    cors: {
        origin: ['http://localhost:5173', 'https://chat-support-7j2g.onrender.com'],
        credentials: true,
    },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private clientToSessionMap = new Map<string, string>();

    constructor(
        private chatSessionService: ChatSessionService,
        @Inject(forwardRef(() => SlackBoltService))
        private slackBoltService: SlackBoltService,
    ) { }

    afterInit(server: Server): void {
        this.slackBoltService.registerSocketServer(server);
    }

    async handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
        const sessionId = client.handshake.query.sessionId as string;
        const session = await this.chatSessionService.findSessionByChannelId(sessionId); // Adjust based on your method
        if (session) {
            console.log(`Client ${client.id} is connected to session ${session.session_id}`);
            const isOnline = await this.chatSessionService.isWorkspaceOnline(session.workspace_id);
            client.emit('status', { isOnline });
            // Register socket with SlackBoltService
            this.slackBoltService.registerSessionSocket(session.session_id, client.id);
        }
    }

    handleDisconnect(client: Socket): void {
        console.log(`Client disconnected: ${client.id}`);

        // Clean up when client disconnects
        const sessionId = this.clientToSessionMap.get(client.id);
        if (sessionId) {
            this.slackBoltService.removeSessionSocket(sessionId, client.id);
            this.clientToSessionMap.delete(client.id);
        }
    }

    @SubscribeMessage('register_session')
    handleRegisterSession(client: Socket, payload: { sessionId: string }): void {
        console.log(`Registering client ${client.id} for session ${payload.sessionId}`);
        this.slackBoltService.registerSessionSocket(payload.sessionId, client.id);
        this.clientToSessionMap.set(client.id, payload.sessionId);
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
}