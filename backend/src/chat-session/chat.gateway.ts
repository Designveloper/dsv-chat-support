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
import { UseGuards, Inject, forwardRef } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@WebSocketGateway({
    cors: {
        origin: ['http://localhost:5173'],
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

    handleConnection(client: Socket): void {
        console.log(`Client connected: ${client.id}`);
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
    async handleMessage(client: Socket, payload: { sessionId: string; message: string }): Promise<void> {
        try {
            await this.chatSessionService.sendMessage(payload.sessionId, payload.message);
        } catch (error) {
            console.error('Error sending message:', error);
            client.emit('error', { message: 'Failed to send message' });
        }
    }
}