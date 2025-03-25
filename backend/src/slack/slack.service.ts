import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebClient } from '@slack/web-api';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SlackService {
    constructor(
        private configService: ConfigService,
        private httpService: HttpService,
    ) { }

    async exchangeCodeForToken(code: string, redirectUri: string): Promise<any> {
        const clientId = this.configService.get('SLACK_CLIENT_ID');
        const clientSecret = this.configService.get('SLACK_CLIENT_SECRET');
        const response = await firstValueFrom(
            this.httpService.post('https://slack.com/api/oauth.v2.access', null, {
                params: {
                    code,
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uri: redirectUri,
                },
            }),
        );
        return response.data;
    }

    async createChannel(botToken: string, channelName: string): Promise<string> {
        const web = new WebClient(botToken);
        const result = await web.conversations.create({ name: channelName });
        if (!result.channel) {
            throw new Error('Channel creation failed: channel is undefined.');
        }
        if (!result.channel.id) {
            throw new Error('Channel creation failed: channel ID is undefined.');
        }
        return result.channel.id;
    }

    async postMessage(botToken: string, channelId: string, text: string): Promise<void> {
        const web = new WebClient(botToken);
        await web.chat.postMessage({ channel: channelId, text });
    }

    async listChannels(botToken: string): Promise<any[]> {
        const web = new WebClient(botToken);

        // Get public channels that the bot is in or can join
        const result = await web.conversations.list({
            exclude_archived: true,
            types: 'public_channel'
        });

        if (!result.ok) {
            throw new Error(result.error || 'Unknown error listing channels');
        }

        if (!result.channels) {
            throw new Error('Failed to list channels: channels are undefined.');
        }

        return result.channels.map(channel => ({
            id: channel.id,
            name: channel.name,
            is_member: channel.is_member,
            num_members: channel.num_members
        }));
    }

    // Helper method to join a channel if needed
    async joinChannel(botToken: string, channelId: string): Promise<void> {
        const web = new WebClient(botToken);
        await web.conversations.join({ channel: channelId });
    }
}