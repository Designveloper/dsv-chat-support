import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ChatSession } from './chat-session.entity';
import { WorkspaceService } from '../workspace/workspace.service';
import { SlackService } from '../slack/slack.service';
import { Request } from 'express';
import { format } from 'date-fns';

@Injectable()
export class ChatSessionService {
    constructor(
        private workspaceService: WorkspaceService,
        private slackService: SlackService,
        @InjectRepository(ChatSession)
        private chatSessionRepository: Repository<ChatSession>
    ) { }

    async startChat(workspaceId: string, userId: number): Promise<ChatSession> {
        // Verify the workspace exists (but don't check ownership for anonymous users)
        const workspace = await this.workspaceService.findById(workspaceId);
        if (!workspace) {
            throw new Error('Invalid workspace');
        }

        // If userId is provided, verify ownership (authenticated users only)
        if (userId !== null && userId !== undefined) {
            // This is an authenticated user - check if they own the workspace
            if (workspace.owner_id !== userId) {
                throw new Error('Not authorized to access this workspace');
            }
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

    async sendMessage(sessionId: string, message: string, request?: Request | null, userInfo?: { email: string }): Promise<void> {
        // Find the chat session
        const session = await this.chatSessionRepository.findOne({ where: { session_id: sessionId } });
        if (!session) {
            throw new Error('Chat session not found');
        }

        // Update session with user info if available and not already set
        if (userInfo?.email && !session.user_email) {
            session.user_email = userInfo.email;
            await this.chatSessionRepository.save(session);
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

                const referer = request?.headers['referer'] || 'Unknown Page';
                const location = 'Ho Chi Minh City, Vietnam';
                const localTime = format(new Date(), 'hh:mma (XXX)');

                // Create the user info section
                const userFields: { type: string; text: string }[] = [];

                // Add user email if available
                if (userInfo?.email) {
                    userFields.push({
                        "type": "mrkdwn",
                        "text": "*User Email:*\n" + userInfo.email
                    });
                } else {
                    userFields.push({
                        "type": "mrkdwn",
                        "text": "*Session ID:*\n" + sessionId
                    });
                }

                const welcomeBlocks = [
                    {
                        "type": "header",
                        "text": {
                            "type": "plain_text",
                            "text": "New chat session started",
                            "emoji": true
                        }
                    },
                    {
                        "type": "section",
                        "fields": userFields
                    },
                    {
                        "type": "divider"
                    },
                    {
                        "type": "section",
                        "fields": [
                            {
                                "type": "mrkdwn",
                                "text": "*STATUS:*\nActive"
                            },
                            {
                                "type": "mrkdwn",
                                "text": "*Channel:*\n<#" + channelId + ">"
                            }
                        ]
                    },
                    {
                        "type": "section",
                        "fields": [
                            {
                                "type": "mrkdwn",
                                "text": "*First Message:*\n" + message
                            },
                            {
                                "type": "mrkdwn",
                                "text": "*Location:*\n:flag-VN: " + location
                            }
                        ]
                    },
                    {
                        "type": "section",
                        "fields": [
                            {
                                "type": "mrkdwn",
                                "text": "*Local Time:*\n" + localTime
                            },
                            {
                                "type": "mrkdwn",
                                "text": "*Current Page:*\n" + referer
                            }
                        ]
                    },
                    {
                        "type": "section",
                        "fields": [
                            {
                                "type": "mrkdwn",
                                "text": "*Session ID:*\n" + sessionId
                            }
                        ]
                    },
                    {
                        "type": "divider"
                    },
                    {
                        "type": "actions",
                        "elements": [
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "text": "Close Session",
                                    "emoji": true
                                },
                                "value": `close_session:${sessionId}`,
                                "action_id": "close_session",
                                "style": "danger"
                            },
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "text": "Transfer",
                                    "emoji": true
                                },
                                "value": `transfer_session:${sessionId}`,
                                "action_id": "transfer_session"
                            }
                        ]
                    }
                ];

                await this.slackService.postBlockKitMessage(workspace.bot_token_slack, channelId, welcomeBlocks);

                if (workspace.selected_channel_id) {
                    const userInfoText = userInfo?.email
                        ? `*User:* ${userInfo.email}`
                        : "*Session ID:* " + sessionId;
                    const notificationBlocks = [
                        {
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": ":speech_balloon: *New Chat Session*"
                            }
                        },
                        {
                            "type": "section",
                            "fields": [
                                {
                                    "type": "mrkdwn",
                                    "text": userInfoText
                                }
                            ]
                        },
                        {
                            "type": "divider"
                        },
                        {
                            "type": "section",
                            "fields": [
                                {
                                    "type": "mrkdwn",
                                    "text": "*Status:*\nActive"
                                },
                                {
                                    "type": "mrkdwn",
                                    "text": "*Click channel to join:*\n<#" + channelId + ">"
                                }
                            ]
                        },
                        {
                            "type": "section",
                            "fields": [
                                {
                                    "type": "mrkdwn",
                                    "text": "*First Message:*\n" + message
                                },
                                {
                                    "type": "mrkdwn",
                                    "text": "*Location:*\n:flag-VN: " + location
                                }
                            ]
                        },
                        {
                            "type": "section",
                            "fields": [
                                {
                                    "type": "mrkdwn",
                                    "text": "*Local Time:*\n" + localTime
                                }
                            ]
                        }
                    ];

                    await this.slackService.postBlockKitMessage(workspace.bot_token_slack, workspace.selected_channel_id, notificationBlocks);
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