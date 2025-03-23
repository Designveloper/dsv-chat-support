import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatWidget } from './chat-widgets.entity';
import { ChatWidgetsService } from './chat-widgets.service';
import { ChatWidgetsController } from './chat-widgets.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ChatWidget])],
  providers: [ChatWidgetsService],
  controllers: [ChatWidgetsController],
  exports: [ChatWidgetsService],
})
export class ChatWidgetsModule { }