import { Controller, Get, Post, Param, UseGuards, Request, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VocabularyService } from './vocabulary.service';

@UseGuards(JwtAuthGuard)
@Controller('vocabulary')
export class VocabularyController {
    constructor(private vocabService: VocabularyService) { }

    @Get()
    async getAllForUser(@Request() req) {
        return this.vocabService.getAllForUser(req.user.id);
    }

    @Get('recently-learned')
    async getRecentlyLearnedForUser(@Request() req) {
        return this.vocabService.getRecentlyLearnedForUser(req.user.id);
    }

    @Post(':id/learn')
    async markAsLearned(@Request() req, @Param('id') id: string) {
        return this.vocabService.markAsLearned(req.user.id, id);
    }

    @Post('reset-progress')
    async resetProgress(@Request() req) {
        return this.vocabService.resetProgress(req.user.id);
    }

    @Post('activity')
    async logUserActivity(@Request() req, @Body() body: { type: 'study' | 'test'; duration?: number }) {
        return this.vocabService.logUserActivity(req.user.id, body.type, body.duration);
    }
} 