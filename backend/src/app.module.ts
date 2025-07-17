import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from './auth/auth.module';
import { VocabularyModule } from './vocabulary/vocabulary.module';
import { StatsModule } from './stats/stats.module';
import { SessionProgressModule } from './session-progress/session-progress.module';
import { User } from './entities/user.entity';
import { Vocabulary } from './entities/vocabulary.entity';
import { UserProgress } from './entities/user-progress.entity';
import { SessionProgress } from './entities/session-progress.entity';
import { TestSession } from './entities/test-session.entity';
import { UserActivity } from './entities/user-activity.entity';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'sqlite',
            database: 'chinese-vocab.db',
            entities: [
                User,
                UserProgress,
                SessionProgress,
                Vocabulary,
                TestSession,
                UserActivity
            ],
            synchronize: true,
        }),
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'your-secret-key',
            signOptions: { expiresIn: '7d' },
        }),
        PassportModule,
        AuthModule,
        VocabularyModule,
        StatsModule,
        SessionProgressModule,
    ],
})
export class AppModule { } 