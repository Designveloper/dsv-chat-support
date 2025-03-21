// src/config/mailer.config.ts
import { ConfigService } from '@nestjs/config';
import { MailerOptions } from '@nestjs-modules/mailer';

export const getMailerConfig = (configService: ConfigService): MailerOptions => ({
    transport: {
        host: configService.get<string>('SMTP_HOST'),
        port: parseInt(configService.get<string>('SMTP_PORT') || '587', 10),
        secure: false,
        auth: {
            user: configService.get<string>('SMTP_USER'),
            pass: configService.get<string>('SMTP_PASS'),
        },
    },
    defaults: {
        from: configService.get<string>('SMTP_FROM'), // Default sender address
    },
});