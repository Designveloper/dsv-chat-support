import { Server } from 'socket.io';

export interface ChatServiceAdapter {
    authenticate(): Promise<boolean>;

    listChannels(): Promise<any[]>;
    joinChannel(channelId: string): Promise<void>;
    createChannel(channelName: string): Promise<string>;

    sendMessage(channelId: string, message: string): Promise<void>;

    disconnect(): Promise<void>;
}