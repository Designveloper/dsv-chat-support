import { Injectable, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App, ExpressReceiver } from '@slack/bolt';
import { WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ChatSessionService } from '../chat-session/chat-session.service';
import { INestApplication } from '@nestjs/common';

@Injectable()
export class SlackBoltService implements OnModuleInit {
    private boltApp: App;
    private receiver: ExpressReceiver;
    private sessionToSocketMap = new Map<string, string[]>();

    @WebSocketServer() server: Server;

    constructor(
        private configService: ConfigService,
        @Inject(forwardRef(() => ChatSessionService))
        private chatSessionService: ChatSessionService,
    ) {
        // Create an Express receiver
        this.receiver = new ExpressReceiver({
            signingSecret: this.configService.get<string>('SLACK_SIGNING_SECRET') || (() => { throw new Error('SLACK_SIGNING_SECRET is not defined'); })(),
            // The path is where Slack will send events
            endpoints: {
                events: '/slack/events',
                interactive: '/slack/interactive',
                commands: '/slack/commands',
            }
        });

        // Initialize Bolt with the receiver
        this.boltApp = new App({
            token: this.configService.get('SLACK_BOT_TOKEN'),
            receiver: this.receiver,
        });
    }

    // Method to integrate with NestJS app
    attachToNestApp(app: INestApplication): void {
        // Get the underlying Express app from NestJS
        const expressApp = app.getHttpAdapter().getInstance();

        // Use the receiver's router as middleware
        expressApp.use(this.receiver.router);
    }

    registerSocketServer(server: Server) {
        this.server = server;
    }

    // Register a client socket with a session
    registerSessionSocket(sessionId: string, socketId: string) {
        if (!this.sessionToSocketMap.has(sessionId)) {
            this.sessionToSocketMap.set(sessionId, []);
        }

        const socketIds = this.sessionToSocketMap.get(sessionId) ?? [];
        if (!socketIds.includes(socketId)) {
            socketIds.push(socketId);
            this.sessionToSocketMap.set(sessionId, socketIds);
        }
    }

    // Remove a socket from a session
    removeSessionSocket(sessionId: string, socketId: string) {
        if (this.sessionToSocketMap.has(sessionId)) {
            const socketIds = this.sessionToSocketMap.get(sessionId);
            if (socketIds) {
                const index = socketIds.indexOf(socketId);
                if (index !== -1) {
                    socketIds.splice(index, 1);
                    this.sessionToSocketMap.set(sessionId, socketIds);
                }
            }
        }
    }

    async onModuleInit() {
        // Set up message event listener
        await this.setupMessageListener();

        // No need to call start() since the receiver is attached to NestJS
        console.log('⚡️ Slack Bolt integration initialized!');
    }

    private async setupMessageListener() {
        // Listen for message events in channels
        this.boltApp.message(async ({ message, say }) => {
            try {
                // Only process messages from humans (not bot messages)
                if (message.subtype === 'bot_message' || ('bot_id' in message && message.bot_id)) {
                    return;
                }

                // Ignore join channel messages
                if (message.subtype === 'channel_join') {
                    return;
                }

                console.log('Received message:', message);

                // Extract channel ID and find associated chat session
                const channelId = message.channel;
                const session = await this.chatSessionService.findSessionByChannelId(channelId);

                if (session) {
                    // Forward the message to the client via WebSocket
                    const socketIds = this.sessionToSocketMap.get(session.session_id);
                    if (socketIds && socketIds.length > 0) {
                        socketIds.forEach(socketId => {
                            this.server?.to(socketId).emit('staff_message', {
                                text: 'text' in message ? message.text : 'Unsupported message type',
                                user: 'user' in message ? message.user : 'unknown'
                            });
                        });
                    } else {
                        console.log(`No connected clients for session ${session.session_id}`);
                    }
                } else {
                    console.log(`No session found for channel ${channelId}`);
                }
            } catch (error) {
                console.error('Error processing Slack message:', error);
            }
        });

        // Listen for reaction events to provide additional functionality
        this.boltApp.event('reaction_added', async ({ event, client }) => {
            try {
                // Get the message that was reacted to
                const { item } = event;
                if (item.type === 'message') {
                    const channelId = item.channel;
                    const session = await this.chatSessionService.findSessionByChannelId(channelId);

                    if (session && event.reaction === 'white_check_mark') {
                        // Example: Send acknowledgment when someone reacts with a checkmark
                        const socketIds = this.sessionToSocketMap.get(session.session_id);
                        if (socketIds && socketIds.length > 0) {
                            socketIds.forEach(socketId => {
                                this.server?.to(socketId).emit('staff_message', {
                                    text: 'Your request has been marked as resolved. Is there anything else we can help with?',
                                    user: 'system'
                                });
                            });
                        }
                    }
                }
            } catch (error) {
                console.error('Error processing reaction:', error);
            }
        });

        // Listen for app_mention events
        this.boltApp.event('app_mention', async ({ event, say }) => {
            try {
                const channelId = event.channel;
                const session = await this.chatSessionService.findSessionByChannelId(channelId);

                if (session) {
                    // Respond in the channel
                    await say({
                        text: `I'm tracking this conversation for chat session ${session.session_id}`,
                        thread_ts: event.ts
                    });
                }
            } catch (error) {
                console.error('Error processing app mention:', error);
            }
        });
    }
}