import { Server } from 'socket.io';

export interface ChatServiceAdapter {
    // Make authenticate parameters optional to work with both implementations
    // authenticate(username?: string, password?: string): Promise<boolean>;

    listChannels(teamId?: string): Promise<any[]>;
    joinChannel(channelId: string, botToken?: string): Promise<void>;
    createChannel(channelName: string, teamId?: string): Promise<string>;

    // Make botToken optional
    sendMessage(channelId: string, text: string, botToken?: string): Promise<void>;

    // Add optional setup for message listeners
    setupMessageListener?(server: Server, sessionMapping: Map<string, string[]>, messageHandler: Function): void;

    formatWelcomeMessage(
        sessionId: string,
        message: string,
        userInfo: { email?: string, userId?: string } | undefined,
        referer: string,
        location: string,
        localTime: string
    ): string | any;

    formatNotificationMessage(
        channelName: string,
        sessionId: string,
        message: string,
        userInfo: { email?: string, userId?: string } | undefined,
        referer: string,
        location: string,
        localTime: string
    ): string | any;

    getToken?(): string;
    // disconnect(): Promise<void>;
}