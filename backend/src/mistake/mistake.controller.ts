import { Controller, Post, Get, Body, UseGuards, Request, Delete } from '@nestjs/common';
import { MistakeService } from './mistake.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TestType } from '../entities/user-mistake.entity';

interface RecordMistakeDto {
    wordId: string;
    testType: TestType;
}

@Controller('mistakes')
@UseGuards(JwtAuthGuard)
export class MistakeController {
    constructor(private readonly mistakeService: MistakeService) { }

    @Post('record')
    async recordMistake(@Request() req, @Body() body: RecordMistakeDto) {
        try {
            await this.mistakeService.recordMistake(req.user.id, body.wordId, body.testType);
            return { success: true };
        } catch (error) {
            console.error('Error in recordMistake controller:', error);
            throw error;
        }
    }

    @Get()
    async getUserMistakes(@Request() req) {
        return this.mistakeService.getUserMistakes(req.user.id);
    }

    @Get('count')
    async getMistakeCount(@Request() req) {
        const count = await this.mistakeService.getMistakeCount(req.user.id);
        return { count };
    }

    @Get('unique-words')
    async getUniqueMistakeWords(@Request() req) {
        const wordIds = await this.mistakeService.getUniqueMistakeWords(req.user.id);
        return { wordIds };
    }

    @Delete()
    async clearMistakes(@Request() req) {
        await this.mistakeService.clearMistakes(req.user.id);
        return { success: true };
    }
} 