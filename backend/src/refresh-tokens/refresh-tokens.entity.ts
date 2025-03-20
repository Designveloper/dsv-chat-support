import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/users.entity';

@Entity('refresh_token')
export class RefreshToken {
  @PrimaryColumn()
  refresh_token: string;

  @Column()
  user_id: number;

  @Column({ type: 'timestamp' })
  expires_time: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @ManyToOne(() => User, (user) => user.refreshToken)
  @JoinColumn({ name: 'user_id' })
  user: User;
}