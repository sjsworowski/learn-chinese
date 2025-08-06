import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailReminder } from '../entities/email-reminder.entity';
import { User } from '../entities/user.entity';
import { EmailReminderService } from './email-reminder.service';
import { EmailReminderController } from './email-reminder.controller';
import { StatsModule } from '../stats/stats.module';
import { EmailService } from '../email/email.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([EmailReminder, User]),
        StatsModule
    ],
    providers: [EmailReminderService, EmailService],
    controllers: [EmailReminderController],
    exports: [EmailReminderService]
})
export class EmailReminderModule { } 