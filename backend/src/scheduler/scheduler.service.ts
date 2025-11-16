import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmailReminderService } from '../email-reminder/email-reminder.service';

@Injectable()
export class SchedulerService implements OnModuleInit {
    private readonly logger = new Logger(SchedulerService.name);

    constructor(
        private emailReminderService: EmailReminderService
    ) { }

    onModuleInit() {
        // This ensures the service is instantiated when the module loads
        this.logger.log('SchedulerService initialized - cron jobs registered');
        this.logger.log('Cron job scheduled: daily-email-reminders (every minute for testing)');
    }

    @Cron(CronExpression.EVERY_DAY_AT_8PM, {
        name: 'daily-email-reminders',
        timeZone: 'UTC'
    })

    // @Cron('* * * * *', { // every minute for testing
    //     name: 'daily-email-reminders',
    //     timeZone: 'UTC'
    // })
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