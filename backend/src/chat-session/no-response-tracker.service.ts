import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ChatSessionService } from './chat-session.service';
import { WorkspaceSettingsService, WORKSPACE_SETTINGS } from 'src/eav/workspace-settings.service';
import { SlackService } from '../slack/slack.service';
import { differenceInSeconds } from 'date-fns';

@Injectable()
export class NoResponseTrackerService {
    private activeTimers = new Map<string, NodeJS.Timeout>();
    private lastUserMessageTime = new Map<string, Date>();
    private sessionHasReply = new Map<string, boolean>();

    constructor(
        @Inject(forwardRef(() => ChatSessionService))
        private chatSessionService: ChatSessionService,
        private workspaceSettingsService: WorkspaceSettingsService,
        private slackService: SlackService,
    ) { }

    async trackUserMessage(sessionId: string, isUserMessage: boolean): Promise<void> {
        console.log("🚀 ~ NoResponseTrackerService ~ trackUserMessage ~ isUserMessage:", isUserMessage)
        console.log("🚀 ~ NoResponseTrackerService ~ trackUserMessage ~ sessionId:", sessionId)
        console.log("🚀 ~ NoResponseTrackerService ~ trackUserMessage ~ this.activeTimers:", this.activeTimers)

        if (!isUserMessage) {
            console.log('Staff message received');
            this.sessionHasReply.set(sessionId, true);
            console.log("🚀 ~ NoResponseTrackerService ~ trackUserMessage ~ this.activeTimers.has(sessionId):", this.activeTimers.has(sessionId))
            if (this.activeTimers.has(sessionId)) {
                clearTimeout(this.activeTimers.get(sessionId));
                this.activeTimers.delete(sessionId);
                console.log('Timer cleared for staff response');
            }
            return;
        }
        console.log("🚀 ~ NoResponseTrackerService ~ trackUserMessage ~ this.activeTimers:", this.activeTimers)

        const session = await this.chatSessionService.findSessionBySessionId(sessionId);
        if (!session || session.status !== 'active' || !session.channel_id) return;

        this.lastUserMessageTime.set(sessionId, new Date());

        if (this.activeTimers.has(sessionId)) {
            clearTimeout(this.activeTimers.get(sessionId));
            this.activeTimers.delete(sessionId);
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
            if (this.sessionHasReply.get(session.session_id)) {
                this.clearSessionTracking(session.session_id);
                return;
            }

            await this.sendWarningMessage(session);

            this.startWarningTimer(session, delayMs);
        }, delayMs);

        this.activeTimers.set(session.session_id, timer);
    }

    private async sendWarningMessage(session: any): Promise<void> {
        try {
            const workspace = await this.chatSessionService.findWorkspaceById(session.workspace_id);
            if (!workspace || !workspace.bot_token_slack) return;

            const updatedSession = await this.chatSessionService.findSessionBySessionId(session.session_id);
            if (!updatedSession || updatedSession.status !== 'active') {
                this.clearSessionTracking(session.session_id);
                return;
            }

            const elapsedSeconds = differenceInSeconds(new Date(), this.lastUserMessageTime.get(session.session_id) || new Date());

            const formattedTime = this.formatElapsedTime(elapsedSeconds);

            await this.slackService.postMessage(
                workspace.bot_token_slack,
                session.channel_id,
                `:exclamation: No reply sent after ${formattedTime}.`
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
        if (this.activeTimers.has(sessionId)) {
            console.log(`Clearing timer for session ${sessionId}`);
            clearTimeout(this.activeTimers.get(sessionId));
            console.log(`Timer cleared for session ${sessionId}`);
            this.activeTimers.delete(sessionId);
        }
        this.lastUserMessageTime.delete(sessionId);
        this.sessionHasReply.delete(sessionId);
    }
}