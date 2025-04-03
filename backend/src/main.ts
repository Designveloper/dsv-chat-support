import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { SlackBoltService } from './slack/slack-bolt.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: true, // Allow all origins in development
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    },
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  app.use(cookieParser());

  const slackBoltService = app.get(SlackBoltService);
  slackBoltService.attachToNestApp(app);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
