import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/users.entity';

@Entity('chat_widgets')
export class ChatWidget {
  @PrimaryColumn()
  widget_id: string;

  @Column()
  owner_id: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.chatWidgets)
  @JoinColumn({ name: 'owner_id' })
  owner: User;
}