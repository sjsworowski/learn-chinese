import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailReminder } from '../entities/email-reminder.entity';
import { User } from '../entities/user.entity';
import { StatsService } from '../stats/stats.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class EmailReminderService {
    constructor(
        @InjectRepository(EmailReminder)
        private emailReminderRepository: Repository<EmailReminder>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private statsService: StatsService,
        private emailService: EmailService
    ) { }

    async checkAndSendReminders(): Promise<{
        usersWithRemindersEnabled: number;
        remindersSent: number;
        skippedAlreadySentToday: number;
        skippedStreakIncreased: number;
        errors: number;
    }> {
        const summary = {
            usersWithRemindersEnabled: 0,
            remindersSent: 0,
            skippedAlreadySentToday: 0,
            skippedStreakIncreased: 0,
            errors: 0,
        };
        console.log('Starting daily email reminder check...');

        const users = await this.userRepository.find({
            where: { emailRemindersEnabled: true }
        });

        summary.usersWithRemindersEnabled = users.length;
        console.log(`Found ${users.length} users with email reminders enabled`);

        for (const user of users) {
            const result = await this.checkUserStreak(user);
            if (result === 'sent') summary.remindersSent++;
            else if (result === 'skipped_already_sent') summary.skippedAlreadySentToday++;
            else if (result === 'skipped_streak_increased') summary.skippedStreakIncreased++;
            else if (result === 'error') summary.errors++;
        }

        console.log('Daily reminders summary:', summary);
        return summary;
    }

    private async checkUserStreak(user: User): Promise<'sent' | 'skipped_already_sent' | 'skipped_streak_increased' | 'error'> {
        try {
            const stats = await this.statsService.getStatsForUser(user.id);
            const currentStreak = stats.currentStreak;

            let reminder = await this.emailReminderRepository.findOne({
                where: { userId: user.id }
            });

            if (!reminder) {
                reminder = this.emailReminderRepository.create({
                    userId: user.id,
                    enabled: true,
                    lastStreakCount: 0
                });
                await this.emailReminderRepository.save(reminder);
            }

            const todayUtc = new Date().toISOString().slice(0, 10);
            const lastSentUtc = reminder.lastReminderSent?.toISOString().slice(0, 10);
            if (lastSentUtc === todayUtc) {
                return 'skipped_already_sent';
            }

            if (currentStreak <= reminder.lastStreakCount) {
                console.log(`Sending reminder to user ${user.email} - streak: ${currentStreak}`);
                const sent = await this.sendReminderEmail(user, currentStreak);
                if (sent) {
                    await this.updateLastReminderSent(reminder.id, currentStreak);
                    return 'sent';
                }
                return 'error';
            }

            await this.updateLastStreakCount(reminder.id, currentStreak);
            return 'skipped_streak_increased';
        } catch (error) {
            console.error(`Error checking streak for user ${user.email}:`, error);
            return 'error';
        }
    }

    private async sendReminderEmail(user: User, currentStreak: number): Promise<boolean> {
        const subject = `Don't break your ${currentStreak}-day streak! 🔥`;
        const html = this.generateReminderEmail(user, currentStreak);

        try {
            await this.emailService.sendEmail(user.email, subject, html);
            console.log(`Reminder email sent to ${user.email}`);
            return true;
        } catch (error) {
            console.error(`Failed to send reminder email to ${user.email}:`, error);
            return false;
        }
    }

    private generateReminderEmail(user: User, streak: number): string {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        if (streak === 0) {
            // Email for users with 0 streak - encouraging them to start fresh
            return `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
                        <h1 style="margin: 0; font-size: 28px;">🌟 Time to Start Fresh!</h1>
                        <p style="margin: 10px 0 0 0; font-size: 18px;">Your Chinese learning journey awaits</p>
                    </div>
                    
                    <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #333; margin-top: 0;">Hi there!</h2>
                        <p style="color: #555; font-size: 16px; line-height: 1.6;">
                            It's been a while since your last study session. Don't worry - every great learning journey starts with a single step!
                        </p>
                        
                        <p style="color: #555; font-size: 16px; line-height: 1.6;">
                            Take just <strong>5 minutes</strong> today to get back into your Chinese learning routine. 
                            You'll be amazed at how quickly you can pick up where you left off!
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${frontendUrl}" 
                               style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); 
                                      color: white; 
                                      padding: 15px 30px; 
                                      text-decoration: none; 
                                      border-radius: 25px; 
                                      font-size: 16px; 
                                      font-weight: bold;
                                      display: inline-block;
                                      box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);">
                                🚀 Start Learning
                            </a>
                        </div>
                        
                        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #2e7d32; margin-top: 0;">💡 Perfect for Getting Started:</h3>
                            <ul style="color: #555; margin: 0; padding-left: 20px;">
                                <li>Review your vocabulary progress</li>
                                <li>Take a gentle test to warm up</li>
                                <li>Listen to pronunciation</li>
                                <li>Set a new learning goal</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px; padding: 20px; border-top: 1px solid #eee;">
                        <p style="color: #666; font-size: 12px; margin: 0;">
                            <a href="${frontendUrl}/profile" style="color: #667eea;">Manage email preferences</a>
                        </p>
                    </div>
                </div>
            `;
        } else {
            // Email for users with existing streak - encouraging them to maintain it
            return `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
                        <h1 style="margin: 0; font-size: 28px;">🔥 ${streak}-Day Streak!</h1>
                        <p style="margin: 10px 0 0 0; font-size: 18px;">Don't let it slip away!</p>
                    </div>
                    
                    <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #333; margin-top: 0;">Hi there!</h2>
                        <p style="color: #555; font-size: 16px; line-height: 1.6;">
                            You're on an amazing <strong>${streak}-day learning streak</strong>! 
                            That's incredible progress in your Chinese learning journey.
                        </p>
                        
                        <p style="color: #555; font-size: 16px; line-height: 1.6;">
                            Take just <strong>5 minutes</strong> to study today and keep your momentum going. 
                            Every day counts towards your language goals!
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${frontendUrl}" 
                               style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); 
                                      color: white; 
                                      padding: 15px 30px; 
                                      text-decoration: none; 
                                      border-radius: 25px; 
                                      font-size: 16px; 
                                      font-weight: bold;
                                      display: inline-block;
                                      box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);">
                                🚀 Study Now
                            </a>
                        </div>
                        
                        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #2e7d32; margin-top: 0;">💡 Quick Study Tips:</h3>
                            <ul style="color: #555; margin: 0; padding-left: 20px;">
                                <li>Review 10 vocabulary words</li>
                                <li>Take a quick test</li>
                                <li>Practice pronunciation</li>
                                <li>Listen to Chinese audio</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px; padding: 20px; border-top: 1px solid #eee;">
                        <p style="color: #666; font-size: 12px; margin: 0;">
                            <a href="${frontendUrl}/profile" style="color: #667eea;">Manage email preferences</a>
                        </p>
                    </div>
                </div>
            `;
        }
    }

    private async updateLastReminderSent(reminderId: string, currentStreak: number) {
        await this.emailReminderRepository.update(reminderId, {
            lastReminderSent: new Date(),
            lastStreakCount: currentStreak
        });
    }

    private async updateLastStreakCount(reminderId: string, currentStreak: number) {
        await this.emailReminderRepository.update(reminderId, {
            lastStreakCount: currentStreak
        });
    }

    async getUserReminderSettings(userId: string) {
        const reminder = await this.emailReminderRepository.findOne({
            where: { userId }
        });

        return {
            enabled: reminder?.enabled ?? true,
            lastReminderSent: reminder?.lastReminderSent,
            lastStreakCount: reminder?.lastStreakCount ?? 0
        };
    }

    async updateUserReminderSettings(userId: string, enabled: boolean) {
        let reminder = await this.emailReminderRepository.findOne({
            where: { userId }
        });

        if (!reminder) {
            reminder = this.emailReminderRepository.create({
                userId,
                enabled,
                lastStreakCount: 0
            });
        } else {
            reminder.enabled = enabled;
        }

        await this.emailReminderRepository.save(reminder);

        // Also update user table
        await this.userRepository.update(userId, {
            emailRemindersEnabled: enabled
        });

        return { success: true, enabled };
    }

    async sendTestReminderEmail(userId: string) {
        try {
            const user = await this.userRepository.findOne({
                where: { id: userId }
            });

            if (!user) {
                throw new Error('User not found');
            }

            // Get current streak for the test email
            const stats = await this.statsService.getStatsForUser(userId);
            const currentStreak = stats.currentStreak;

            // Send test email
            await this.sendReminderEmail(user, currentStreak);

            return {
                success: true,
                message: `Test reminder email sent to ${user.email}`,
                streak: currentStreak
            };
        } catch (error) {
            console.error('Failed to send test reminder email:', error);
            throw new Error(`Failed to send test email: ${error.message}`);
        }
    }
} 