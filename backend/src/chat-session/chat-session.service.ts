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
import { MattermostService } from 'src/mattermost/mattermost.service';

@Injectable()
export class ChatSessionService {
    constructor(
        private workspaceService: WorkspaceService,
        @Inject(forwardRef(() => MattermostService))
        private mattermostService: MattermostService,
        @Inject(forwardRef(() => SlackService))
        private slackService: SlackService,
        @Inject(forwardRef(() => SlackBoltService))
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

        // Check for required bot token
        if (workspace.service_type === 'slack' && !workspace.bot_token) {
            throw new Error('Workspace has no bot token configured');
        }

        // Get the appropriate chat service adapter
        const chatService: ChatServiceAdapter = await this.chatServiceFactory.getChatServiceAdapter(workspace);

        // If this is the first message, create a new channel for this chat
        if (!session.channel_id) {
            try {
                // For Mattermost, we need a team ID
                if (workspace.service_type === 'mattermost' && !workspace.service_team_id) {
                    throw new Error('No team selected for this Mattermost workspace');
                }

                console.log(`Creating new channel for chat session:`, sessionId);

                // Create a unique channel name based on user email or session ID
                const channelName = effectiveUserInfo?.email
                    ? `chat-${effectiveUserInfo.email.split('@')[0]}-${sessionId.substring(0, 8)}`
                    : `chat-${sessionId.substring(0, 8)}`;

                // Create the channel using the adapter
                const channelId = await chatService.createChannel(channelName, workspace.bot_token || undefined, workspace.service_team_id);
                console.log('New channel created:', channelId);

                // Update the chat session with the new channel ID
                session.channel_id = channelId;
                await this.chatSessionRepository.save(session);

                // Get additional context information
                const referer = request?.headers['referer'] || 'Unknown Page';
                const location = 'Ho Chi Minh City, Vietnam';
                const vietnamTime = new Date(new Date().getTime() + (7 * 60 * 60 * 1000));
                const localTime = format(vietnamTime, 'hh:mm a');

                // Generate welcome message using the adapter's formatting method
                const welcomeMessage = chatService.formatWelcomeMessage(
                    sessionId,
                    message,
                    effectiveUserInfo,
                    referer,
                    location,
                    localTime,
                    channelId
                );

                await chatService.sendMessage(
                    channelId,
                    welcomeMessage,
                    workspace.bot_token
                );

                // Post notification to the admin-selected channel if it exists
                if (workspace.selected_channel_id) {
                    // Generate notification message using the adapter's formatting method
                    const notificationMessage = chatService.formatNotificationMessage(
                        channelName,
                        sessionId,
                        message,
                        effectiveUserInfo,
                        referer,
                        location,
                        localTime,
                        channelId
                    );

                    // Send the notification message
                    await chatService.sendMessage(
                        workspace.selected_channel_id,
                        notificationMessage,
                        workspace.bot_token
                    );
                }
            } catch (error) {
                console.error(`Error creating channel:`, error);
                throw new Error('Failed to create chat channel');
            }
        } else {
            console.log(`Using existing channel for chat session:`, session.channel_id);
        }

        try {
            const location = 'Ho Chi Minh City, Vietnam';
            let username = effectiveUserInfo?.email || location;

            await chatService.joinChannel(session.channel_id, workspace.bot_token);

            await chatService.sendMessage(
                session.channel_id,
                message,
                workspace.bot_token,
                username
            );

            await this.noResponseTracker.trackUserMessage(sessionId, true);
        } catch (error) {
            console.error(`Error sending message to channel:`, error);
            throw new Error(`Failed to send message to channel`);
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
                    workspace.bot_token
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

            // Get the workspace to determine the service type
            const workspace = await this.workspaceService.findById(workspaceId);
            if (!workspace) {
                console.error(`Workspace ${workspaceId} not found`);
                return false;
            }

            // Use the adapter pattern to get the appropriate service
            try {
                const chatService: ChatServiceAdapter = await this.chatServiceFactory.getChatServiceAdapter(workspace);

                // Use the adapter's isWorkspaceOnline method
                if (chatService.isWorkspaceOnline) {
                    const isOnline = await chatService.isWorkspaceOnline(workspaceId);
                    console.log(`${workspace.service_type} workspace ${workspaceId} online status: ${isOnline}`);
                    return isOnline;
                } else {
                    console.log(`${workspace.service_type} adapter does not implement isWorkspaceOnline, returning false`);
                    return false;
                }
            } catch (error) {
                console.error(`Error getting adapter for workspace ${workspaceId}:`, error);
                return false;
            }
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
        if (!workspace || !workspace.bot_token || !workspace.selected_channel_id) {
            throw new Error(`Workspace not fully configured for ${workspace?.service_type || 'unknown service'}`);
        }

        // Get appropriate chat service adapter based on workspace type
        const chatService: ChatServiceAdapter = await this.chatServiceFactory.getChatServiceAdapter(workspace);

        // Get additional context information
        const referer = request?.headers['referer'] || 'Unknown Page';
        const location = 'Ho Chi Minh City, Vietnam';
        const vietnamTime = new Date(new Date().getTime() + (7 * 60 * 60 * 1000));
        const localTime = format(vietnamTime, 'hh:mm a');

        // Format the offline message using the adapter
        const offlineMessage = chatService.formatOfflineMessage(
            sessionId,
            message,
            email,
            name,
            referer,
            location,
            localTime
        );

        try {
            // Send the message using the adapter's sendMessage method
            await chatService.sendMessage(
                workspace.selected_channel_id,
                offlineMessage,
                workspace.bot_token
            );
        } catch (error) {
            console.error(`Error sending offline message to ${workspace.service_type}:`, error);
            throw new Error(`Failed to send offline message to ${workspace.service_type}`);
        }
    }

    async trackStaffMessage(sessionId: string): Promise<void> {
        await this.noResponseTracker.trackUserMessage(sessionId, false);
    }
}