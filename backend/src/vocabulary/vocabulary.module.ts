import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VocabularyController } from './vocabulary.controller';
import { VocabularyService } from './vocabulary.service';
import { Vocabulary } from '../entities/vocabulary.entity';
import { UserProgress } from '../entities/user-progress.entity';
import { SessionProgress } from '../entities/session-progress.entity';
import { TestSession } from '../entities/test-session.entity';
import { UserActivity } from '../entities/user-activity.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Vocabulary, UserProgress, SessionProgress, TestSession, UserActivity])],
    controllers: [VocabularyController],
    providers: [VocabularyService],
})
export class VocabularyModule { } 