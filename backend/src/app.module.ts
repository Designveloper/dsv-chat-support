import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from './mailer/mailer.module';
import { getDatabaseConfig } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RefreshTokensModule } from './refresh-tokens/refresh-tokens.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { SlackModule } from './slack/slack.module';
import { ChatSessionModule } from './chat-session/chat-session.module';
import { EavModule } from './eav/eav.module';
import { MattermostModule } from './mattermost/mattermost.module';
import { AdaptersModule } from './adapters/adapters.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MailerModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => getDatabaseConfig(configService),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    RefreshTokensModule,
    WorkspaceModule,
    SlackModule,
    ChatSessionModule,
    EavModule,
    MattermostModule,
    AdaptersModule,
  ],
})
export class AppModule { }