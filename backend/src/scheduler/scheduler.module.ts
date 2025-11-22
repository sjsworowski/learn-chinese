import { Module, OnModuleInit, Logger } from '@nestjs/common';
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
export class SchedulerModule implements OnModuleInit {
    private readonly logger = new Logger(SchedulerModule.name);

    constructor(private readonly schedulerService: SchedulerService) {
        this.logger.log('SchedulerModule constructor - SchedulerService injected');
    }

    onModuleInit() {
        // Force instantiation by accessing the service
        // This ensures the cron decorators are processed
        this.logger.log('SchedulerModule onModuleInit - SchedulerService should be instantiated');
        // Access the service to ensure it's created
        if (this.schedulerService) {
            this.logger.log('✅ SchedulerService is instantiated - cron jobs should be registered');
            // Explicitly access a method to ensure the service is fully initialized
            // This helps ensure decorators are processed
            try {
                const methodName = 'handleDailyEmailReminders';
                if (typeof this.schedulerService[methodName] === 'function') {
                    this.logger.log(`✅ ${methodName} method exists on SchedulerService`);
                } else {
                    this.logger.error(`❌ ${methodName} method does NOT exist on SchedulerService`);
                }
            } catch (error) {
                this.logger.error('Error checking SchedulerService methods:', error);
            }
        } else {
            this.logger.error('❌ SchedulerService is NOT instantiated');
        }
    }
}