import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MistakeController } from './mistake.controller';
import { MistakeService } from './mistake.service';
import { UserMistake } from '../entities/user-mistake.entity';

@Module({
    imports: [TypeOrmModule.forFeature([UserMistake])],
    controllers: [MistakeController],
    providers: [MistakeService],
    exports: [MistakeService],
})
export class MistakeModule { } 