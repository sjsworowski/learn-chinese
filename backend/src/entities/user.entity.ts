import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { UserProgress } from './user-progress.entity';
import { SessionProgress } from './session-progress.entity';
import { TestSession } from './test-session.entity';

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column()
    username: string;

    @Column({ nullable: true })
    password: string;

    @Column({ default: true })
    emailRemindersEnabled: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => UserProgress, userProgress => userProgress.user)
    progress: UserProgress[];

    @OneToMany(() => SessionProgress, sessionProgress => sessionProgress.user)
    sessionProgress: SessionProgress[];

    @OneToMany(() => TestSession, testSession => testSession.user)
    testSessions: TestSession[];
} 