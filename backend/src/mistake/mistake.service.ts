import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserMistake, TestType } from '../entities/user-mistake.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class MistakeService {
    constructor(
        @InjectRepository(UserMistake)
        private mistakeRepository: Repository<UserMistake>,
    ) { }

    async recordMistake(userId: string, wordId: string, testType: TestType): Promise<void> {
        try {
            // Check if this mistake was already recorded recently (within the same session)
            const recentMistake = await this.mistakeRepository.findOne({
                where: {
                    userId,
                    wordId,
                    testType,
                },
                order: {
                    createdAt: 'DESC',
                },
            });

            // If the same mistake was recorded in the last 5 minutes, don't record it again
            if (recentMistake) {
                const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
                if (recentMistake.createdAt > fiveMinutesAgo) {
                    console.log('Mistake already recorded recently, skipping');
                    return;
                }
            }

            const mistake = this.mistakeRepository.create({
                userId,
                wordId,
                testType,
            });

            await this.mistakeRepository.save(mistake);
        } catch (error) {
            console.error('Error recording mistake:', error);
            throw error;
        }
    }

    async getUserMistakes(userId: string): Promise<UserMistake[]> {
        return this.mistakeRepository.find({
            where: { userId },
            relations: ['word'],
            order: { createdAt: 'DESC' },
        });
    }

    async getMistakeCount(userId: string): Promise<number> {
        return this.mistakeRepository.count({
            where: { userId },
        });
    }

    async getUniqueMistakeWords(userId: string): Promise<string[]> {
        const mistakes = await this.mistakeRepository
            .createQueryBuilder('mistake')
            .select('DISTINCT mistake.wordId', 'wordId')
            .where('mistake.userId = :userId', { userId })
            .getRawMany();

        return mistakes.map(m => m.wordId);
    }

    async clearMistakes(userId: string): Promise<void> {
        await this.mistakeRepository.delete({ userId });
    }
} 