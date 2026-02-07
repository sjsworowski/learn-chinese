import { Controller, Get, Put, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmailReminderService } from './email-reminder.service';
import { CronSecretGuard } from './cron-secret.guard';

@Controller('email-reminders')
export class EmailReminderController {
    constructor(private emailReminderService: EmailReminderService) { }

    @Get('settings')
    @UseGuards(JwtAuthGuard)
    async getReminderSettings(@Request() req) {
        return this.emailReminderService.getUserReminderSettings(req.user.id);
    }

    @Put('settings')
    @UseGuards(JwtAuthGuard)
    async updateReminderSettings(@Request() req, @Body() body: { enabled: boolean }) {
        return this.emailReminderService.updateUserReminderSettings(req.user.id, body.enabled);
    }

    /** Called by in-process cron. For cloud: use POST /email-reminders/cron/daily with X-Cron-Secret header. */
    @Post('send-daily')
    @UseGuards(JwtAuthGuard)
    async sendDailyReminders() {
        return this.emailReminderService.checkAndSendReminders();
    }

    /**
     * Internal cron endpoint for cloud deployments.
     * In serverless or sleeping instances the in-process cron never runs.
     * Call this from an external scheduler (e.g. cron-job.org) daily with:
     *   Method: POST
     *   Header: X-Cron-Secret: <your CRON_SECRET env var>
     * GET returns 200 so URL validators (e.g. cron-job.org) accept the URL; the job must use POST.
     */
    @Get('cron/daily')
    cronDailyRemindersGet() {
        return { ok: true, message: 'Use POST with X-Cron-Secret header to trigger daily reminders.' };
    }

    @Post('cron/daily')
    @UseGuards(CronSecretGuard)
    async cronDailyReminders() {
        return this.emailReminderService.checkAndSendReminders();
    }

    @Get('test')
    @UseGuards(JwtAuthGuard)
    async testReminderSettings(@Request() req) {
        const settings = await this.emailReminderService.getUserReminderSettings(req.user.id);
        return {
            message: 'Email reminder settings retrieved successfully',
            settings,
            userId: req.user.id
        };
    }

    @Post('send-test-email')
    @UseGuards(JwtAuthGuard)
    async sendTestEmail(@Request() req) {
        return this.emailReminderService.sendTestReminderEmail(req.user.id);
    }

    @Post('trigger-daily')
    @UseGuards(JwtAuthGuard)
    async triggerDailyReminders() {
        return this.emailReminderService.checkAndSendReminders();
    }
} 