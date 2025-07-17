import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionProgress } from '../entities/session-progress.entity';
import { SessionProgressService } from './session-progress.service';
import { SessionProgressController } from './session-progress.controller';
import { Vocabulary } from '../entities/vocabulary.entity';

@Module({
    imports: [TypeOrmModule.forFeature([SessionProgress, Vocabulary])],
    providers: [SessionProgressService],
    controllers: [SessionProgressController],
    exports: [
        SessionProgressService,
        TypeOrmModule // <-- Export repositories for DI in other modules
    ]
})
export class SessionProgressModule { } 