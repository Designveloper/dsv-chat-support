import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { RefreshToken } from '../refresh-tokens/refresh-tokens.entity';
import { WorkSpace } from '../workspace/workspace.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  confirmationCode: string;

  @Column({ default: false })
  isEmailConfirmed: boolean;

  @Column({ nullable: true })
  resetCode: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshToken: RefreshToken[];

  @OneToMany(() => WorkSpace, (workSpace) => workSpace.owner)
  workSpaces: WorkSpace[];
}
