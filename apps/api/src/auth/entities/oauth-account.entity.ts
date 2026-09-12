import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';

@Entity('oauth_accounts')
@Unique(['provider', 'providerUserId'])
export class OAuthAccount {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar' })
  provider: string;

  @Column({ type: 'varchar' })
  providerUserId: string;

  @Column({ type: 'varchar' })
  providerEmail: string;

  // `type: Date`: see the comment on User.emailVerifiedAt.
  @Column({ type: Date })
  linkedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
