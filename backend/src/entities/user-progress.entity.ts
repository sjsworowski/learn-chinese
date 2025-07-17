import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Vocabulary } from './vocabulary.entity';

@Entity()
export class UserProgress {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @Column()
    vocabularyId: string;

    @Column({ default: false })
    isLearned: boolean;

    @Column({ default: 0 })
    studyCount: number;

    @Column({ type: 'datetime', nullable: true })
    lastStudied: Date;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => User, user => user.progress)
    @JoinColumn({ name: 'userId' })
    user: User;

    @ManyToOne(() => Vocabulary, vocabulary => vocabulary.userProgress)
    @JoinColumn({ name: 'vocabularyId' })
    vocabulary: Vocabulary;
} 