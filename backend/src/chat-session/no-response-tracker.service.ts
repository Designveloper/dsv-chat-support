import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ChatSessionService } from './chat-session.service';
import { WorkspaceSettingsService, WORKSPACE_SETTINGS } from 'src/eav/workspace-settings.service';
import { SlackService } from '../slack/slack.service';
import { differenceInSeconds } from 'date-fns';
import { ChatServiceFactory } from 'src/adapters/chat-service.factory';

const activeTimer = new Map<string, NodeJS.Timeout>();
const lastUserMessageTime = new Map<string, Date>();
const sessionHasReply = new Map<string, boolean>();

@Injectable()
export class NoResponseTrackerService {
    constructor(
        @Inject(forwardRef(() => ChatSessionService))
        private chatSessionService: ChatSessionService,
        private workspaceSettingsService: WorkspaceSettingsService,
        private chatServiceFactory: ChatServiceFactory,
    ) { }

    async trackUserMessage(sessionId: string, isUserMessage: boolean): Promise<void> {
        console.log("🚀 ~ NoResponseTrackerService ~ trackUserMessage ~ isUserMessage:", isUserMessage)
        console.log("🚀 ~ NoResponseTrackerService ~ trackUserMessage ~ sessionId:", sessionId)
        console.log("🚀 ~ NoResponseTrackerService ~ trackUserMessage ~ activeTimer:", activeTimer)

        if (!isUserMessage) {
            console.log('Staff message received');
            sessionHasReply.set(sessionId, true);
            console.log("🚀 ~ NoResponseTrackerService ~ trackUserMessage ~ activeTimer.has(sessionId):", activeTimer.has(sessionId))
            if (activeTimer.has(sessionId)) {
                clearTimeout(activeTimer.get(sessionId));
                activeTimer.delete(sessionId);
                console.log('Timer cleared for staff response');
            }
            return;
        }
        console.log("🚀 ~ NoResponseTrackerService ~ trackUserMessage ~ activeTimer:", activeTimer)

        const session = await this.chatSessionService.findSessionBySessionId(sessionId);
        if (!session || session.status !== 'active' || !session.channel_id) return;

        lastUserMessageTime.set(sessionId, new Date());

        if (activeTimer.has(sessionId)) {
            clearTimeout(activeTimer.get(sessionId));
            activeTimer.delete(sessionId);
        }

        const workspace = await this.chatSessionService.findWorkspaceById(session.workspace_id);
        if (!workspace) return;

        const noResponseAction = await this.workspaceSettingsService.getStringSetting(
            session.workspace_id,
            WORKSPACE_SETTINGS.NO_RESPONSE_ACTION,
            'no warnings'
        );

        if (noResponseAction === 'send warning') {
            const noResponseDelay = await this.workspaceSettingsService.getStringSetting(
                session.workspace_id,
                WORKSPACE_SETTINGS.NO_RESPONSE_DELAY,
                '30sec'
            );

            const delayMs = this.parseDelayToMs(noResponseDelay);
            this.startWarningTimer(session, delayMs);
        }
    }

    private parseDelayToMs(delay: string): number {
        switch (delay) {
            case '30sec':
                return 30 * 1000;
            case '1min':
                return 60 * 1000;
            case '2min':
                return 2 * 60 * 1000;
            case '5min':
                return 5 * 60 * 1000;
            default:
                return 30 * 1000;
        }
    }

    private startWarningTimer(session: any, delayMs: number): void {
        const timer = setTimeout(async () => {
            if (sessionHasReply.get(session.session_id)) {
                this.clearSessionTracking(session.session_id);
                return;
            }

            await this.sendWarningMessage(session);

            this.startWarningTimer(session, delayMs);
        }, delayMs);

        activeTimer.set(session.session_id, timer);
    }

    private async sendWarningMessage(session: any): Promise<void> {
        try {
            const workspace = await this.chatSessionService.findWorkspaceById(session.workspace_id);
            if (!workspace || !workspace.bot_token) return;

            const updatedSession = await this.chatSessionService.findSessionBySessionId(session.session_id);
            if (!updatedSession || updatedSession.status !== 'active') {
                this.clearSessionTracking(session.session_id);
                return;
            }

            const elapsedSeconds = differenceInSeconds(new Date(), lastUserMessageTime.get(session.session_id) || new Date());
            const formattedTime = this.formatElapsedTime(elapsedSeconds);

            // Use the adapter pattern to get the appropriate service
            const chatService = await this.chatServiceFactory.getChatServiceAdapter(workspace);

            // Send the message using the correct service adapter
            await chatService.sendMessage(
                session.channel_id,
                `:exclamation: No reply sent after ${formattedTime}.`,
                workspace.bot_token
            );
        } catch (error) {
            console.error('Error sending warning message:', error);
        }
    }

    private formatElapsedTime(seconds: number): string {
        if (seconds < 60) {
            return `${seconds} seconds`;
        } else {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')} minutes`;
        }
    }

    clearSessionTracking(sessionId: string): void {
        if (activeTimer.has(sessionId)) {
            console.log(`Clearing timer for session ${sessionId}`);
            clearTimeout(activeTimer.get(sessionId));
            console.log(`Timer cleared for session ${sessionId}`);
            activeTimer.delete(sessionId);
        }
        lastUserMessageTime.delete(sessionId);
        sessionHasReply.delete(sessionId);
    }
}