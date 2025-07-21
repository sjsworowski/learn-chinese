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
import { HealthController } from './health.controller';

@Module({
    imports: [
        TypeOrmModule.forRoot(
            process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')
                ? {
                    type: 'postgres',
                    url: process.env.DATABASE_URL,
                    ssl: { rejectUnauthorized: false },
                    entities: [
                        User,
                        UserProgress,
                        SessionProgress,
                        Vocabulary,
                        TestSession,
                        UserActivity
                    ],
                    synchronize: false, // Keep false for production safety
                }
                : {
                    type: 'postgres',
                    host: process.env.POSTGRES_HOST || 'localhost',
                    port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
                    username: process.env.POSTGRES_USER || 'postgres',
                    password: process.env.POSTGRES_PASSWORD || 'postgres',
                    database: process.env.POSTGRES_DB || 'postgres',
                    entities: [
                        User,
                        UserProgress,
                        SessionProgress,
                        Vocabulary,
                        TestSession,
                        UserActivity
                    ],
                    synchronize: false, // Keep false for production safety
                }
        ),
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'process.env.JWT_SECRET',
            signOptions: { expiresIn: '7d' },
        }),
        PassportModule,
        AuthModule,
        VocabularyModule,
        StatsModule,
        SessionProgressModule,
    ],
    controllers: [HealthController],
})
export class AppModule { } 