import { Controller, Get, Put, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmailReminderService } from './email-reminder.service';

@UseGuards(JwtAuthGuard)
@Controller('email-reminders')
export class EmailReminderController {
    constructor(private emailReminderService: EmailReminderService) { }

    @Get('settings')
    async getReminderSettings(@Request() req) {
        return this.emailReminderService.getUserReminderSettings(req.user.id);
    }

    @Put('settings')
    async updateReminderSettings(@Request() req, @Body() body: { enabled: boolean }) {
        return this.emailReminderService.updateUserReminderSettings(req.user.id, body.enabled);
    }

    @Post('send-daily')
    async sendDailyReminders() {
        // This endpoint can be called by external schedulers (Cloud Functions, etc.)
        return this.emailReminderService.checkAndSendReminders();
    }

    @Get('test')
    async testReminderSettings(@Request() req) {
        // Test endpoint to verify the service works
        const settings = await this.emailReminderService.getUserReminderSettings(req.user.id);
        return {
            message: 'Email reminder settings retrieved successfully',
            settings,
            userId: req.user.id
        };
    }

    @Post('send-test-email')
    async sendTestEmail(@Request() req) {
        // Send a test reminder email to the current user
        return this.emailReminderService.sendTestReminderEmail(req.user.id);
    }

    @Post('trigger-daily')
    async triggerDailyReminders() {
        // This endpoint can be called manually for testing
        return this.emailReminderService.checkAndSendReminders();
    }
} 