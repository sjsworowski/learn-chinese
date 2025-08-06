import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmailReminderService } from '../email-reminder/email-reminder.service';

@Injectable()
export class SchedulerService {
    private readonly logger = new Logger(SchedulerService.name);

    constructor(
        private emailReminderService: EmailReminderService
    ) { }

    @Cron(CronExpression.EVERY_DAY_AT_6PM, {
        name: 'daily-email-reminders',
        timeZone: 'UTC'
    })
    async handleDailyEmailReminders() {
        this.logger.log('Starting daily email reminder check...');

        try {
            await this.emailReminderService.checkAndSendReminders();
            this.logger.log('Daily email reminders completed successfully');
        } catch (error) {
            this.logger.error('Failed to send daily email reminders:', error);
        }
    }

    // Manual trigger endpoint for testing
    async triggerDailyReminders() {
        this.logger.log('Manually triggering daily email reminders...');
        await this.emailReminderService.checkAndSendReminders();
        return { success: true, message: 'Daily reminders triggered manually' };
    }
}