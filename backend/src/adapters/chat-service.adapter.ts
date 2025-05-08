import { Server } from 'socket.io';

export interface ChatServiceAdapter {
    authenticate?(username?: string, password?: string): Promise<boolean>;

    listChannels(teamId?: string): Promise<any[]>;
    joinChannel(channelId: string, botToken?: string): Promise<void>;
    createChannel(channelName: string, botToken?: string, teamId?: string): Promise<string>;

    sendMessage(channelId: string, text: string | any[], botToken?: string, username?: string): Promise<void>;

    setupMessageListener?(server: Server, sessionMapping: Map<string, string[]>, messageHandler: Function): void;

    formatWelcomeMessage(
        sessionId: string,
        message: string,
        userInfo: { email?: string, userId?: string } | undefined,
        referer: string,
        location: string,
        localTime: string,
        channelId: string
    ): string | any[];

    formatNotificationMessage(
        channelName: string,
        sessionId: string,
        message: string,
        userInfo: { email?: string, userId?: string } | undefined,
        referer: string,
        location: string,
        localTime: string,
        channelId: string
    ): string | any[];

    formatOfflineMessage(
        sessionId: string,
        message: string,
        email: string,
        name: string | undefined,
        referer: string,
        location: string,
        localTime: string
    ): string | any[];

    getToken?(): string;

    isWorkspaceOnline?(workspaceId: string): Promise<boolean>;
}