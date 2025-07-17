import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class SessionProgress {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @Column({ default: 0 })
    currentSession: number;

    @Column({ default: 0 })
    totalSessions: number;

    @Column({ default: 0 })
    totalStudyTime: number;

    @Column({ type: 'datetime', nullable: true })
    lastStudied: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => User, user => user.sessionProgress)
    @JoinColumn({ name: 'userId' })
    user: User;
} 