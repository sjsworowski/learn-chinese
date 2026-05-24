import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { PartnerSettings } from '../entities/partner-settings.entity';
import { User } from '../entities/user.entity';
import { UserActivity } from '../entities/user-activity.entity';
import { Vocabulary } from '../entities/vocabulary.entity';
import { EmailService } from '../email/email.service';
import { StatsService } from '../stats/stats.service';
import { UserProgress } from '../entities/user-progress.entity';

@Injectable()
export class PartnerService {
    constructor(
        @InjectRepository(PartnerSettings)
        private partnerSettingsRepository: Repository<PartnerSettings>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(UserActivity)
        private userActivityRepository: Repository<UserActivity>,
        @InjectRepository(Vocabulary)
        private vocabularyRepository: Repository<Vocabulary>,
        @InjectRepository(UserProgress)
        private userProgressRepository: Repository<UserProgress>,
        private emailService: EmailService,
        private statsService: StatsService
    ) { }

    async getPartnerSettings(userId: string) {
        const settings = await this.partnerSettingsRepository.findOne({
            where: { userId }
        });
        return { email: settings?.email ?? null };
    }

    async updatePartnerSettings(userId: string, email: string) {
        let settings = await this.partnerSettingsRepository.findOne({
            where: { userId }
        });
        if (!settings) {
            settings = this.partnerSettingsRepository.create({ userId, email });
        } else {
            settings.email = email || null;
        }
        await this.partnerSettingsRepository.save(settings);
        return { success: true, email: settings.email };
    }

    async sendTestPartnerEmail(userId: string) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        const settings = await this.partnerSettingsRepository.findOne({
            where: { userId }
        });
        if (!settings?.email) throw new NotFoundException('No partner email set');

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const progressUrl = `${frontendUrl}/partner/${user.id}`;

        await this.emailService.sendEmail(
            settings.email,
            `${user.username} is learning Chinese for you 🇨🇳`,
            this.generateTestEmail(user.username, progressUrl)
        );

        return { success: true, message: `Test email sent to ${settings.email}` };
    }

    async getPublicProgress(userId: string) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        const stats = await this.statsService.getStatsForUser(user.id);
        const streakDetails = await this.statsService.getStreakDetails(user.id);

        const recentProgress = await this.userProgressRepository.find({
            where: { userId: user.id, isLearned: true },
            order: { lastStudied: 'DESC' },
            take: 5,
            relations: ['vocabulary']
        });

        const lastActivity = await this.userActivityRepository.findOne({
            where: { userId: user.id },
            order: { createdAt: 'DESC' }
        });

        return {
            username: user.username,
            learnedWords: stats.learnedWords,
            currentStreak: streakDetails.currentStreak,
            longestStreak: streakDetails.longestStreak,
            testsCompleted: stats.testsCompleted ?? 0,
            lastActive: lastActivity?.createdAt ?? null,
            recentWords: recentProgress
                .filter(p => p.vocabulary)
                .map(p => ({
                    chinese: p.vocabulary.chinese,
                    pinyin: p.vocabulary.pinyin,
                    english: p.vocabulary.english.split(';')[0].trim()
                }))
        };
    }

    // Called from EmailReminderService cron — checks all users with partner emails
    async checkAndSendAllPartnerReminders() {
        const allPartnerSettings = await this.partnerSettingsRepository.find({
            where: { email: Not(IsNull()) },
            relations: ['user']
        });

        for (const settings of allPartnerSettings) {
            try {
                await this.checkAndSendPartnerReminder(settings.user, settings);
            } catch (err) {
                console.error(`Partner reminder error for user ${settings.userId}:`, err);
            }
        }
    }

    async checkAndSendPartnerReminder(user: User, settings?: PartnerSettings) {
        const partnerSettings = settings ?? await this.partnerSettingsRepository.findOne({
            where: { userId: user.id }
        });

        if (!partnerSettings?.email) return;

        const lastActivity = await this.userActivityRepository.findOne({
            where: { userId: user.id },
            order: { createdAt: 'DESC' }
        });

        const hoursSinceActive = lastActivity
            ? (Date.now() - new Date(lastActivity.createdAt).getTime()) / (1000 * 60 * 60)
            : 999;

        if (hoursSinceActive >= 48) {
            const daysSince = Math.floor(hoursSinceActive / 24);
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const progressUrl = `${frontendUrl}/partner/${user.id}`;

            await this.emailService.sendEmail(
                partnerSettings.email,
                `${user.username} hasn't practised Chinese in ${daysSince} day${daysSince !== 1 ? 's' : ''} 📚`,
                this.generateReminderEmail(user.username, daysSince, progressUrl)
            );

            console.log(`Partner reminder sent to ${partnerSettings.email} for user ${user.email}`);
        }
    }

    private generateTestEmail(username: string, progressUrl: string): string {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: #1a1a1a; color: white; padding: 30px; border-radius: 10px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px;">🇨🇳 Chinese Learning Updates</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.8;">You've been added as a learning partner</p>
                </div>
                <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 10px 10px;">
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi!</p>
                    <p style="color: #555; font-size: 16px; line-height: 1.6;">
                        <strong>${username}</strong> has added you as their learning partner. 
                        You'll receive a friendly nudge if they haven't practised in a while.
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${progressUrl}"
                           style="background: #1a1a1a; color: white; padding: 15px 30px; 
                                  text-decoration: none; border-radius: 8px; font-size: 16px; 
                                  font-weight: bold; display: inline-block;">
                            See their progress →
                        </a>
                    </div>
                    <p style="color: #999; font-size: 13px;">They're learning Chinese for someone special 💛</p>
                </div>
            </div>
        `;
    }

    private generateReminderEmail(username: string, daysSince: number, progressUrl: string): string {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: #1a1a1a; color: white; padding: 30px; border-radius: 10px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px;">📚 Study Reminder</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.8;">${username} could use a nudge</p>
                </div>
                <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 10px 10px;">
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi!</p>
                    <p style="color: #555; font-size: 16px; line-height: 1.6;">
                        Just a heads up — <strong>${username}</strong> hasn't practised their Mandarin 
                        in <strong>${daysSince} day${daysSince !== 1 ? 's' : ''}</strong>. 
                        Maybe give them a nudge? 😊
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${progressUrl}"
                           style="background: #1a1a1a; color: white; padding: 15px 30px; 
                                  text-decoration: none; border-radius: 8px; font-size: 16px; 
                                  font-weight: bold; display: inline-block;">
                            See their progress →
                        </a>
                    </div>
                    <p style="color: #999; font-size: 13px;">They're learning Chinese for someone special 💛</p>
                </div>
            </div>
        `;
    }
}