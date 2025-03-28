import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { WorkSpace } from '../workspace/workspace.entity';

@Entity('chat_sessions')
export class ChatSession {
    @PrimaryColumn({ type: 'uuid' })
    session_id: string;

    @Column({ type: 'varchar' })
    workspace_id: string;

    @Column({ type: 'varchar', nullable: true })
    channel_id: string; // Slack channel ID (e.g., "C1234567890")

    @Column({ nullable: true })
    user_email?: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    started_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    ended_at: Date;

    @Column({
        type: 'enum',
        enum: ['active', 'closed', "offline"],
        default: 'active',
    })
    status: string;

    @ManyToOne(() => WorkSpace, (workspace) => workspace.id)
    @JoinColumn({ name: 'workspace_id' })
    workspace: WorkSpace;
}