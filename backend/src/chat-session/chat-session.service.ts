import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ChatSession } from './chat-session.entity';
import { WorkspaceService } from '../workspace/workspace.service';
import { SlackService } from '../slack/slack.service';

@Injectable()
export class ChatSessionService {
    constructor(
        private workspaceService: WorkspaceService,
        private slackService: SlackService,
        @InjectRepository(ChatSession)
        private chatSessionRepository: Repository<ChatSession>
    ) { }

    async startChat(workspaceId: string, userId: number): Promise<ChatSession> {
        // Verify the workspace exists and belongs to the user
        const workspace = await this.workspaceService.findById(workspaceId);
        if (!workspace || workspace.owner_id !== userId) {
            throw new Error('Invalid workspace or not authorized');
        }

        // Create a new chat session
        const sessionId = uuidv4();
        const newSession = this.chatSessionRepository.create({
            session_id: sessionId,
            workspace_id: workspaceId,
            status: 'active',
        });

        await this.chatSessionRepository.save(newSession);

        // If Slack is configured, notify the channel
        if (workspace.bot_token_slack && workspace.selected_channel_id) {
            try {
                // Join the channel first before posting messages
                await this.slackService.joinChannel(
                    workspace.bot_token_slack,
                    workspace.selected_channel_id
                );

                // Then post the notification
                await this.slackService.postMessage(
                    workspace.bot_token_slack,
                    workspace.selected_channel_id,
                    `:wave: New chat session started! Session ID: ${sessionId}`
                );
            } catch (error) {
                console.error('Error notifying Slack:', error);
                // Continue since we've already created the session
            }
        }

        return newSession;
    }

    async sendMessage(sessionId: string, message: string): Promise<void> {
        // Find the chat session
        const session = await this.chatSessionRepository.findOne({ where: { session_id: sessionId } });
        if (!session) {
            throw new Error('Chat session not found');
        }

        // Get the workspace
        const workspace = await this.workspaceService.findById(session.workspace_id);
        if (!workspace || !workspace.bot_token_slack) {
            throw new Error('Workspace not configured for Slack');
        }

        // If this is the first message, create a new channel for this chat
        if (!session.channel_id) {
            try {
                // Create a unique channel name based on session ID
                const channelName = `chat-${sessionId.substring(0, 8)}`;

                // Create a new channel in Slack
                const channelId = await this.slackService.createChannel(
                    workspace.bot_token_slack,
                    channelName
                );

                // Update the chat session with the new channel ID
                session.channel_id = channelId;
                await this.chatSessionRepository.save(session);

                // Post welcome message to the new channel
                await this.slackService.postMessage(
                    workspace.bot_token_slack,
                    channelId,
                    `:wave: New chat session started. Visitor messages will appear here.`
                );

                // Post notification to the announcement channel that a dedicated channel was created
                if (workspace.selected_channel_id) {
                    await this.slackService.postMessage(
                        workspace.bot_token_slack,
                        workspace.selected_channel_id,
                        `:speech_balloon: Chat session ${sessionId} is now active in <#${channelId}>`
                    );
                }
            } catch (error) {
                console.error('Error creating Slack channel:', error);
                throw new Error('Failed to create chat channel');
            }
        }

        // Post the message to the session's channel
        await this.slackService.postMessage(
            workspace.bot_token_slack,
            session.channel_id,
            `:speech_balloon: Visitor: ${message}`
        );
    }

    async findSessionByChannelId(channelId: string): Promise<ChatSession | null> {
        return this.chatSessionRepository.findOne({ where: { channel_id: channelId } });
    }
}