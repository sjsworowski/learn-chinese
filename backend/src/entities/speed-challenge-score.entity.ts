import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('speed_challenge_scores')
export class SpeedChallengeScore {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    user: User;

    @Column()
    score: number;

    @Column()
    timeUsed: number;

    @CreateDateColumn()
    createdAt: Date;
} 