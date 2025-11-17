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

    // Specific routes must come BEFORE parameterized routes
    @Post('reset-progress')
    async resetProgress(@Request() req) {
        return this.vocabService.resetProgress(req.user.id);
    }

    @Post('log-activity')
    async logUserActivityAlias(@Request() req, @Body() body: { type: 'study' | 'test'; duration?: number }) {
        // Alias endpoint to support frontend calls
        console.log(`📥 Received log-activity request: userId=${req.user.id}, type=${body.type}, duration=${body.duration}`);
        return this.vocabService.logUserActivity(req.user.id, body.type, body.duration);
    }

    @Post('activity')
    async logUserActivity(@Request() req, @Body() body: { type: 'study' | 'test'; duration?: number }) {
        console.log(`📥 Received activity request: userId=${req.user.id}, type=${body.type}, duration=${body.duration}`);
        return this.vocabService.logUserActivity(req.user.id, body.type, body.duration);
    }

    // Parameterized routes come LAST
    @Post(':id/learn')
    async markAsLearned(@Request() req, @Param('id') id: string) {
        return this.vocabService.markAsLearned(req.user.id, id);
    }
} 