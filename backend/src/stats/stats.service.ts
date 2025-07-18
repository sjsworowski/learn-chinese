import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProgress } from '../entities/user-progress.entity';
import { Vocabulary } from '../entities/vocabulary.entity';
import { TestSession } from '../entities/test-session.entity';
import { UserActivity } from '../entities/user-activity.entity';
import { SessionProgressService } from '../session-progress/session-progress.service';

@Injectable()
export class StatsService {
    constructor(
        @InjectRepository(UserProgress)
        private progressRepository: Repository<UserProgress>,
        @InjectRepository(Vocabulary)
        private vocabRepository: Repository<Vocabulary>,
        @InjectRepository(TestSession)
        private testSessionRepository: Repository<TestSession>,
        @InjectRepository(UserActivity)
        private userActivityRepository: Repository<UserActivity>,
        private sessionProgressService: SessionProgressService // <-- inject here
    ) { }

    async getStatsForUser(userId: string) {
        const totalWords = await this.vocabRepository.count();
        const learnedWords = await this.progressRepository.count({ where: { userId, isLearned: true } });
        const progress = await this.progressRepository.find({ where: { userId } });

        // Count words by difficulty
        const beginnerTotal = await this.vocabRepository.count({ where: { difficulty: 'beginner' } });
        const intermediateTotal = await this.vocabRepository.count({ where: { difficulty: 'intermediate' } });
        const advancedTotal = await this.vocabRepository.count({ where: { difficulty: 'advanced' } });

        // Count learned words by difficulty
        const beginnerLearned = await this.vocabRepository.createQueryBuilder('vocab')
            .innerJoin('user_progress', 'progress', 'progress.vocabularyId = vocab.id AND progress.userId = :userId AND progress.isLearned = true', { userId })
            .where('vocab.difficulty = :difficulty', { difficulty: 'beginner' })
            .getCount();
        const intermediateLearned = await this.vocabRepository.createQueryBuilder('vocab')
            .innerJoin('user_progress', 'progress', 'progress.vocabularyId = vocab.id AND progress.userId = :userId AND progress.isLearned = true', { userId })
            .where('vocab.difficulty = :difficulty', { difficulty: 'intermediate' })
            .getCount();
        const advancedLearned = await this.vocabRepository.createQueryBuilder('vocab')
            .innerJoin('user_progress', 'progress', 'progress.vocabularyId = vocab.id AND progress.userId = :userId AND progress.isLearned = true', { userId })
            .where('vocab.difficulty = :difficulty', { difficulty: 'advanced' })
            .getCount();

        // Sum all UserActivity durations for the user
        const activityLogs = await this.userActivityRepository.find({ where: { userId } });
        const totalStudyTime = activityLogs.reduce((sum, log) => sum + (log.duration || 0), 0);

        const currentStreak = 1;

        // Count tests completed
        const testsCompleted = await this.testSessionRepository.count({ where: { userId } });

        return {
            totalWords,
            learnedWords,
            currentStreak,
            totalStudyTime,
            difficultyCounts: {
                beginner: { total: beginnerTotal, learned: beginnerLearned },
                intermediate: { total: intermediateTotal, learned: intermediateLearned },
                advanced: { total: advancedTotal, learned: advancedLearned }
            },
            testsCompleted
        };
    }

    async saveSession(userId: string, sessionData: { sessionTime: number; wordsStudied: number; wordsLearned: number }) {
        console.log(`Session saved for user ${userId}:`, sessionData);
        return {
            success: true,
            message: 'Session data saved successfully',
            sessionData
        };
    }

    async recordTestCompleted(userId: string) {
        const testSession = this.testSessionRepository.create({ user: { id: userId }, userId });
        await this.testSessionRepository.save(testSession);
        // Increment session progress
        const sessionProgress = await this.sessionProgressService.getSessionProgress(userId);
        await this.sessionProgressService.updateSessionProgress(userId, {
            currentSession: (sessionProgress.currentSession || 0) + 1
        });
        return { success: true };
    }
} 