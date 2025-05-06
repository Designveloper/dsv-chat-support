import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/users.entity';
import { EavEntityType } from '../eav/entities/eav-entity-type.entity';

@Entity('workspace')
export class WorkSpace {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'integer' })
  owner_id: number;

  @Column({ type: 'integer', nullable: false })
  entity_type_id: number;

  @Column({ type: 'varchar', nullable: true })
  selected_channel_id: string;

  @Column({ type: 'varchar', nullable: true })
  bot_token_slack: string; // Slack bot token

  @Column({ type: 'varchar', nullable: true })
  service_type_slack: string; // e.g., "slack"

  @Column({ type: 'varchar', nullable: true })
  service_slack_account_id: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.workSpaces)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @ManyToOne(() => EavEntityType, (entityType) => entityType.workSpaces)
  @JoinColumn({ name: 'entity_type_id' })
  entityType: EavEntityType;

  chatSessions: any;
}