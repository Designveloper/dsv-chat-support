import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkSpace } from './workspace.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WorkspaceService {
  constructor(
    @InjectRepository(WorkSpace)
    private workspacesRepository: Repository<WorkSpace>,
  ) { }

  async create(ownerId: number, name: string, serviceType?: string, entityTypeId: number = 1): Promise<WorkSpace> {
    const id = uuidv4();
    const workspace = this.workspacesRepository.create({
      id,
      name,
      owner_id: ownerId,
      service_type_slack: serviceType,
      entity_type_id: entityTypeId,
    });
    return this.workspacesRepository.save(workspace);
  }

  async updateSlackDetails(
    workspaceId: string,
    botToken: string,
    selectedChannelId: string,
    slackWorkspaceId: string,
  ): Promise<WorkSpace> {
    const workspace = await this.workspacesRepository.findOne({ where: { id: workspaceId } });
    if (!workspace) {
      throw new Error('Workspace not found');
    }
    workspace.bot_token_slack = botToken;
    workspace.selected_channel_id = selectedChannelId;
    workspace.service_slack_account_id = slackWorkspaceId;
    console.log('Updating workspace:', workspace);
    return this.workspacesRepository.save(workspace);
  }

  async findByOwnerId(ownerId: number): Promise<WorkSpace[]> {
    return this.workspacesRepository.find({
      where: { owner_id: ownerId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<WorkSpace> {
    const workspace = await this.workspacesRepository.findOne({ where: { id } });
    if (!workspace) {
      throw new Error('Workspace not found');
    }
    return workspace;
  }

  async findBySlackWorkspaceId(slackWorkspaceId: string): Promise<WorkSpace | null> {
    return this.workspacesRepository.findOne({
      where: { service_slack_account_id: slackWorkspaceId }
    });
  }

  async findAll(): Promise<WorkSpace[]> {
    return this.workspacesRepository.find();
  }

}