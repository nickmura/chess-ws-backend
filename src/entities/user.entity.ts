import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryColumn()
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nickname: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
