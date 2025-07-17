import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { UserProgress } from './user-progress.entity';

@Entity()
export class Vocabulary {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    chinese: string;

    @Column()
    pinyin: string;

    @Column()
    english: string;

    @Column()
    imageUrl: string;

    @Column({ default: 'beginner' })
    difficulty: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => UserProgress, userProgress => userProgress.vocabulary)
    userProgress: UserProgress[];
} 