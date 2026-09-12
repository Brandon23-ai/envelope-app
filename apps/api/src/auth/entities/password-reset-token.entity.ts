import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';

@Entity('password_reset_tokens')
export class PasswordResetToken {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', unique: true })
  tokenHash: string;

  // `type: Date` on these Date columns: see the comment on
  // User.emailVerifiedAt.
  @Column({ type: Date })
  expiresAt: Date;

  @Column({ type: Date, nullable: true })
  usedAt: Date | null;

  // No @UpdateDateColumn() — immutable record, matches Laravel's `const UPDATED_AT = null`.
  @CreateDateColumn()
  createdAt: Date;
}
