import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatWidget } from './chat-widgets.entity';
import { ChatWidgetsService } from './chat-widgets.service';

@Module({
  imports: [TypeOrmModule.forFeature([ChatWidget])],
  providers: [ChatWidgetsService],
  exports: [ChatWidgetsService],
})
export class ChatWidgetsModule {}