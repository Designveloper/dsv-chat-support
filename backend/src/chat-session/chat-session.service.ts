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
            channel_id: workspace.selected_channel_id,
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
}