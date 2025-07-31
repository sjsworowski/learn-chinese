import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { UserProgress } from '../entities/user-progress.entity';
import { Vocabulary } from '../entities/vocabulary.entity';
import { TestSession } from '../entities/test-session.entity';
import { UserActivity } from '../entities/user-activity.entity';
import { SpeedChallengeScore } from '../entities/speed-challenge-score.entity';
import { SessionProgressModule } from '../session-progress/session-progress.module';
import { SessionProgressService } from '../session-progress/session-progress.service';

@Module({
    imports: [TypeOrmModule.forFeature([
        UserProgress,
        Vocabulary,
        TestSession,
        UserActivity,
        SpeedChallengeScore
    ]), SessionProgressModule],
    controllers: [StatsController],
    providers: [StatsService, SessionProgressService],
})
export class StatsModule { } 