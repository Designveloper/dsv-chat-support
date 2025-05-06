// src/mailer/mailer.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule as NestMailerModule } from '@nestjs-modules/mailer';
import { getMailerConfig } from './mailer.config';

@Module({
    imports: [
        NestMailerModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => getMailerConfig(configService),
            inject: [ConfigService],
        }),
    ],
    exports: [NestMailerModule],
})
export class MailerModule { }