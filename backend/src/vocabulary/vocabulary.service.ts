import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vocabulary } from '../entities/vocabulary.entity';
import { UserProgress } from '../entities/user-progress.entity';
import { SessionProgress } from '../entities/session-progress.entity';
import { TestSession } from '../entities/test-session.entity';
import { UserActivity } from '../entities/user-activity.entity';

@Injectable()
export class VocabularyService {
    constructor(
        @InjectRepository(Vocabulary)
        private vocabRepository: Repository<Vocabulary>,
        @InjectRepository(UserProgress)
        private progressRepository: Repository<UserProgress>,
        @InjectRepository(SessionProgress)
        private sessionProgressRepository: Repository<SessionProgress>,
        @InjectRepository(TestSession)
        private testSessionRepository: Repository<TestSession>,
        @InjectRepository(UserActivity)
        private userActivityRepository: Repository<UserActivity>,
    ) { }

    async getAllForUser(userId: string) {
        const vocab = await this.vocabRepository.find();
        const progress = await this.progressRepository.find({ where: { userId } });
        const progressMap = new Map(progress.map(p => [p.vocabularyId, p]));
        return vocab.map(word => ({
            ...word,
            isLearned: progressMap.get(word.id)?.isLearned || false,
        }));
    }

    async markAsLearned(userId: string, vocabId: string) {
        let progress = await this.progressRepository.findOne({ where: { userId, vocabularyId: vocabId } });
        if (!progress) {
            progress = this.progressRepository.create({ userId, vocabularyId: vocabId, isLearned: true, studyCount: 1, lastStudied: new Date() });
        } else {
            progress.isLearned = true;
            progress.studyCount += 1;
            progress.lastStudied = new Date();
        }
        await this.progressRepository.save(progress);
        return { success: true };
    }

    async resetProgress(userId: string) {
        await this.progressRepository.delete({ userId });
        await this.testSessionRepository.delete({ userId });
        await this.userActivityRepository.delete({ userId });
        return { success: true };
    }

    async getRecentlyLearnedForUser(userId: string) {
        // Get the user's session progress
        const session = await this.sessionProgressRepository.findOne({ where: { userId } });
        if (!session || !session.currentSession) return [];
        const numWords = session.currentSession * 10;
        // Get all learned words, sorted by lastStudied desc
        const progress = await this.progressRepository.find({
            where: { userId, isLearned: true },
            order: { lastStudied: 'DESC' }
        });
        // Take the most recently learned (currentSession * 10) words
        const recentProgress = progress.slice(0, numWords);
        const vocabIds = recentProgress.map(p => p.vocabularyId);
        if (!vocabIds.length) return [];
        const vocab = await this.vocabRepository.findByIds(vocabIds);
        // Mark isLearned for frontend compatibility
        return vocab.map(word => ({ ...word, isLearned: true }));
    }

    async logUserActivity(userId: string, type: 'study' | 'test', duration: number) {
        const activity = this.testSessionRepository.manager.create('UserActivity', {
            userId,
            type,
            duration
        });
        await this.testSessionRepository.manager.save('UserActivity', activity);
        return { success: true };
    }
} 