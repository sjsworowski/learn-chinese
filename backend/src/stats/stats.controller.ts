import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StatsService } from './stats.service';

@UseGuards(JwtAuthGuard)
@Controller('stats')
export class StatsController {
    constructor(private statsService: StatsService) { }

    @Get()
    async getStats(@Request() req) {
        return this.statsService.getStatsForUser(req.user.userId);
    }

    @Post('session')
    async saveSession(@Request() req, @Body() sessionData: { sessionTime: number; wordsStudied: number; wordsLearned: number }) {
        return this.statsService.saveSession(req.user.userId, sessionData);
    }

    @Post('test-completed')
    async recordTestCompleted(@Request() req) {
        return this.statsService.recordTestCompleted(req.user.userId);
    }
} 