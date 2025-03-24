import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession } from './chat-session.entity';
import { WorkSpace } from '../workspace/workspace.entity';
import { SlackService } from '../slack/slack.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ChatSessionService {
    constructor(
        @InjectRepository(ChatSession)
        private chatSessionRepository: Repository<ChatSession>,
        @InjectRepository(WorkSpace)
        private workspaceRepository: Repository<WorkSpace>,
        private slackService: SlackService,
    ) { }

    async startChat(workspaceId: string): Promise<ChatSession> {
        const workspace = await this.workspaceRepository.findOne({ where: { id: workspaceId } });
        if (!workspace || !workspace.bot_token_slack) {
            throw new Error('Workspace not configured for Slack');
        }

        const sessionId = uuidv4();
        const channelName = `z-session-${sessionId.slice(0, 8)}`; // Unique channel name
        const channelId = await this.slackService.createChannel(workspace.bot_token_slack, channelName);

        const session = this.chatSessionRepository.create({
            session_id: sessionId,
            workspace_id: workspaceId,
            channel_id: channelId,
            started_at: new Date(),
            status: 'active',
        });
        await this.chatSessionRepository.save(session);

        if (workspace.selected_channel_id) {
            await this.slackService.postMessage(
                workspace.bot_token_slack,
                workspace.selected_channel_id,
                `New chat session started: #${channelName}`,
            );
        }

        return session;
    }
}