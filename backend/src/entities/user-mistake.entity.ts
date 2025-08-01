import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Vocabulary } from './vocabulary.entity';

export enum TestType {
    TEST = 'test',
    PINYIN_TEST = 'pinyin-test',
    LISTEN_TEST = 'listen-test'
}

@Entity()
export class UserMistake {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    user: User;

    @Column()
    userId: string;

    @ManyToOne(() => Vocabulary, { onDelete: 'CASCADE' })
    word: Vocabulary;

    @Column()
    wordId: string;

    @Column({
        type: 'enum',
        enum: TestType
    })
    testType: TestType;

    @CreateDateColumn()
    createdAt: Date;
} 