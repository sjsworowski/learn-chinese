import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionProgress } from '../entities/session-progress.entity';
import { Vocabulary } from '../entities/vocabulary.entity';

@Injectable()
export class SessionProgressService {
    constructor(
        @InjectRepository(SessionProgress)
        private sessionProgressRepository: Repository<SessionProgress>,
        @InjectRepository(Vocabulary)
        private vocabRepository: Repository<Vocabulary>,
    ) { }

    async getSessionProgress(userId: string) {
        // First verify the user exists
        const userRepo = this.sessionProgressRepository.manager.getRepository('User');
        const user = await userRepo.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error(`User with ID ${userId} not found`);
        }

        let sessionProgress = await this.sessionProgressRepository.findOne({
            where: { userId }
        });

        // Calculate totalSessions based on vocabulary count and session size
        const totalWords = await this.vocabRepository.count();
        const sessionSize = 10;
        const totalSessions = Math.ceil(totalWords / sessionSize);

        if (!sessionProgress) {
            sessionProgress = this.sessionProgressRepository.create({
                userId,
                currentSession: 0,
                totalSessions,
                totalStudyTime: 0,
                lastStudied: new Date()
            });
            await this.sessionProgressRepository.save(sessionProgress);
        } else {
            sessionProgress.totalSessions = totalSessions;
            await this.sessionProgressRepository.save(sessionProgress);
        }

        return sessionProgress;
    }

    async updateSessionProgress(userId: string, data: Partial<SessionProgress>) {
        let sessionProgress = await this.sessionProgressRepository.findOne({
            where: { userId }
        });

        // Calculate totalSessions based on vocabulary count and session size
        const totalWords = await this.vocabRepository.count();
        const sessionSize = 10;
        const totalSessions = Math.ceil(totalWords / sessionSize);

        if (!sessionProgress) {
            sessionProgress = this.sessionProgressRepository.create({
                userId,
                currentSession: 0,
                totalSessions,
                totalStudyTime: 0,
                lastStudied: new Date(),
                ...data
            });
        } else {
            Object.assign(sessionProgress, data);
            sessionProgress.totalSessions = totalSessions;
            sessionProgress.lastStudied = new Date();
        }

        return await this.sessionProgressRepository.save(sessionProgress);
    }

    async resetSessionProgress(userId: string) {
        await this.sessionProgressRepository.delete({ userId });
        return { success: true };
    }
} 