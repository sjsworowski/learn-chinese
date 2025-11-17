import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProgress } from '../entities/user-progress.entity';
import { Vocabulary } from '../entities/vocabulary.entity';
import { TestSession } from '../entities/test-session.entity';
import { UserActivity } from '../entities/user-activity.entity';
import { SpeedChallengeScore } from '../entities/speed-challenge-score.entity';
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
        @InjectRepository(SpeedChallengeScore)
        private speedChallengeScoreRepository: Repository<SpeedChallengeScore>,
        private sessionProgressService: SessionProgressService
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

        // Calculate current streak: consecutive days with at least one 'study' activity
        // Count backwards from the most recent day with activity (not requiring today to be active)
        const studyActivities = activityLogs
            .filter(log => log.type === 'study')
            .map(log => new Date(log.createdAt));

        // Get unique days (YYYY-MM-DD) with study activity
        const daysSet = new Set(studyActivities.map(date => date.toISOString().slice(0, 10)));
        const daysArr = Array.from(daysSet).sort(); // ascending order

        let streak = 0;
        
        if (daysArr.length > 0) {
            // Start from the most recent day with activity (last in sorted array)
            const mostRecentDay = daysArr[daysArr.length - 1];
            const parseDate = (dateStr: string): Date => {
                const [year, month, day] = dateStr.split('-').map(Number);
                return new Date(year, month - 1, day);
            };
            
            let currentDate = parseDate(mostRecentDay);
            currentDate.setHours(0, 0, 0, 0);
            
            // Count consecutive days backwards from the most recent day with activity
            for (; ;) {
                const ymd = currentDate.toISOString().slice(0, 10);
                if (daysSet.has(ymd)) {
                    streak++;
                    // Move to previous day
                    currentDate.setDate(currentDate.getDate() - 1);
                } else {
                    break;
                }
            }
        }
        
        const currentStreak = streak;

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

    async recordSpeedChallenge(userId: string, data: { score: number; timeUsed: number }) {
        // Save the score to the database
        const scoreRecord = this.speedChallengeScoreRepository.create({
            userId,
            score: data.score,
            timeUsed: data.timeUsed
        });
        await this.speedChallengeScoreRepository.save(scoreRecord);

        console.log(`Speed Challenge Score: ${data.score} in ${data.timeUsed}s for user ${userId}`);
        return { success: true, score: data.score };
    }

    async getSpeedChallengeHighScore(userId: string) {
        const highScore = await this.speedChallengeScoreRepository
            .createQueryBuilder('score')
            .where('score.userId = :userId', { userId })
            .orderBy('score.score', 'DESC')
            .addOrderBy('score.timeUsed', 'ASC') // If same score, prefer faster time
            .getOne();

        return highScore ? highScore.score : 0;
    }

    async clearSpeedChallengeScores(userId: string) {
        await this.speedChallengeScoreRepository.delete({ userId });
        return { success: true, message: 'Speed challenge scores cleared successfully' };
    }

    async getStreakDetails(userId: string) {
        const activityLogs = await this.userActivityRepository.find({ where: { userId } });
        
        // Helper function to get YYYY-MM-DD in local timezone (consistent across all calculations)
        const getLocalDateString = (date: Date): string => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        // Get all activities (study and test) and convert to local date strings
        const allActivities = activityLogs.map(log => new Date(log.createdAt));
        const daysSet = new Set(allActivities.map(date => getLocalDateString(date)));
        const daysArr = Array.from(daysSet).sort(); // ascending order for longest streak calculation

        // Calculate current streak (starting from most recent day with activity, counting backwards)
        let currentStreak = 0;
        
        if (daysArr.length > 0) {
            // Start from the most recent day with activity (last in sorted array)
            const mostRecentDay = daysArr[daysArr.length - 1];
            const parseDate = (dateStr: string): Date => {
                const [year, month, day] = dateStr.split('-').map(Number);
                return new Date(year, month - 1, day);
            };
            
            let currentDate = parseDate(mostRecentDay);
            currentDate.setHours(0, 0, 0, 0);
            
            // Count consecutive days backwards from the most recent day with activity
            for (; ;) {
                const ymd = getLocalDateString(currentDate);
                if (daysSet.has(ymd)) {
                    currentStreak++;
                    currentDate.setDate(currentDate.getDate() - 1);
                } else {
                    break;
                }
            }
        }

        // Calculate longest streak
        let longestStreak = 0;
        if (daysArr.length > 0) {
            let tempStreak = 1;
            // Parse date strings and convert to Date objects for comparison
            const parseDate = (dateStr: string): Date => {
                const [year, month, day] = dateStr.split('-').map(Number);
                return new Date(year, month - 1, day);
            };
            
            let prevDate = parseDate(daysArr[0]);
            
            for (let i = 1; i < daysArr.length; i++) {
                const currentDay = parseDate(daysArr[i]);
                const daysDiff = Math.floor((currentDay.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
                
                if (daysDiff === 1) {
                    // Consecutive day
                    tempStreak++;
                } else {
                    // Gap found, reset streak
                    longestStreak = Math.max(longestStreak, tempStreak);
                    tempStreak = 1;
                }
                prevDate = currentDay;
            }
            longestStreak = Math.max(longestStreak, tempStreak);
        }

        // Get last 30 days activity (including today) - using local timezone
        const last30Days: { date: string; hasActivity: boolean }[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Generate last 30 days (29 days ago to today = 30 days total)
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const ymd = getLocalDateString(date);
            last30Days.push({
                date: ymd,
                hasActivity: daysSet.has(ymd)
            });
        }
        
        // Debug log to verify data
        console.log(`Streak details for user ${userId}:`, {
            totalActivities: activityLogs.length,
            uniqueDays: daysSet.size,
            last30DaysCount: last30Days.filter(d => d.hasActivity).length
        });

        return {
            currentStreak,
            longestStreak: longestStreak || currentStreak,
            last30Days
        };
    }
} 