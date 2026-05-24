import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailReminder } from '../entities/email-reminder.entity';
import { User } from '../entities/user.entity';
import { UserActivity } from '../entities/user-activity.entity';
import { EmailReminderService } from './email-reminder.service';
import { EmailReminderController } from './email-reminder.controller';
import { CronSecretGuard } from './cron-secret.guard';
import { StatsModule } from '../stats/stats.module';
import { EmailService } from '../email/email.service';
import { PartnerModule } from '../partner/partner.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([EmailReminder, User, UserActivity]),
        StatsModule,
        PartnerModule
    ],
    providers: [EmailReminderService, EmailService, CronSecretGuard],
    controllers: [EmailReminderController],
    exports: [EmailReminderService]
})
export class EmailReminderModule { } 