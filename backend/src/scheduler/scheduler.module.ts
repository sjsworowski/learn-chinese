import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { EmailReminderModule } from '../email-reminder/email-reminder.module';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        EmailReminderModule
    ],
    providers: [SchedulerService],
    exports: [SchedulerService]
})
export class SchedulerModule {}