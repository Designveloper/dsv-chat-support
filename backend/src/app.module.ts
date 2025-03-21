import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from './mailer/mailer.module';
import { getDatabaseConfig } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RefreshTokensModule } from './refresh-tokens/refresh-tokens.module';
import { ChatWidgetsModule } from './chat-widgets/chat-widgets.module';

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
    ChatWidgetsModule,
  ],
})
export class AppModule { }