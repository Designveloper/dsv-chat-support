import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkSpace } from './workspace.entity';
import { v4 as uuidv4 } from 'uuid';
import { EavService } from '../eav/eav.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class WorkspaceService {
  constructor(
    @InjectRepository(WorkSpace)
    private workspacesRepository: Repository<WorkSpace>,
    private eavService: EavService,
  ) { }

  async create(ownerId: number, name: string, serviceType?: string, entityTypeId: number = 1): Promise<WorkSpace> {
    const id = uuidv4();
    const workspace = this.workspacesRepository.create({
      id,
      name,
      owner_id: ownerId,
      service_type: serviceType,
      entity_type_id: entityTypeId,
    });
    return this.workspacesRepository.save(workspace);
  }

  async updateSlackDetails(
    workspaceId: string,
    botToken: string,
    selectedChannelId: string,
  ): Promise<WorkSpace> {
    const workspace = await this.workspacesRepository.findOne({ where: { id: workspaceId } });
    if (!workspace) {
      throw new Error('Workspace not found');
    }
    workspace.bot_token = botToken;
    workspace.selected_channel_id = selectedChannelId;
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

  async findAll(): Promise<WorkSpace[]> {
    return this.workspacesRepository.find();
  }

  async getOrCreateEntityType(name: string, description: string) {
    return this.eavService.getOrCreateEntityType(name, description);
  }

  async updateMattermostDetails(
    workspaceId: string,
    serverUrl: string,
    username: string,
    password: string,
    token: string,
    teamId?: string,
    botToken?: string
  ): Promise<WorkSpace> {
    const workspace = await this.findById(workspaceId);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    workspace.server_url = serverUrl;
    workspace.service_username = username;
    workspace.service_password = hashedPassword;
    workspace.service_type = 'mattermost';
    workspace.service_token = token;

    if (botToken) {
      workspace.bot_token = botToken;
    }

    if (teamId) {
      workspace.service_team_id = teamId;
    }

    return this.workspacesRepository.save(workspace);
  }

  // Add a method to update just the bot token
  async updateMattermostBotToken(
    workspaceId: string,
    botToken: string
  ): Promise<WorkSpace> {
    const workspace = await this.findById(workspaceId);
    workspace.bot_token = botToken;
    return this.workspacesRepository.save(workspace);
  }

  async updateMattermostChannel(workspaceId: string, channelId: string): Promise<WorkSpace> {
    const workspace = await this.findById(workspaceId);
    workspace.selected_channel_id = channelId;
    return this.workspacesRepository.save(workspace);
  }

  async updateMattermostTeamId(
    workspaceId: string,
    teamId: string
  ): Promise<WorkSpace> {
    const workspace = await this.findById(workspaceId);
    workspace.service_team_id = teamId;
    return this.workspacesRepository.save(workspace);
  }

  async updateMattermostTeam(workspaceId: string, teamId: string): Promise<void> {
    await this.workspacesRepository.update(
      { id: workspaceId },
      { service_team_id: teamId }
    );
  }
}