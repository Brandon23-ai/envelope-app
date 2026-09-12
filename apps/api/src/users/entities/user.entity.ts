import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  password: string | null;

  // `type: Date` (the constructor, not a string): unlike omitting `type` and
  // relying on reflected design:type, this also works for a nullable
  // `Date | null` property, where TypeScript's decorator metadata can only
  // ever report the union as `Object`.
  @Column({ type: Date, nullable: true })
  emailVerifiedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
