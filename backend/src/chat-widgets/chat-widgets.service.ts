import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatWidget } from './chat-widgets.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ChatWidgetsService {
  constructor(
    @InjectRepository(ChatWidget)
    private chatWidgetsRepository: Repository<ChatWidget>,
  ) { }

  async create(ownerId: number): Promise<ChatWidget> {
    const widgetId = uuidv4();
    const chatWidget = this.chatWidgetsRepository.create({ widget_id: widgetId, owner_id: ownerId });
    return this.chatWidgetsRepository.save(chatWidget);
  }

  async findByOwnerId(ownerId: number): Promise<ChatWidget[]> {
    return this.chatWidgetsRepository.find({
      where: { owner_id: ownerId },
      order: { createdAt: 'DESC' }
    });
  }
}