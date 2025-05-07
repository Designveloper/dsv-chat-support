import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ChatSession } from './chat-session.entity';
import { WorkspaceService } from '../workspace/workspace.service';
import { SlackService } from '../slack/slack.service';
import { SlackBoltService } from '../slack/slack-bolt.service';
import { WorkSpace } from '../workspace/workspace.entity';
import { Request } from 'express';
import { format } from 'date-fns';
import { WorkspaceSettingsService, WORKSPACE_SETTINGS } from 'src/eav/workspace-settings.service';
import { NoResponseTrackerService } from './no-response-tracker.service';
import { ChatServiceFactory } from '../adapters/chat-service.factory';
import { ChatServiceAdapter } from '../adapters/chat-service.adapter';

@Injectable()
export class ChatSessionService {
    constructor(
        private workspaceService: WorkspaceService,
        private slackService: SlackService,
        @Inject(forwardRef(() => SlackBoltService)) // Add forwardRef for circular dependency
        private slackBoltService: SlackBoltService,
        @InjectRepository(ChatSession)
        private chatSessionRepository: Repository<ChatSession>,
        private workspaceSettingsService: WorkspaceSettingsService,
        private noResponseTracker: NoResponseTrackerService,
        private chatServiceFactory: ChatServiceFactory,
    ) { }

    async startChat(workspaceId: string): Promise<ChatSession> {
        console.log("🚀 ~ ChatSessionService ~ startChat ~ workspaceId:", workspaceId)
        // Verify the workspace exists
        const workspace = await this.workspaceService.findById(workspaceId);
        if (!workspace) {
            throw new Error('Invalid workspace');
        }

        // Create a new chat session
        const sessionId = uuidv4();
        const newSession = this.chatSessionRepository.create({
            session_id: sessionId,
            workspace_id: workspaceId,
            status: 'active',
        });

        await this.chatSessionRepository.save(newSession);

        return newSession;
    }

    async sendMessage(sessionId: string, message: string, request?: Request | null, userInfo?: { email: string, userId?: string }): Promise<void> {
        // Find the chat session
        const session = await this.chatSessionRepository.findOne({ where: { session_id: sessionId } });
        if (!session) {
            throw new Error('Chat session not found');
        }

        if (userInfo && userInfo.email === '') {
            console.log("Empty email detected - clearing stored identity");
            session.user_email = undefined;
            await this.chatSessionRepository.save(session);
        }

        const effectiveUserInfo = userInfo?.email
            ? userInfo
            : (session.user_email ? { email: session.user_email } : undefined);

        // Update session with user info if available and not already set
        if (effectiveUserInfo?.email && !session.user_email) {
            session.user_email = effectiveUserInfo.email;
            await this.chatSessionRepository.save(session);
        }

        // Get the workspace
        const workspace = await this.workspaceService.findById(session.workspace_id);
        if (!workspace) {
            throw new Error('Workspace not found');
        }

        const chatService: ChatServiceAdapter = await this.chatServiceFactory.getChatServiceAdapter(workspace);

        if (!session.channel_id) {
            try {
                // Create a unique channel name
                const channelName = userInfo?.email
                    ? `chat-${userInfo.email.split('@')[0]}-${sessionId.substring(0, 8)}`
                    : `chat-${sessionId.substring(0, 8)}`;

                // Create channel using the adapter
                const channelId = await chatService.createChannel(channelName);

                // Update session with channel ID
                session.channel_id = channelId;
                await this.chatSessionRepository.save(session);

                // Send through the adapter with bot token
                await chatService.sendMessage(
                    channelId,
                    message,
                    workspace.bot_token_slack // Pass the bot token
                );

                // Send notification if needed
                if (workspace.selected_channel_id) {
                    await chatService.sendMessage(
                        workspace.selected_channel_id,
                        message,
                        workspace.bot_token_slack // Pass the bot token
                    );
                }
            } catch (error) {
                console.error('Error creating chat channel:', error);
                throw new Error('Failed to create chat channel');
            }
        }

        // Send the message
        try {
            // Make sure the service is in the channel
            await chatService.joinChannel(session.channel_id);

            // Use username based on available info
            let username = userInfo?.email;
            if (!username) {
                username = 'Anonymous User';
            }

            // Send the message via the adapter with bot token
            await chatService.sendMessage(
                session.channel_id,
                message,
                workspace.bot_token_slack // Pass the bot token
            );

            await this.noResponseTracker.trackUserMessage(sessionId, true);
        } catch (error) {
            console.error('Error sending message:', error);
            throw new Error('Failed to send message');
        }
    }

