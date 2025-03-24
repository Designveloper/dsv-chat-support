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
}