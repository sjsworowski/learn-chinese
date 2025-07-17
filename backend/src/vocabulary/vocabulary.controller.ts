import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VocabularyService } from './vocabulary.service';

@UseGuards(JwtAuthGuard)
@Controller('vocabulary')
export class VocabularyController {
    constructor(private vocabService: VocabularyService) { }

    @Get()
    async getAll(@Request() req) {
        return this.vocabService.getAllForUser(req.user.userId);
    }

    @Get('recently-learned')
    async getRecentlyLearned(@Request() req) {
        return this.vocabService.getRecentlyLearnedForUser(req.user.userId);
    }

    @Post(':id/learn')
    async markAsLearned(@Request() req, @Param('id') id: string) {
        return this.vocabService.markAsLearned(req.user.userId, id);
    }

    @Post('reset')
    async resetProgress(@Request() req) {
        return this.vocabService.resetProgress(req.user.userId);
    }

    @Post('log-activity')
    async logActivity(@Request() req) {
        const { type, duration } = req.body;
        return this.vocabService.logUserActivity(req.user.userId, type, duration);
    }
} 