    async endChatSession(sessionId: string): Promise<void> {
        // Find the chat session
        const session = await this.chatSessionRepository.findOne({ where: { session_id: sessionId } });
        if (!session) {
            throw new Error('Chat session not found');
        }

        // Update the session status
        session.status = 'closed';
        await this.chatSessionRepository.save(session);

        // Get the workspace
        const workspace = await this.workspaceService.findById(session.workspace_id);
        if (!workspace) {
            throw new Error('Workspace not found');
        }

        try {
            // Get appropriate chat service adapter based on workspace type
            const chatService: ChatServiceAdapter = await this.chatServiceFactory.getChatServiceAdapter(workspace);

            if (session.channel_id) {
                // Use adapter to send end message with bot token
                await chatService.sendMessage(
                    session.channel_id,
                    `Chat session ended`,
                    workspace.bot_token_slack // Pass the bot token to ensure message is sent from the bot account
                );
            }

            console.log(`Chat session ${sessionId} ended successfully`);
            await this.noResponseTracker.trackUserMessage(sessionId, false);
        } catch (error) {
            console.error('Error sending end session message:', error);
            throw new Error('Failed to send end session message');
        }
    }

    async findSessionByChannelId(channelId: string): Promise<ChatSession | null> {
        return this.chatSessionRepository.findOne({ where: { channel_id: channelId } });
    }

    async isWorkspaceOnline(workspaceId: string): Promise<boolean> {
        try {
            console.log(`Checking if workspace ${workspaceId} is online`);

            // Get presence detection setting
            const presenceDetection = await this.workspaceSettingsService.getStringSetting(
                workspaceId,
                WORKSPACE_SETTINGS.PRESENCE_DETECTION,
                'auto' // Default to auto if setting doesn't exist
            );
            console.log("🚀 ~ ChatSessionService ~ isWorkspaceOnline ~ presenceDetection:", presenceDetection)

            if (presenceDetection === 'manual') {
                console.log(`Workspace ${workspaceId} has manual presence detection, returning online`);
                return true;
            }

            const isOnline = await this.slackBoltService.isWorkspaceOnline(workspaceId);
            console.log(`Workspace ${workspaceId} actual online status: ${isOnline}`);
            return isOnline;
        } catch (error) {
            console.error(`Error checking workspace ${workspaceId} online status: ${error.message}`, error.stack);
            return false; // Default to offline if there's an error
        }
    }

    async findWorkspaceById(workspaceId: string): Promise<WorkSpace> {
        return this.workspaceService.findById(workspaceId);
    }

    async findAllWorkspaces(): Promise<WorkSpace[]> {
        return this.workspaceService.findAll();
    }

    async findSessionsByWorkspaceId(workspaceId: string): Promise<ChatSession[]> {
        return this.chatSessionRepository.find({ where: { workspace_id: workspaceId } });
    }

    async findSessionBySessionId(sessionId: string): Promise<ChatSession | null> {
        return this.chatSessionRepository.findOne({ where: { session_id: sessionId } });
    }

    async handleOfflineMessage(
        workspaceId: string,
        email: string,
        message: string,
        name?: string,
        request?: Request | null
    ): Promise<void> {
        // Create a dummy session for this message
        const sessionId = uuidv4();
        const newSession = this.chatSessionRepository.create({
            session_id: sessionId,
            workspace_id: workspaceId,
            status: 'offline',
            user_email: email,
        });

        await this.chatSessionRepository.save(newSession);

        // Get the workspace
        const workspace = await this.workspaceService.findById(workspaceId);
        if (!workspace || !workspace.bot_token_slack || !workspace.selected_channel_id) {
            throw new Error('Workspace not configured for Slack');
        }

        // Get additional context information
        const referer = request?.headers['referer'] || 'Unknown Page';
        const location = 'Ho Chi Minh City, Vietnam';
        const vietnamTime = new Date(new Date().getTime() + (7 * 60 * 60 * 1000));
        const localTime = format(vietnamTime, 'hh:mm a');

        // Build the message blocks for Slack
        const messageBlocks = [
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
            },
        ];

        try {
            // Post to the Slack channel
            await this.slackService.postBlockKitMessage(
                workspace.bot_token_slack,
                workspace.selected_channel_id,
                messageBlocks
            );
        } catch (error) {
            console.error('Error posting Block Kit message to Slack:', error);
            throw new Error('Failed to send message to Slack');
        }
    }

    async trackStaffMessage(sessionId: string): Promise<void> {
        // Forward to no-response tracker with isUserMessage=false to indicate this is a staff response
        await this.noResponseTracker.trackUserMessage(sessionId, false);
    }
}