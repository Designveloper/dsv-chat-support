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
        // if (workspace.bot_token_slack && workspace.selected_channel_id) {
        //     try {
        //         // Join the channel first before posting messages
        //         await this.slackService.joinChannel(
        //             workspace.bot_token_slack,
        //             workspace.selected_channel_id
        //         );

        //         // Then post the notification
        //         await this.slackService.postMessage(
        //             workspace.bot_token_slack,
        //             workspace.selected_channel_id,
        //             `:wave: New chat session started! Session ID: ${sessionId}`
        //         );
        //     } catch (error) {
        //         console.error('Error notifying Slack:', error);
        //         // Continue since we've already created the session
        //     }
        // }

        return newSession;
    }

    async sendMessage(sessionId: string, message: string, request?: Request): Promise<void> {
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

                const userAgent = request?.headers['user-agent'] || 'Unknown Browser';
                const referer = request?.headers['referer'] || 'Unknown Page';

                const location = 'Ho Chi Minh City, Vietnam';
                const localTime = format(new Date(), 'hh:mma (XXX)');

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
                                "text": "*Browser/OS:*\n" + this.parseUserAgent(userAgent)
                            },
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

    private parseUserAgent(userAgent: string): string {
        // This is a simple implementation - consider using a proper UA parser library
        let browser = 'Unknown';
        let os = 'Unknown';

        if (userAgent.includes('Chrome')) {
            browser = 'Chrome';
        } else if (userAgent.includes('Firefox')) {
            browser = 'Firefox';
        } else if (userAgent.includes('Safari')) {
            browser = 'Safari';
        } else if (userAgent.includes('Edge')) {
            browser = 'Edge';
        }

        if (userAgent.includes('Windows')) {
            os = 'Win';
        } else if (userAgent.includes('Mac')) {
            os = 'Mac';
        } else if (userAgent.includes('Linux')) {
            os = 'Linux';
        } else if (userAgent.includes('Android')) {
            os = 'Android';
        } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
            os = 'iOS';
        }

        return `${browser}/${os}`;
    }
}