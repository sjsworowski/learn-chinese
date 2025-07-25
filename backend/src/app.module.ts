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
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TtsController } from './tts/tts.controller';
import { TtsService } from './tts/tts.service';

@Module({
  imports: [
    // Load environment variables from .env
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Dynamic TypeORM config
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isCloud = config.get<string>('DATABASE_URL')?.startsWith('postgres');

        return isCloud
          ? {
              type: 'postgres',
              url: config.get<string>('DATABASE_URL'),
              ssl: { rejectUnauthorized: false },
              entities: [
                User,
                UserProgress,
                SessionProgress,
                Vocabulary,
                TestSession,
                UserActivity,
              ],
              synchronize: false,
            }
          : {
              type: 'postgres',
              host: config.get<string>('POSTGRES_HOST', 'localhost'),
              port: parseInt(config.get<string>('POSTGRES_PORT', '5432'), 10),
              username: config.get<string>('POSTGRES_USER', 'postgres'),
              password: config.get<string>('POSTGRES_PASSWORD', 'postgres'),
              database: config.get<string>('POSTGRES_DB', 'postgres'),
              ssl: false,
              entities: [
                User,
                UserProgress,
                SessionProgress,
                Vocabulary,
                TestSession,
                UserActivity,
              ],
              synchronize: false,
            };
      },
    }),

    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'fallback-secret'),
        signOptions: { expiresIn: '7d' },
      }),
    }),

    PassportModule,
    AuthModule,
    VocabularyModule,
    StatsModule,
    SessionProgressModule,
  ],
  controllers: [HealthController, TtsController],
  providers: [TtsService],
})
export class AppModule {}