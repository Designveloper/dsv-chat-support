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
    ) { }

    async startChat(workspaceId: string): Promise<ChatSession> {
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
        if (!workspace || !workspace.bot_token_slack) {
            throw new Error('Workspace not configured for Slack');
        }

        // If this is the first message, create a new channel for this chat
        if (!session.channel_id) {
            try {
                console.log('Creating new Slack channel for chat session:', sessionId);
                // Create a unique channel name based on user email or session ID
                const channelName = userInfo?.email
                    ? `chat-${userInfo.email.split('@')[0]}-${sessionId.substring(0, 8)}`
                    : `chat-${sessionId.substring(0, 8)}`;

                // Create a new channel in Slack
                const channelId = await this.slackService.createChannel(
                    workspace.bot_token_slack,
                    channelName
                );
                console.log('New channel created:', channelId);

                // Update the chat session with the new channel ID
                session.channel_id = channelId;
                await this.chatSessionRepository.save(session);

                const referer = request?.headers['referer'] || 'Unknown Page';
                const location = 'Ho Chi Minh City, Vietnam';
                const vietnamTime = new Date(new Date().getTime() + (7 * 60 * 60 * 1000));
                const localTime = format(vietnamTime, 'hh:mm a');

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

                if (userInfo?.userId) {
                    userFields.push({
                        "type": "mrkdwn",
                        "text": "*Name:*\n" + userInfo.userId
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
                ];

                await this.slackService.postBlockKitMessage(workspace.bot_token_slack, channelId, welcomeBlocks);

                if (workspace.selected_channel_id) {
                    const userInfoText = userInfo?.email
                        ? `*User:* ${userInfo.email}${userInfo.userId ? `\n*Name:* ${userInfo.userId}` : ''}`
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

        try {
            // Make sure bot has joined the channel before posting messages
            await this.slackService.joinChannel(workspace.bot_token_slack, session.channel_id);

            const location = 'Ho Chi Minh City, Vietnam';
            let username = effectiveUserInfo?.email;

            if (!username) {
                username = `${location}`
            }

            // Post the message to the session's channel
            await this.slackService.postMessage(
                workspace.bot_token_slack,
                session.channel_id,
                `${message}`,
                username
            );

            await this.noResponseTracker.trackUserMessage(sessionId, true);
        } catch (error) {
            console.error('Error sending message to Slack channel:', error);
            throw new Error('Failed to send message to Slack channel');
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
        if (!workspace || !workspace.bot_token_slack) {
            throw new Error('Workspace not configured for Slack');
        }

        // Post a message to the chat channel that the session has ended
        try {
            await this.slackService.postMessage(
                workspace.bot_token_slack,
                session.channel_id,
                `Chat session ended`
            );

            console.log("🚀 ~ ChatSessionService ~ endChatSession ~ sessionId:", sessionId)
            await this.noResponseTracker.trackUserMessage(sessionId, false);
        } catch (error) {
            console.error('Error sending message to Slack channel:', error);
            throw new Error('Failed to send message to Slack channel');
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
}