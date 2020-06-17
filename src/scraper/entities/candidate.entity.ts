import { Entity, PrimaryGeneratedColumn, BaseEntity, CreateDateColumn, UpdateDateColumn, Column, Unique } from 'typeorm';

@Entity()
@Unique(['userId'])
export class CandidateEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column()
  userId: number;

  @Column()
  position: string;

  @Column()
  sessionState: string;
}
