import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartnerSettings } from '../entities/partner-settings.entity';
import { User } from '../entities/user.entity';
import { UserActivity } from '../entities/user-activity.entity';
import { Vocabulary } from '../entities/vocabulary.entity';
import { PartnerService } from './partner.service';
import { PartnerController } from './partner.controller';
import { EmailService } from '../email/email.service';
import { StatsModule } from '../stats/stats.module';
import { UserProgress } from '../entities/user-progress.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([PartnerSettings, User, UserActivity, UserProgress, Vocabulary]),
        StatsModule
    ],
    providers: [PartnerService, EmailService],
    controllers: [PartnerController],
    exports: [PartnerService]
})
export class PartnerModule { }